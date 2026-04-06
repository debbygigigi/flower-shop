'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Info, TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { FrontendShell } from '@/components/frontend/FrontendShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function OrderRemittanceClient({
  orderId,
  order,
  orderedItems,
}: {
  orderId: string
  order: {
    name?: string
    location?: string
    date?: string
    createdAt?: string
    status?: string | null
    amount?: number | null
    last5?: string | null
    proof?: string | null
    flowers?: string[] | null
  }
  orderedItems: Array<{
    flowerId: string
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
}) {
  const router = useRouter()

  const [last5, setLast5] = useState(order?.last5 ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isPaid =
    order?.status === '待確認付款' || order?.status === '已付款' || order?.status === '待出貨'
  const isAwaitingShipment = order?.status === '待出貨'
  const userStatus = order?.status === '待出貨' ? '已確認付款' : (order?.status ?? '-')
  const transferInfo = useMemo(() => {
    const orderCreatedAt = order?.createdAt ? new Date(order.createdAt) : new Date()
    const deadline = new Date(orderCreatedAt)
    deadline.setDate(deadline.getDate() + 3)

    return {
      amountText: `NT$ ${order?.amount?.toLocaleString() ?? '-'}`,
      bankCode: '822',
      bankAccount: '1234-5678-9012-3456',
      accountName: '花禮有限公司',
      deadlineText: `${deadline.getFullYear()}/${String(deadline.getMonth() + 1).padStart(2, '0')}/${String(deadline.getDate()).padStart(2, '0')}`,
    }
  }, [order?.amount, order?.createdAt])
  const submitDisabled = useMemo(() => {
    if (isPaid) return true
    const last5Trim = last5.trim()
    const last5Valid = last5Trim.length === 5 && /^[0-9]{5}$/.test(last5Trim)
    return !last5Valid || !selectedFile
  }, [isPaid, last5, selectedFile])

  const onCancelOrder = useCallback(async () => {
    if (!window.confirm('確定要取消此訂單嗎？')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/order/${orderId}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }
      router.push(`/order/${orderId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  const onSubmit = useCallback(async () => {
    if (submitDisabled) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('last5', last5.trim())
      if (selectedFile) {
        formData.append('proofFile', selectedFile)
      }

      const res = await fetch(`/api/order/${orderId}/payment`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }

      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [orderId, last5, selectedFile, submitDisabled])

  if (success || isPaid) {
    return (
      <FrontendShell maxWidthClass="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">匯款狀態</CardTitle>
            <CardDescription>訂單摘要與您提交的資訊。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="info">
              <Info aria-hidden />
              <AlertTitle>處理中</AlertTitle>
              <AlertDescription>
                {isAwaitingShipment
                  ? '已確認您的匯款，請耐心等待出貨通知。'
                  : '已收到您的匯款資料，請耐心等待工作人員確認匯款，確認後將更新訂單狀態。'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm">
              <p className="font-medium">訂單資訊</p>
              <p>訂單金額: NT$ {order?.amount?.toLocaleString() ?? '-'}</p>
              <p>往生者: {order?.name ?? '-'}</p>
              <p>日期: {order?.date ?? '-'}</p>
              <p>地點: {order?.location ?? '-'}</p>
              <p>訂單狀態: {userStatus}</p>
              <p>匯款後五碼: {last5 || order?.last5 || '-'}</p>
              <p>匯款憑證: {selectedFile?.name ?? '已上傳'}</p>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-sm font-medium">訂購花品</p>
              {orderedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">目前沒有訂購花品資料</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {orderedItems.map((item) => (
                    <li
                      key={item.flowerId}
                      className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="tabular-nums">NT$ {item.subtotal.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!isAwaitingShipment ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => router.push(`/order/${orderId}`)}>
                  返回訂單頁
                </Button>
                <Button variant="secondary" onClick={() => router.push(`/order/${orderId}/remittance`)}>
                  重新查看
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </FrontendShell>
    )
  }

  return (
    <FrontendShell maxWidthClass="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">匯款與上傳憑證</CardTitle>
          <CardDescription>請於期限內完成轉帳並填寫下列資訊。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="warning">
            <TriangleAlert aria-hidden />
            <AlertTitle>繳款期限</AlertTitle>
            <AlertDescription>
              感謝您的訂購！請於下單後 3 天內完成轉帳並上傳匯款資訊，逾期未完成將自動取消訂單。
            </AlertDescription>
          </Alert>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">訂單摘要</p>
            <p>往生者: {order?.name ?? '-'}</p>
            <p>日期: {order?.date ?? '-'}</p>
            <p>地點: {order?.location ?? '-'}</p>
            <p className="text-foreground">訂單金額: NT$ {order?.amount?.toLocaleString() ?? '-'}</p>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium">訂購花品</p>
            {orderedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">目前沒有訂購花品資料</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {orderedItems.map((item) => (
                  <li
                    key={item.flowerId}
                    className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="tabular-nums">NT$ {item.subtotal.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Card className="border-dashed shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">轉帳資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>轉帳金額：{transferInfo.amountText}</p>
              <p>銀行代號：{transferInfo.bankCode}</p>
              <p>轉入銀行帳號：{transferInfo.bankAccount}</p>
              <p>戶名：{transferInfo.accountName}</p>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                繳款期限：{transferInfo.deadlineText}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`remit-last5-${orderId}`}>匯款後五碼</Label>
              <Input
                id={`remit-last5-${orderId}`}
                inputMode="numeric"
                placeholder="請輸入 5 位數字"
                value={last5}
                onChange={(e) => setLast5(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`remit-proof-${orderId}`}>匯款憑證</Label>
              <Input
                id={`remit-proof-${orderId}`}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">支援圖片或 PDF 檔案</p>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" className="[&>svg]:hidden [&_*]:pl-0">
              <AlertTitle>操作失敗</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={onCancelOrder}
              disabled={loading}
              className="text-destructive hover:text-destructive"
            >
              取消訂單
            </Button>
            <Button onClick={onSubmit} disabled={loading || submitDisabled}>
              {loading ? '處理中…' : '送出匯款資訊'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </FrontendShell>
  )
}
