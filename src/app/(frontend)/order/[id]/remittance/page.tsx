import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import type { ComponentProps } from 'react'

import OrderRemittanceClient from '@/components/frontend/OrderRemittanceClient'
import { buildOrderedItems } from '@/lib/orderOrderedItems'
import config from '@/payload.config'

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

  const orderedItems = await buildOrderedItems(payload, order, user)

  return (
    <OrderRemittanceClient
      orderId={id}
      order={order as unknown as ComponentProps<typeof OrderRemittanceClient>['order']}
      orderedItems={orderedItems}
    />
  )
}
