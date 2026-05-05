import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { admin, adminOrOwner, owner } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: '使用者',
    plural: '使用者',
  },
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
      label: '姓名',
      name: 'name',
      type: 'text',
    },
    {
      label: '角色',
      name: 'role',
      type: 'select',
      options: [
        { label: '管理員', value: 'admin' },
        { label: '合作夥伴', value: 'partner' },
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
