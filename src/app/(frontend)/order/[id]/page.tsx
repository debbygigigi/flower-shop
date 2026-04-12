import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { format } from 'date-fns'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FrontendShell } from '@/components/frontend/FrontendShell'
import OrderFlowersClient from '@/components/frontend/OrderFlowersClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import config from '@/payload.config'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const headers = await getHeaders()
  const { id } = await params

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

  if (res?.status === '已取消') {
    return (
      <FrontendShell maxWidthClass="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">此訂單已取消</CardTitle>
            <CardDescription>以下為訂單基本資訊供您留存參考。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">往生者: {name}</p>
            <p>地點: {location}</p>
            <p className="text-muted-foreground">日期: {format(date, 'yyyy/MM/dd')}</p>
          </CardContent>
        </Card>
      </FrontendShell>
    )
  }

  if (res?.status === '待付款' || res?.status === '待確認付款' || res?.status === '待出貨') {
    redirect(`/order/${id}/remittance`)
  }

  return (
    <FrontendShell maxWidthClass="max-w-4xl">
      <div className="space-y-8">
        <Card className="rounded-none border-0 bg-[var(--surface-warm)] shadow-none">
          <CardContent className="space-y-1.5 px-4 py-4 text-sm leading-relaxed sm:px-6 sm:text-base">
            <p className="">禮儀公司：金麟生命</p>
            <p className="font-medium">往生者: {name}</p>
            <p>地點: {location}</p>
            <p className="">日期: {format(date, 'yyyy/MM/dd')}</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">選擇花品</h2>
            <p className="text-sm text-muted-foreground">請輸入數量後加入購物車。</p>
          </div>
          <Separator />
          <OrderFlowersClient orderId={id} flowers={flowers} />
          <div className="flex justify-end pt-2">
            <Button asChild>
              <Link href={`/order/${id}/cart`}>下一步：確認購物車</Link>
            </Button>
          </div>
        </div>
      </div>
    </FrontendShell>
  )
}
