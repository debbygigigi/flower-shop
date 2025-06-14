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
      label: '往生者',
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
  ],

  access: {
    read: ({ req: { user }, id }) => {
      return Boolean(user)
    },
  },

  hooks: {
    beforeRead: [
      async ({ doc, req: { user } }) => {
        return doc?.createdBy === user.id ? doc : null
      },
    ],
  },
}
