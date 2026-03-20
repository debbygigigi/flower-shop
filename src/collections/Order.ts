import type { CollectionConfig } from 'payload'
import { adminOrOwner } from './Users/access'

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
      label: '建立者',
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      defaultValue: ({ user }) => user.id,
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
      name: '狀態',
      type: 'select',
      options: [
        { label: '待下單', value: '待下單' },
        { label: '未付款', value: '未付款' },
        { label: '已付款', value: '已付款' },
        { label: '已取消', value: '已取消' },
      ],
      defaultValue: '未付款',
    },
    {
      name: '匯款後五碼',
      type: 'text',
    },
    {
      name: '匯款憑證',
      type: 'text',
    },
    {
      name: '花朵',
      type: 'relationship',
      relationTo: 'flowers',
      required: true,
      hasMany: true,
    },
  ],

  access: {
    read: ({ req: { user }, id }) => {
      return Boolean(user)
    },
  },

  hooks: {
    beforeRead: [
      async ({ doc, req: { user } }) => {
        return doc?.createdBy === user?.id ? doc : null
      },
    ],
  },
}
