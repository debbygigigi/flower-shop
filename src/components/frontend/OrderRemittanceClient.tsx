'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const userStatus = order?.status === '待出貨' ? '已確認付款' : (order?.status ?? '-')
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
      <div className="min-h-screen flex flex-col items-center justify-center p-2">
        <Card className="max-w-xl w-full">
          <CardHeader>
            {userStatus === '待出貨' ? <CardTitle>已送出匯款資訊</CardTitle> : <CardTitle>已完成匯款</CardTitle>}
          </CardHeader>
          <CardContent>
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

            <div className="mt-4">
              <p className="font-medium text-sm mb-2">訂購花品</p>
              {orderedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">目前沒有訂購花品資料</p>
              ) : (
                <div className="space-y-1 text-sm">
                  {orderedItems.map((item) => (
                    <div key={item.flowerId} className="flex items-center justify-between gap-3">
                      <span>{item.name} x {item.quantity}</span>
                      <span>NT$ {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {userStatus === '待確認付款' ? <p className="mt-4 text-sm text-muted-foreground">
              已收到您的匯款資料，請等待工作人員確認匯款，確認後將更新訂單狀態。
            </p> : null}

            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/order/${orderId}`)}>
                返回訂單頁
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/order/${orderId}/remittance`)}>
                重新查看
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle>匯款資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <div>往生者: {order?.name ?? '-'}</div>
            <div>日期: {order?.date ?? '-'}</div>
            <div>地點: {order?.location ?? '-'}</div>
            <div>訂單金額: NT$ {order?.amount?.toLocaleString() ?? '-'}</div>
          </div>

          <div className="mt-4">
            <p className="font-medium text-sm mb-2">訂購花品</p>
            {orderedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">目前沒有訂購花品資料</p>
            ) : (
              <div className="space-y-1 text-sm">
                {orderedItems.map((item) => (
                  <div key={item.flowerId} className="flex items-center justify-between gap-3">
                    <span>{item.name} x {item.quantity}</span>
                    <span>NT$ {item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">匯款後五碼</div>
              <Input
                inputMode="numeric"
                placeholder="請輸入 5 位數字"
                value={last5}
                onChange={(e) => setLast5(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm font-medium mb-1">匯款憑證</div>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <div className="mt-1 text-xs text-muted-foreground">支援圖片或 PDF 檔案</div>
            </div>
          </div>

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

          <div className="mt-6 flex justify-end gap-2">
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
              {loading ? '處理中...' : '送出匯款資訊'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

