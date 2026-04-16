import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { admin, adminOrOwner, owner } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => Boolean(user?.role?.includes('partner')),
  },
  auth: true,

  access: {
    create: admin,
    read: adminOrOwner,
    update: adminOrOwner,
    delete: admin,
  },

  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation !== 'create' && operation !== 'update') return data

        const role = typeof data?.role === 'string' ? data.role : null
        const company = (data as { company?: unknown } | undefined)?.company

        if (role === 'partner' && !company) {
          throw new APIError('Partner 使用者必須選擇對應的禮儀公司。', 400)
        }

        return data
      },
    ],
  },

  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Partner', value: 'partner' },
      ],
      defaultValue: 'partner',
    },
    {
      label: '對應禮儀公司',
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.role === 'partner',
      },
    },
  ],
}
