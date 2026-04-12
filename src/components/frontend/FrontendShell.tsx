import * as React from 'react'

import { cn } from '@/lib/utils'

export function FrontendShell({
  children,
  className,
  innerClassName,
  maxWidthClass = 'max-w-4xl',
  vertical = 'start',
  brandName = '花蘊鮮花',
  funeralCompanyName = '金麟生命',
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  maxWidthClass?: string
  vertical?: 'start' | 'center'
  brandName?: string
  funeralCompanyName?: string
}) {
  return (
    <div className={cn('min-h-svh bg-background', className)}>
      <header className="bg-amber-200/90 text-amber-950">
        <div className={cn('mx-auto w-full px-4 py-3', maxWidthClass)}>
          <div className="flex items-center justify-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-950 text-amber-50">
              <span className="text-sm font-semibold">{brandName.slice(0, 1)}</span>
            </div>
            <div className="leading-tight text-center">
              <div className="text-base font-semibold tracking-tight">{brandName}</div>
              <div className="text-[11px] text-amber-900/80 sm:text-xs">告別式花禮代訂服務</div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'mx-auto w-full px-4 py-6 md:py-10',
          maxWidthClass,
          vertical === 'center' &&
            'flex min-h-[calc(100svh-120px)] flex-col justify-center py-10 md:min-h-0 md:py-16',
          innerClassName,
        )}
      >
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-center sm:text-2xl">
            告別式花禮代訂服務
          </h1>
        </div>
        {children}
      </div>

      <footer className="bg-muted">
        <div className={cn('mx-auto w-full px-4 py-4 text-xs text-muted-foreground', maxWidthClass)}>
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <div>電話：0900-000-000</div>
            <div>Line：@huayun</div>
            <div>地址：台北市信義區示範路 1 號</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
