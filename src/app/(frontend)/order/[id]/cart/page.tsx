import OrderCartClient from '@/components/frontend/OrderCartClient'

export default async function CartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrderCartClient orderId={id} />
}

