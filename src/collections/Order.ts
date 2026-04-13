import type { CollectionConfig, Condition } from 'payload'
import { APIError } from 'payload'

import { adminOrOwner } from './Users/access'

/** 系統／API 更新訂單狀態時請帶入 context，否則會被狀態轉換規則擋下 */
export const SKIP_ORDER_STATUS_TRANSITION = 'skipOrderStatusTransition' as const

const showAfterPendingPayment = (_: unknown, siblingData: { status?: string }) => {
  return ['待付款', '待確認付款', '待出貨', '已完成', '已取消'].includes(
    siblingData?.status ?? '',
  )
}

const showAfterPaymentSubmitted = (_: unknown, siblingData: { status?: string }) => {
  return ['待確認付款', '待出貨', '已完成', '已取消'].includes(siblingData?.status ?? '')
}

const showWhenCompleted: Condition = (data) => {
  return data?.status === '已完成'
}

/** 已取消訂單不顯示付款日期。須讀取 `data.status`：sidebar 欄位的 siblingData 不一定含 status。 */
const showPaymentDateField: Condition = (data) => {
  const status = typeof data?.status === 'string' ? data.status : ''
  return ['待確認付款', '待出貨', '已完成'].includes(status)
}

export const Order: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    baseListFilter: (props) => {
      return adminOrOwner(props)
    },
  },

  fields: [
    {
      label: '往生者姓名',
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      label: '日期',
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      label: '地點',
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      label: '訂購人姓名',
      name: 'buyerName',
      type: 'text',
      admin: {
        condition: showAfterPendingPayment,
      },
    },
    {
      label: '訂購人電話',
      name: 'buyerPhone',
      type: 'text',
      admin: {
        condition: showAfterPendingPayment,
      },
    },
    {
      label: '建立者',
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      defaultValue: ({ user }) => user.id,
      admin: {
        position: 'sidebar',
      }
    },
    {
      label: '訂購明細',
      name: 'orderItems',
      type: 'array',
      labels: { singular: '品項', plural: '品項' },
      admin: {
        condition: showAfterPendingPayment,
        description: '每列一種花品與購買數量（同一花品請合併為一列）。',
      },
      fields: [
        {
          label: '花品',
          name: 'flower',
          type: 'relationship',
          relationTo: 'flowers',
          required: true,
        },
        {
          label: '數量',
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
    },
    {
      name: '複製連結',
      type: 'ui',
      admin: {
        components: {
          Cell: '/components/admin/CopyOrderLink',
        },
      },
    },
    {
      label: '訂單狀態', 
      name: 'status',
      type: 'select',
      options: [
        { label: '待下單', value: '待下單' },
        { label: '待付款', value: '待付款' },
        { label: '待確認付款', value: '待確認付款' },
        { label: '待出貨', value: '待出貨' },
        { label: '已完成', value: '已完成' },
        { label: '已取消', value: '已取消' },
      ],
      defaultValue: '待下單',
      admin: {
        position: 'sidebar',
        isClearable: false,
        components: {
          Field: '/components/admin/OrderStatusField',
        },
      }
    },
    {
      label: '訂單金額',
      name: 'amount',
      type: 'number',
      admin: {
        condition: showAfterPendingPayment,
        readOnly: true,
      },
    },
    {
      label: '付款日期',
      name: 'paymentDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        condition: showPaymentDateField,
      }
    },
    {
      label: '出貨日期',
      name: 'shipmentDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        condition: showWhenCompleted,
      }
    },
    {
      label: '匯款後五碼', 
      name: 'last5',
      type: 'text',
      admin: {
        condition: showAfterPaymentSubmitted,
        readOnly: true,
      },
    },
    {
      label: '匯款憑證', 
      name: 'proof',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: showAfterPaymentSubmitted,
        readOnly: true,
      },
    },

  ],

  access: {
    read: ({ req: { user } }) => {
      return Boolean(user)
    },
  },

  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        const ctx = req.context as Record<string, unknown> | undefined
        if (ctx?.[SKIP_ORDER_STATUS_TRANSITION] === true) {
          return data
        }

        if (operation === 'create') {
          const next = data?.status
          if (next != null && next !== '待下單') {
            throw new APIError(
              '新訂單狀態僅能為「待下單」；其他狀態由系統流程自動更新。',
              400,
            )
          }
          return data
        }

        if (operation !== 'update' || !data || !Object.prototype.hasOwnProperty.call(data, 'status')) {
          return data
        }

        const nextStatus = data.status as string | undefined
        const prevStatus = originalDoc?.status as string | undefined

        if (nextStatus === prevStatus) {
          return data
        }

        if (prevStatus === '待確認付款' && nextStatus === '待出貨') {
          return data
        }

        throw new APIError(
          `無法將訂單狀態從「${prevStatus ?? '-'}」變更為「${nextStatus ?? '-'}」。後台僅允許在「待確認付款」時改為「待出貨」，其餘請交由前台／API 流程處理。`,
          400,
        )
      },
      ({ data, originalDoc }) => {
        const nextStatus = data?.status
        const prevStatus = originalDoc?.status
        const alreadyHasShipmentDate = Boolean(data?.shipmentDate || originalDoc?.shipmentDate)

        if (nextStatus === '已完成' && prevStatus !== '已完成' && !alreadyHasShipmentDate) {
          return {
            ...data,
            shipmentDate: new Date().toISOString(),
          }
        }

        return data
      },
      ({ data }) => {
        const rows = data?.orderItems
        if (!Array.isArray(rows) || rows.length === 0) return data

        const flowerIdOf = (row: { flower?: unknown }) => {
          const f = row?.flower
          if (typeof f === 'string') return f
          if (f && typeof f === 'object' && 'id' in f && (f as { id?: string }).id) {
            return String((f as { id: string }).id)
          }
          return ''
        }

        const merged = new Map<string, number>()
        for (const row of rows as { flower?: unknown; quantity?: unknown }[]) {
          const id = flowerIdOf(row)
          if (!id) continue
          const q = Math.max(1, Math.floor(Number(row?.quantity) || 1))
          merged.set(id, (merged.get(id) ?? 0) + q)
        }

        if (merged.size === 0) return data

        return {
          ...data,
          orderItems: Array.from(merged.entries()).map(([flower, quantity]) => ({
            flower,
            quantity,
          })),
        }
      },
    ],
    beforeRead: [
      async ({ doc, req: { user } }) => {
        return doc?.createdBy === user?.id ? doc : null
      },
    ],
  },
}
