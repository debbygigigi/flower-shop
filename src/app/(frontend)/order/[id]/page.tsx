import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import '../../styles.scss'

import config from '@/payload.config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useCallback } from 'react'

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

  const flowersDocs = await payload.find({
    collection: 'flowers',
    overrideAccess: true,
    user,
  })

  const flowers = flowersDocs.docs

  const { name, location, date } = res

  const handleChange = useCallback(() => {}, [])

  console.log('res', flowers)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2">
      {/* Header Info */}
      <Card className="text-left mb-8 p-2">
        <CardContent>
          <p className="text-sm font-bold">往生者: {name}</p>
          <p className="text-sm">地點: {location}</p>
          <p className="text-sm text-muted-foreground">日期: {format(date, 'yyyy/MM/dd')}</p>
        </CardContent>
      </Card>

      <div>請選擇要致贈的花</div>

      {/* Flower Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {flowers.map((flower, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-center text-base">{flower.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <img
                  src={flower.image.url}
                  alt={flower.name}
                  className="w-full h-48 object-cover rounded-xl"
                />

                <div className="grid w-full max-w-sm items-center gap-3">
                  <Input
                    type="number"
                    id="email"
                    placeholder="請輸入數量"
                    value={0}
                    onChange={(val) => handleChange(val, flower.id)}
                  />
                </div>
                <Button variant="outline" className="flex-grow-0">
                  加入購物車
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline">下一步</Button>
    </div>
  )
}
