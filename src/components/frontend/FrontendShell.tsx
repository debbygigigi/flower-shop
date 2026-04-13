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
      <header
        className={cn('text-amber-950')}
        style={{
          /* 同色 rgb(69 26 3) 降低透明度，比實線柔和 */
          borderBottom: '1px solid rgb(69 26 3 / 0.22)',
        }}
      >
        <div className={cn('mx-auto w-full px-4 py-3', maxWidthClass)}>
          <div className="flex items-center justify-center gap-3">
            <div className="leading-tight text-center">
              <div className="text-base font-semibold tracking-tight">{brandName}</div>
              <div className="text-[11px] text-amber-900/80 sm:text-xs">告別式花禮代訂服務</div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'mx-auto w-full px-3 py-6 md:py-10',
          maxWidthClass,
          vertical === 'center' &&
            'flex min-h-[calc(100svh-120px)] flex-col justify-center py-10 md:min-h-0 md:py-16',
          innerClassName,
        )}
      >
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
