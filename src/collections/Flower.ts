import { CollectionConfig } from 'payload'

export const Flower: CollectionConfig = {
  slug: 'flowers',
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => Boolean(user?.role?.includes('partner')),
  },
  access: {
    read: ({ req: { user } }) => {
      // 允許前台（未登入）讀取；partner 需要能讀取 relationship（orderItems.flower）避免 403
      if (!user) return true
      return Boolean(user?.role?.includes('admin') || user?.role?.includes('partner'))
    },
    create: ({ req: { user } }) => Boolean(user?.role?.includes('admin')),
    update: ({ req: { user } }) => Boolean(user?.role?.includes('admin')),
    delete: ({ req: { user } }) => Boolean(user?.role?.includes('admin')),
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
