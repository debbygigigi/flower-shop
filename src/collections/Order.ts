import type { CollectionConfig } from 'payload'
import { adminOrOwner } from './Users/access'

const showAfterPendingPayment = (_: unknown, siblingData: { status?: string }) => {
  return ['待付款', '待確認付款', '待出貨', '已完成', '已取消'].includes(
    siblingData?.status ?? '',
  )
}

const showAfterPaymentSubmitted = (_: unknown, siblingData: { status?: string }) => {
  return ['待確認付款', '待出貨', '已完成', '已取消'].includes(siblingData?.status ?? '')
}

const showWhenCompleted = (_: unknown, siblingData: { status?: string }) => {
  return siblingData?.status === '已完成'
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
      label: '訂單',
      name: 'flowers',
      type: 'relationship',
      relationTo: 'flowers',
      hasMany: true,
      admin: {
        condition: showAfterPendingPayment,
      },
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
        condition: showAfterPaymentSubmitted,
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
    read: ({ req: { user }, id }) => {
      return Boolean(user)
    },
  },

  hooks: {
    beforeChange: [
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
    ],
    beforeRead: [
      async ({ doc, req: { user } }) => {
        return doc?.createdBy === user?.id ? doc : null
      },
    ],
  },
}
