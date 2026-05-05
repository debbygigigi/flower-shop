import config from '@/payload.config'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const payloadConfig = await config
  redirect(payloadConfig.routes.admin)
}
