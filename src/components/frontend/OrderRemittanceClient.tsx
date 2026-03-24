'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function OrderRemittanceClient({
  orderId,
  order,
}: {
  orderId: string
  order: {
    name?: string
    location?: string
    date?: string
    status?: string | null
    last5?: string | null
    proof?: string | null
    flowers?: string[] | null
  }
}) {
  const router = useRouter()

  const [last5, setLast5] = useState(order?.last5 ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isPaid = order?.status === '待確認付款' || order?.status === '已付款'
  const submitDisabled = useMemo(() => {
    if (isPaid) return true
    const last5Trim = last5.trim()
    const last5Valid = last5Trim.length === 5 && /^[0-9]{5}$/.test(last5Trim)
    return !last5Valid || !selectedFile
  }, [isPaid, last5, selectedFile])

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
            <CardTitle>完成下單</CardTitle>
          </CardHeader>
          <CardContent>
            <p>感謝您完成付款與資料填寫。</p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push(`/order/${orderId}/remittance`)}>
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
            <div>地點: {order?.location ?? '-'}</div>
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
            <Button variant="outline" onClick={() => router.push(`/order/${orderId}`)}>
              返回
            </Button>
            <Button onClick={onSubmit} disabled={loading || submitDisabled}>
              {loading ? '處理中...' : '完成下單'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

