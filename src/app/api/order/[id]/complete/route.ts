import { getPayload } from 'payload'

import { SKIP_ORDER_STATUS_TRANSITION } from '@/collections/Order'
import payloadConfig from '@/payload.config'

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id: orderId } = await params

  try {
    const body = await req.json().catch(() => null)
    const buyerName = String(body?.buyerName ?? '').trim()
    const buyerPhone = String(body?.buyerPhone ?? '').trim()
    if (!buyerName || !buyerPhone) {
      return Response.json({ ok: false, error: '請填寫訂購人姓名與電話' }, { status: 400 })
    }

    const rawItems = Array.isArray(body?.items) ? body.items : []

    const items = rawItems
      .map((it: any) => {
        const flowerId = String(it?.flowerId ?? '')
        const quantity = Number(it?.quantity)
        if (!flowerId) return null
        if (!Number.isFinite(quantity)) return null
        if (quantity <= 0) return null
        return {
          flowerId,
          quantity: Math.min(1000, Math.max(1, Math.floor(quantity))),
        }
      })
      .filter(Boolean) as { flowerId: string; quantity: number }[]

    if (items.length === 0) {
      return Response.json({ ok: false, error: '購物車為空' }, { status: 400 })
    }

    const payloadConfigResolved = await payloadConfig
    const payload = await getPayload({ config: payloadConfigResolved })

    // 以資料庫中的花價計算總金額，避免信任前端資料
    const uniqueFlowerIDs = [...new Set(items.map((it) => it.flowerId))]
    const flowerDocs = await payload.find({
      collection: 'flowers',
      where: {
        id: {
          in: uniqueFlowerIDs,
        },
      },
      limit: uniqueFlowerIDs.length,
      overrideAccess: true,
    })

    const priceById = new Map<string, number>()
    for (const flower of flowerDocs.docs as any[]) {
      const flowerId = String(flower?.id ?? '')
      const price = Number(flower?.price ?? 0)
      if (flowerId) {
        priceById.set(flowerId, Number.isFinite(price) ? price : 0)
      }
    }

    const amount = items.reduce((sum, item) => {
      const price = priceById.get(item.flowerId) ?? 0
      return sum + price * item.quantity
    }, 0)

    // 走 Payload auth：用 request headers 讓 Payload 判斷使用者
    // const { user } = await payload.auth({ headers: req.headers as any })
    // if (!user) {
    //   return Response.json({ ok: false, error: '未授權' }, { status: 401 })
    // }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        orderItems: items.map((it) => ({
          flower: it.flowerId,
          quantity: it.quantity,
        })),
        status: '待付款',
        amount,
        buyerName,
        buyerPhone,
      },
      overrideAccess: true,
      context: {
        [SKIP_ORDER_STATUS_TRANSITION]: true,
      },
    })

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}

