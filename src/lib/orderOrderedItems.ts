import type { Payload } from 'payload'

export type OrderedItemRow = {
  flowerId: string
  name: string
  quantity: number
  price: number
  subtotal: number
}

function flowerIdFromRelation(item: unknown): string {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object' && 'id' in item && (item as { id?: string }).id) {
    return String((item as { id: string }).id)
  }
  return ''
}

/**
 * 與匯款頁相同邏輯：由訂單 `orderItems` 或舊版 `flowers` 組出明細列。
 */
export async function buildOrderedItems(
  payload: Payload,
  order: unknown,
  user: unknown,
): Promise<OrderedItemRow[]> {
  const doc = order as Record<string, unknown> | null | undefined
  const orderItems = Array.isArray(doc?.orderItems) ? doc.orderItems : []

  let uniqueFlowerIDs: string[] = []
  let orderedItems: OrderedItemRow[] = []

  if (orderItems.length > 0) {
    const ids: string[] = orderItems
      .map((row: { flower?: unknown }) => flowerIdFromRelation(row?.flower))
      .filter((id: string) => id.length > 0)
    uniqueFlowerIDs = Array.from(new Set(ids))
  } else {
    const legacyFlowers = Array.isArray(doc?.flowers) ? doc.flowers : []
    const flowerIDs: string[] = legacyFlowers
      .map((item: unknown) => flowerIdFromRelation(item))
      .filter((id: string) => id.length > 0)
    uniqueFlowerIDs = Array.from(new Set(flowerIDs))
    const countMap = new Map<string, number>()
    for (const flowerId of flowerIDs) {
      countMap.set(flowerId, (countMap.get(flowerId) ?? 0) + 1)
    }
    orderedItems = Array.from(countMap.entries()).map(([flowerId, quantity]) => ({
      flowerId,
      name: flowerId,
      quantity,
      price: 0,
      subtotal: 0,
    }))
  }

  const flowerDocs =
    uniqueFlowerIDs.length > 0
      ? await payload.find({
          collection: 'flowers',
          where: {
            id: {
              in: uniqueFlowerIDs,
            },
          },
          limit: uniqueFlowerIDs.length,
          overrideAccess: true,
          user: user as never,
        })
      : { docs: [] as Record<string, unknown>[] }

  const flowerMap = new Map<string, { name: string; price: number }>()
  for (const flower of flowerDocs.docs) {
    const f = flower as { id?: string; name?: string; price?: number }
    flowerMap.set(String(f?.id), {
      name: String(f?.name ?? '未命名花品'),
      price: Number(f?.price ?? 0),
    })
  }

  if (orderItems.length > 0) {
    orderedItems = orderItems
      .map((row: { flower?: unknown; quantity?: unknown }) => {
        const flowerId = flowerIdFromRelation(row?.flower)
        const flower = flowerMap.get(flowerId)
        const price = flower?.price ?? 0
        const quantity = Math.max(1, Math.floor(Number(row?.quantity) || 1))
        return {
          flowerId,
          name: flower?.name ?? flowerId,
          quantity,
          price,
          subtotal: price * quantity,
        }
      })
      .filter((it: { flowerId: string }) => Boolean(it.flowerId))
  } else if (orderedItems.length > 0) {
    orderedItems = orderedItems.map((row) => {
      const flower = flowerMap.get(row.flowerId)
      const price = flower?.price ?? 0
      return {
        ...row,
        name: flower?.name ?? row.flowerId,
        price,
        subtotal: price * row.quantity,
      }
    })
  }

  return orderedItems
}
