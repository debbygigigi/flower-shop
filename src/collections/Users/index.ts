import type { CollectionConfig } from 'payload'
import { admin, adminOrOwner, owner } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
  },
  auth: true,

  access: {
    create: admin,
    read: adminOrOwner,
    update: adminOrOwner,
    delete: admin,
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
        { label: 'Vendor', value: 'vendor' },
      ],
      defaultValue: 'vendor',
    },
  ],
}
