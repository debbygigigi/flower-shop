import { getPayload } from 'payload'

import { SKIP_ORDER_STATUS_TRANSITION } from '@/collections/Order'
import payloadConfig from '@/payload.config'

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params
  console.log('id', id)

  try {
    if (!id) {
      return Response.json({ ok: false, error: '缺少訂單 id' }, { status: 400 })
    }

    const formData = await req.formData()
    const rawLast5 = formData.get('last5')
    const last5 = typeof rawLast5 === 'string' ? rawLast5.trim() : ''
    const proofFile = formData.get('proofFile')

    const last5Valid = last5.length === 5 && /^[0-9]{5}$/.test(last5)
    if (!last5Valid) {
      return Response.json({ ok: false, error: '後五碼格式錯誤（需為 5 位數字）' }, { status: 400 })
    }
    if (!(proofFile instanceof File) || !proofFile.name) {
      return Response.json({ ok: false, error: '請上傳匯款憑證檔案' }, { status: 400 })
    }

    const payloadConfigResolved = await payloadConfig
    const payload = await getPayload({ config: payloadConfigResolved })

    const existing = await payload.findByID({
      collection: 'orders',
      id,
      overrideAccess: true,
    })

    if (existing?.status === '待確認付款') {
      return Response.json({ ok: false, error: '此訂單已提交匯款資訊' }, { status: 400 })
    }

    if (existing?.status !== '待付款' && existing?.status !== '待下單') {
      // 依需求可調整允許狀態
      return Response.json({ ok: false, error: `目前訂單狀態不可付款：${existing?.status ?? '-'}` }, { status: 400 })
    }

    const proofBuffer = Buffer.from(await proofFile.arrayBuffer())
    const payloadFile = {
      data: proofBuffer,
      mimetype: proofFile.type || 'application/octet-stream',
      name: proofFile.name,
      size: proofFile.size ?? proofBuffer.length,
    }

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `order-${id}-payment-proof`,
      },
      file: payloadFile,
      overrideAccess: true,
    })

    await payload.update({
      collection: 'orders',
      id,
      data: {
        last5,
        proof: media?.id,
        status: '待確認付款',
        paymentDate: new Date().toISOString(),
      } as any,
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

