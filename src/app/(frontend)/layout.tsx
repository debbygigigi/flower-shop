import React from 'react'
import './styles.scss'

export const metadata = {
  description: '花店訂購與匯款流程',
  title: '花店',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="zh-Hant">
      <body>
        <main className="min-h-svh">{children}</main>
      </body>
    </html>
  )
}
