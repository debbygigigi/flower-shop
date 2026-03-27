import { getPayload } from 'payload'

import payloadConfig from '@/payload.config'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { id: orderId } = await params

  try {
    if (!orderId) {
      return Response.json({ ok: false, error: '缺少訂單 id' }, { status: 400 })
    }

    const payloadConfigResolved = await payloadConfig
    const payload = await getPayload({ config: payloadConfigResolved })

    const existing = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })

    if (!existing) {
      return Response.json({ ok: false, error: '找不到訂單' }, { status: 404 })
    }

    if (existing.status === '已取消') {
      return Response.json({ ok: true, message: '訂單已取消' })
    }

    if (existing.status !== '待付款') {
      return Response.json(
        { ok: false, error: `目前狀態無法取消訂單：${existing.status ?? '-'}` },
        { status: 400 },
      )
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        status: '已取消',
      },
      overrideAccess: true,
    })

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
