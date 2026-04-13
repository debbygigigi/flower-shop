'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { FrontendShell } from '@/components/frontend/FrontendShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
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

    const nameTrim = buyerName.trim()
    const phoneTrim = buyerPhone.trim()
    if (!nameTrim || !phoneTrim) {
      setError('請填寫訂購人姓名與電話')
      setLoading(false)
      return
    }

    try {
      const payload = {
        buyerName: nameTrim,
        buyerPhone: phoneTrim,
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
  }, [buyerName, buyerPhone, clearCart, items, orderId, router])

  return (
    <FrontendShell maxWidthClass="max-w-4xl">
      <div className="space-y-8">
        {items.length === 0 ? (
          <div className="rounded-none py-12 text-center">
            <p className="mb-4 text-muted-foreground">目前沒有品項，請先選購花品。</p>
            <Button asChild>
              <Link href={`/order/${orderId}`}>返回選花</Link>
            </Button>
          </div>
        ) : (
          <>
            <section className="space-y-3 p-1" aria-labelledby="checkout-cart-heading">
              <h2
                id="checkout-cart-heading"
                className="text-sm font-semibold tracking-tight"
              >
                購物車
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((it) => {
                  const unit = Number(it.price) || 0
                  return (
                    <li key={it.flowerId} className="flex items-center gap-1">
                      <div className="shrink-0 p-1">
                        <div className="relative size-[60px] shrink-0 overflow-hidden rounded-lg bg-muted/40">
                          {it.imageUrl ? (
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 p-1">
                        <p className="font-semibold leading-snug">{it.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          單價 NT${' '}
                          <span className="tabular-nums">
                            {Number.isFinite(unit) ? unit.toLocaleString() : '-'}
                          </span>
                        </p>
                      </div>

                      <div className="ml-auto flex shrink-0 items-center gap-1 p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 w-6 min-w-6 shrink-0 px-0 text-base leading-none"
                          aria-label="減少數量"
                          onClick={() => updateQuantity(it.flowerId, it.quantity - 1)}
                        >
                          −
                        </Button>
                        <span className="min-w-[1.75rem] text-center text-base font-medium tabular-nums">
                          {it.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 w-6 min-w-6 shrink-0 px-0 text-base leading-none"
                          aria-label="增加數量"
                          onClick={() => updateQuantity(it.flowerId, it.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <div className="flex flex-col gap-4 pt-2">
              <section
                className="space-y-3 p-1"
                aria-labelledby="checkout-buyer-heading"
              >
                <h2
                  id="checkout-buyer-heading"
                  className="text-sm font-semibold tracking-tight"
                >
                  訂購人資訊
                </h2>
                <div className="grid max-w-md gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`buyer-name-${orderId}`}>訂購人姓名</Label>
                    <Input
                      id={`buyer-name-${orderId}`}
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="請輸入姓名"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`buyer-phone-${orderId}`}>訂購人電話</Label>
                    <Input
                      id={`buyer-phone-${orderId}`}
                      type="tel"
                      inputMode="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="請輸入手機或市話"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-2 p-1" aria-labelledby="checkout-payment-heading">
                <h2
                  id="checkout-payment-heading"
                  className="text-sm font-semibold tracking-tight"
                >
                  付款方式
                </h2>
                <p className="text-sm text-muted-foreground">匯款</p>
              </section>

              <div className="text-right text-lg sm:text-xl">
                <span className="text-muted-foreground">總金額</span>{' '}
                <span className="font-semibold tabular-nums">NT$ {total.toLocaleString()}</span>
              </div>

              {error ? <p className="text-right text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-wrap justify-end gap-1">
                <Button asChild variant="ghost" className="text-foreground">
                  <Link href={`/order/${orderId}`}>返回選花</Link>
                </Button>
                <Button className="min-w-[8rem]" onClick={onCompleteOrder} disabled={loading}>
                  {loading ? '處理中…' : '提交訂單'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </FrontendShell>
  )
}
