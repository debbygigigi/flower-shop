import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import { FrontendShell } from '@/components/frontend/FrontendShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import config from '@/payload.config'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <FrontendShell maxWidthClass="max-w-md" vertical="center">
      <Card className="shadow-sm">
        <CardHeader className="items-center text-center">
          <picture>
            <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
            <Image
              alt="Payload Logo"
              className="mx-auto"
              height={65}
              src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
              width={65}
            />
          </picture>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {!user ? '歡迎使用' : `歡迎回來，${user.email}`}
          </CardTitle>
          <CardDescription>Payload + Next.js 前台範本，可由此進入後台或文件。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href={payloadConfig.routes.admin} rel="noopener noreferrer" target="_blank">
              前往後台
            </a>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <a href="https://payloadcms.com/docs" rel="noopener noreferrer" target="_blank">
              官方文件
            </a>
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-1 border-t pt-6 text-center text-sm text-muted-foreground">
          <p className="m-0">編輯首頁請修改</p>
          <a
            className="inline-flex w-fit max-w-full items-center justify-center rounded-md bg-secondary px-3 py-1 font-mono text-xs text-secondary-foreground no-underline hover:opacity-90"
            href={fileURL}
          >
            app/(frontend)/page.tsx
          </a>
        </CardFooter>
      </Card>
    </FrontendShell>
  )
}
