import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import OrderRemittanceClient from '@/components/frontend/OrderRemittanceClient'

export default async function RemittancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const headers = await getHeaders()

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const order = await payload.findByID({
    collection: 'orders',
    id,
    overrideAccess: true,
    user,
  })

  // 尚未完成下單就直接打匯款頁：帶回選花頁
  if (order?.status === '待下單' || !order?.status) {
    redirect(`/order/${id}`)
  }

  // 若訂單已取消：同樣帶回訂單頁由你決定怎麼顯示
  if (order?.status === '已取消') {
    redirect(`/order/${id}`)
  }

  const flowerIDs = Array.isArray(order?.flowers)
    ? order.flowers
        .map((item: any) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object' && item.id) return String(item.id)
          return ''
        })
        .filter(Boolean)
    : []
  const uniqueFlowerIDs = [...new Set(flowerIDs)]

  const flowerDocs =
    uniqueFlowerIDs.length > 0
      ? await payload.find({
          collection: 'flowers',
          where: {
            id: {
              in: uniqueFlowerIDs,
            },
          },
          limit: uniqueFlowerIDs.length,
          overrideAccess: true,
          user,
        })
      : { docs: [] as any[] }

  const flowerMap = new Map<string, { name: string; price: number }>()
  for (const flower of flowerDocs.docs as any[]) {
    flowerMap.set(String(flower?.id), {
      name: String(flower?.name ?? '未命名花品'),
      price: Number(flower?.price ?? 0),
    })
  }

  const countMap = new Map<string, number>()
  for (const flowerId of flowerIDs) {
    countMap.set(flowerId, (countMap.get(flowerId) ?? 0) + 1)
  }

  const orderedItems = Array.from(countMap.entries()).map(([flowerId, quantity]) => {
    const flower = flowerMap.get(flowerId)
    const price = flower?.price ?? 0
    return {
      flowerId,
      name: flower?.name ?? flowerId,
      quantity,
      price,
      subtotal: price * quantity,
    }
  })

  return <OrderRemittanceClient orderId={id} order={order as any} orderedItems={orderedItems} />
}

