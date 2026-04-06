'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { FrontendShell } from '@/components/frontend/FrontendShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

type CartItem = {
  flowerId: string
  quantity: number
  name: string
  price?: number
  imageUrl?: string
}

export default function OrderCartClient({ orderId }: { orderId: string }) {
  const router = useRouter()
  const storageKey = useMemo(() => `flower-shop:cart:${orderId}`, [orderId])

  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readCart = useCallback((): CartItem[] => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw) as { items?: CartItem[] }
      return Array.isArray(parsed?.items) ? parsed.items : []
    } catch {
      return []
    }
  }, [storageKey])

  const writeCart = useCallback(
    (nextItems: CartItem[]) => {
      window.localStorage.setItem(storageKey, JSON.stringify({ items: nextItems }))
    },
    [storageKey],
  )

  useEffect(() => {
    setItems(readCart())
  }, [readCart])

  const total = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.price) || 0) * it.quantity, 0)
  }, [items])

  const updateQuantity = useCallback(
    (flowerId: string, nextQtyRaw: number) => {
      const nextQty = Number.isFinite(nextQtyRaw) ? Math.max(0, Math.floor(nextQtyRaw)) : 0

      setItems((prev) => {
        const next =
          nextQty <= 0
            ? prev.filter((it) => it.flowerId !== flowerId)
            : prev.map((it) => (it.flowerId === flowerId ? { ...it, quantity: nextQty } : it))

        writeCart(next)
        return next
      })
    },
    [writeCart],
  )

  const clearCart = useCallback(() => {
    const empty: CartItem[] = []
    writeCart(empty)
    setItems(empty)
    setError(null)
  }, [writeCart])

  const onCompleteOrder = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        items: items.map((it) => ({
          flowerId: it.flowerId,
          quantity: it.quantity,
        })),
      }

      const res = await fetch(`/api/order/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }

      clearCart()
      router.push(`/order/${orderId}/remittance`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [clearCart, items, orderId, router])

  return (
    <FrontendShell maxWidthClass="max-w-4xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">購物車確認</h1>
            <p className="text-sm text-muted-foreground">調整數量或清空後再確認下單。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/order/${orderId}`}>返回選花</Link>
            </Button>
            <Button variant="secondary" onClick={clearCart} disabled={items.length === 0}>
              清空購物車
            </Button>
          </div>
        </div>

        <Separator />

        {items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">購物車是空的</CardTitle>
              <CardDescription>請回到上一頁選擇花品與數量。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={`/order/${orderId}`}>返回選花</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((it) => (
                <Card key={it.flowerId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{it.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="h-40 w-full rounded-lg border object-cover"
                      />
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">數量</span>
                        <Input
                          type="number"
                          min={0}
                          value={it.quantity}
                          onChange={(e) => updateQuantity(it.flowerId, Number(e.target.value))}
                          className="w-24"
                        />
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">單價: {it.price ?? '-'}</div>
                        <div className="font-semibold">小計: {(it.price ?? 0) * it.quantity}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">合計（僅供參考）</p>
                  <p className="text-2xl font-semibold tracking-tight">{total}</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  {error ? (
                    <Alert variant="destructive" className="[&>svg]:hidden [&_*]:pl-0">
                      <AlertTitle>無法完成下單</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}
                  <Button
                    className="w-full sm:w-auto"
                    onClick={onCompleteOrder}
                    disabled={loading}
                  >
                    {loading ? '處理中…' : '確認下單'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </FrontendShell>
  )
}
