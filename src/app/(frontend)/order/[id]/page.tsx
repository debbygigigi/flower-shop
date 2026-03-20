import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import '../../styles.scss'

import config from '@/payload.config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import OrderFlowersClient from '@/components/frontend/OrderFlowersClient'
import Link from 'next/link'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const headers = await getHeaders()
  const { id } = await params

  console.log('id', id)
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const res = await payload.findByID({
    collection: 'orders',
    id: id,
    overrideAccess: true,
    user,
  })

  const flowersDocs = await payload.find({
    collection: 'flowers',
    overrideAccess: true,
    user,
  })

  const flowers = flowersDocs.docs

  const { name, location, date } = res

  console.log('res', flowers)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2">
      {/* Header Info */}
      <Card className="text-left mb-8 p-2">
        <CardContent>
          <p className="text-sm font-bold">往生者: {name}</p>
          <p className="text-sm">地點: {location}</p>
          <p className="text-sm text-muted-foreground">日期: {format(date, 'yyyy/MM/dd')}</p>
        </CardContent>
      </Card>

      <div>請選擇要致贈的花</div>

      {/* Flower Grid */}
      <OrderFlowersClient orderId={id} flowers={flowers} />

      <Button asChild variant="outline">
        <Link href={`/order/${id}/cart`}>下一步</Link>
      </Button>
    </div>
  )
}
