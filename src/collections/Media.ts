import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    hidden: ({ user }) => Boolean(user?.role?.includes('partner')),
  },
  access: {
    // 必須公開讀取，否則前台圖片在登入狀態（帶 cookie）會被擋 403
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
