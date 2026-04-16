import type { CollectionConfig } from 'payload'

import { admin } from './Users/access'

export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    hidden: ({ user }) => Boolean(user?.role?.includes('partner')),
  },
  access: {
    create: admin,
    update: admin,
    delete: admin,
    read: ({ req: { user } }) => {
      // 若未登入（前台）先放行；partner 登入後台不允許讀取
      if (!user) return true
      return Boolean(user?.role?.includes('admin'))
    },
  },
  fields: [
    {
      label: '公司名稱',
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      label: '專屬 Slug',
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: '用於專屬連結與識別（例如：jinlin）。',
      },
    },
    {
      label: 'Logo',
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: '建議上傳透明底 PNG 或方形圖片。',
      },
    },
    {
      label: '匯款資訊',
      name: 'remittance',
      type: 'group',
      fields: [
        {
          label: '銀行代號',
          name: 'bankCode',
          type: 'text',
        },
        {
          label: '轉入銀行帳號',
          name: 'bankAccount',
          type: 'text',
        },
        {
          label: '戶名',
          name: 'accountName',
          type: 'text',
        },
        {
          label: '備註',
          name: 'note',
          type: 'textarea',
          admin: {
            description: '例如：匯款完成後請上傳匯款憑證、後五碼等。',
          },
        },
      ],
    },
  ],
}

