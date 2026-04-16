import type { CollectionConfig, Condition } from 'payload'
import { APIError } from 'payload'

import type { Access } from 'payload'

/** 系統／API 更新訂單狀態時請帶入 context，否則會被狀態轉換規則擋下 */
export const SKIP_ORDER_STATUS_TRANSITION = 'skipOrderStatusTransition' as const

const isAdminUser = (user: unknown): boolean => {
  const role = (user as { role?: unknown } | null | undefined)?.role
  if (Array.isArray(role)) return role.includes('admin')
  return role === 'admin'
}

const orderReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdminUser(user)) return true

  const role = (user as { role?: unknown } | null | undefined)?.role
  const isPartner = Array.isArray(role) ? role.includes('partner') : role === 'partner'

  if (isPartner) {
    return {
      createdBy: {
        equals: user.id,
      },
    }
  }

  return false
}

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

/** 已取消訂單不顯示匯款資訊欄位。 */
const showRemittanceFields: Condition = (data) => {
  const status = typeof data?.status === 'string' ? data.status : ''
  return ['待確認付款', '待出貨', '已完成'].includes(status)
}

export const Order: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'name', 'date', 'location', 'status', '複製連結', 'updatedAt'],
    baseListFilter: ({ req: { user } }) => {
      if (!user) return null
      if (isAdminUser(user)) return null
      return {
        createdBy: {
          equals: user.id,
        },
      }
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
      defaultValue: ({ user }) => user?.id,
      admin: {
        position: 'sidebar',
      }
    },
    {
      label: '禮儀公司',
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      admin: {
        position: 'sidebar',
        description: '前台匯款頁顯示此公司的匯款資訊。Partner 建立訂單時會自動帶入帳號所屬公司。',
      },
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
        condition: showRemittanceFields,
        readOnly: true,
      },
    },
    {
      label: '匯款憑證', 
      name: 'proof',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: showRemittanceFields,
        readOnly: true,
      },
    },

  ],

  access: {
    read: orderReadAccess,
    create: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminUser(user)) return true

      const role = (user as { role?: unknown } | null | undefined)?.role
      const isPartner = Array.isArray(role) ? role.includes('partner') : role === 'partner'
      return Boolean(isPartner)
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminUser(user)) return true

      const role = (user as { role?: unknown } | null | undefined)?.role
      const isPartner = Array.isArray(role) ? role.includes('partner') : role === 'partner'
      if (!isPartner) return false

      return {
        createdBy: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => Boolean(user && isAdminUser(user)),
  },

  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const row = data as { company?: unknown }
        if (row.company) return data

        const userId = req.user?.id
        if (!userId) return data

        const creator = await req.payload.findByID({
          collection: 'users',
          id: userId,
          depth: 0,
          overrideAccess: true,
        })

        const role = (creator as { role?: unknown } | null)?.role
        const isPartner = Array.isArray(role) ? role.includes('partner') : role === 'partner'
        if (!isPartner) return data

        const co = (creator as { company?: string | { id: string } | null }).company
        if (!co) return data

        const companyId =
          typeof co === 'object' && co && 'id' in co ? String((co as { id: string }).id) : String(co)

        return { ...data, company: companyId }
      },
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

        if (prevStatus === '待出貨' && nextStatus === '已完成') {
          return data
        }

        throw new APIError(
          `無法將訂單狀態從「${prevStatus ?? '-'}」變更為「${nextStatus ?? '-'}」。後台僅允許「待確認付款→待出貨」以及「待出貨→已完成」，其餘請交由前台／API 流程處理。`,
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
        if (!user) return null
        if (isAdminUser(user)) return doc
        const cb = doc?.createdBy
        const createdById =
          typeof cb === 'object' && cb && 'id' in cb ? String((cb as { id: string }).id) : cb
        return createdById === user?.id ? doc : null
      },
    ],
  },
}
