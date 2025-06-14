import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@/payload.config'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const headers = await getHeaders()
  const { id } = await params

  console.log('id', id)
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const res = await payload.findByID({
    collection: 'orders',
    id: id,
    overrideAccess: true,
    user,
  })

  console.log('res', res)

  return <div>123</div>
}
