'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Flower = {
  id?: string
  name?: string
  price?: number
  description?: string | null
  image?: any
}

type CartItem = {
  flowerId: string
  quantity: number
  name: string
  price?: number
  imageUrl?: string
}

export default function OrderFlowersClient({
  orderId,
  flowers,
}: {
  orderId: string
  flowers: Flower[]
}) {
  // 以每朵花的 id（沒有就用 index）作為 key，確保每個 input 互不影響
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addedId, setAddedId] = useState<string | null>(null)

  const storageKey = useMemo(() => {
    return `flower-shop:cart:${orderId}`
  }, [orderId])

  const keys = useMemo(() => {
    return flowers.map((flower, index) => flower.id ?? String(index))
  }, [flowers])

  const onQuantityChange = useCallback((key: string, rawValue: string) => {
    const parsed = Number.parseInt(rawValue || '0', 10)
    setQuantities((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed) ? 0 : parsed,
    }))
  }, [])

  const readCart = useCallback((): CartItem[] => {
    if (typeof window === 'undefined') return []
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
    (items: CartItem[]) => {
      window.localStorage.setItem(storageKey, JSON.stringify({ items }))
    },
    [storageKey],
  )

  const onAddToCart = useCallback(
    (flower: Flower, key: string) => {
      const flowerId = flower.id ?? key
      const qty = quantities[key] ?? 0
      if (!flowerId || qty <= 0) return

      const imageUrl =
        typeof (flower as any)?.image === 'string'
          ? (flower as any).image
          : (flower as any)?.image?.url ?? ''

      const newItem: CartItem = {
        flowerId,
        quantity: qty,
        name: flower.name ?? flowerId,
        price: flower.price,
        imageUrl,
      }

      const existing = readCart()
      const idx = existing.findIndex((it) => it.flowerId === flowerId)

      const next =
        idx === -1
          ? [...existing, newItem]
          : existing.map((it, i) =>
              i === idx ? { ...it, quantity: it.quantity + qty } : it,
            )

      writeCart(next)

      setQuantities((prev) => ({ ...prev, [key]: 0 }))
      setAddedId(flowerId)
      window.setTimeout(() => setAddedId(null), 1200)
    },
    [quantities, readCart, writeCart],
  )

  return (
    <div className="grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      {flowers.map((flower, index) => {
        const key = keys[index]
        const quantity = quantities[key] ?? 0
        const imageUrl =
          typeof (flower as any)?.image === 'string'
            ? (flower as any).image
            : (flower as any)?.image?.url ?? ''

        return (
          <Card key={key} className="overflow-hidden border-0 bg-transparent shadow-none">
            <CardContent className="px-0">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted/40">
                <img
                  src={imageUrl}
                  alt={flower?.name ?? ''}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-2 space-y-2 px-1 sm:mt-3 sm:space-y-3 sm:px-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-semibold leading-snug sm:text-base">
                    {flower.name}
                  </CardTitle>
                  <div className="text-xs font-medium text-foreground/80 sm:text-sm">
                    NT$ {(Number(flower.price) || 0).toLocaleString()}
                  </div>
                  {flower.description ? (
                    <div className="line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                      {flower.description}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <div className="grid items-center gap-1.5">
                    <Input
                      type="number"
                      id={`quantity-${key}`}
                      placeholder="0"
                      value={quantity}
                      min={0}
                      onChange={(e) => onQuantityChange(key, e.target.value)}
                      className="h-9"
                    />
                  </div>

                  <Button
                    className="h-9 w-full text-xs sm:text-sm"
                    onClick={() => onAddToCart(flower, key)}
                    disabled={(quantities[key] ?? 0) <= 0}
                  >
                    加入購物車
                  </Button>

                  {addedId === (flower.id ?? key) && (
                    <div className="text-[11px] text-muted-foreground sm:text-xs">已加入購物車</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

