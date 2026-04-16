import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { format } from 'date-fns'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Info } from 'lucide-react'

import { FrontendShell } from '@/components/frontend/FrontendShell'
import OrderFlowersClient from '@/components/frontend/OrderFlowersClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getOrderCompanyName } from '@/lib/companyRemittance'
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

  const { name, location, date } = res

  if (res?.status === '已取消') {
    return (
      <FrontendShell maxWidthClass="max-w-4xl">
        <div className="space-y-8">
          <div className="space-y-4 p-1">
            <Alert variant="default">
              <Info aria-hidden />
              <AlertTitle>此訂單已取消</AlertTitle>
              <AlertDescription>
                訂單已無法繼續選購或付款，以下為訂單明細供您留存參考。
              </AlertDescription>
            </Alert>
          </div>

          <section className="space-y-4 p-1" aria-labelledby="order-cancelled-detail-heading">
            <h2
              id="order-cancelled-detail-heading"
              className="text-sm font-semibold tracking-tight"
            >
              訂單明細
            </h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>往生者: {name ?? '-'}</p>
              <p>日期: {date ? format(new Date(date as string), 'yyyy/MM/dd') : '-'}</p>
              <p>地點: {location ?? '-'}</p>
              <p className="font-medium text-foreground">訂單狀態: 已取消</p>
            </div>
          </section>
        </div>
      </FrontendShell>
    )
  }

  if (res?.status === '待付款' || res?.status === '待確認付款' || res?.status === '待出貨') {
    redirect(`/order/${id}/remittance`)
  }

  const [flowersDocs, funeralCompanyName] = await Promise.all([
    payload.find({
      collection: 'flowers',
      overrideAccess: true,
      user,
    }),
    getOrderCompanyName(payload, res as unknown as Record<string, unknown>),
  ])
  const flowers = flowersDocs.docs

  return (
    <FrontendShell maxWidthClass="max-w-4xl">
      <div className="space-y-8">
        <Card className="rounded-none border-0 bg-[var(--surface-warm)] shadow-none">
          <CardContent className="space-y-1.5 px-4 py-4 text-sm leading-relaxed sm:px-6 sm:text-base">
            <p className="">禮儀公司：{funeralCompanyName}</p>
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
              <Link href={`/order/${id}/cart`} className="inline-flex items-center gap-2">
                前往結帳
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </FrontendShell>
  )
}
