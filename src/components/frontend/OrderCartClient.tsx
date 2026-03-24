'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  }, [clearCart, items, orderId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">購物車確認</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href={`/order/${orderId}`}>返回選花</a>
              </Button>
            <Button variant="secondary" onClick={clearCart} disabled={items.length === 0}>
              清空
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>目前購物車是空的</CardTitle>
            </CardHeader>
            <CardContent>
              <p>請先回到上一頁加入花。</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((it) => (
                <Card key={it.flowerId}>
                  <CardHeader>
                    <CardTitle className="text-base">{it.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    ) : null}

                    <div className="flex items-center justify-between gap-4">
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
                        <div>單價: {it.price ?? '-'}</div>
                        <div className="font-semibold">小計: {(it.price ?? 0) * it.quantity}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">合計（僅供參考）</div>
              <div className="text-lg font-semibold">{total}</div>
            </div>

            {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

            <div className="mt-4 flex gap-2 justify-end">
              <Button onClick={onCompleteOrder} disabled={loading}>
                {loading ? '處理中...' : '完成下單'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

