import * as React from 'react'

import { cn } from '@/lib/utils'

export function FrontendShell({
  children,
  className,
  innerClassName,
  maxWidthClass = 'max-w-4xl',
  vertical = 'start',
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  maxWidthClass?: string
  vertical?: 'start' | 'center'
}) {
  return (
    <div className={cn('min-h-svh bg-muted/30', className)}>
      <div
        className={cn(
          'mx-auto w-full px-4 py-8 md:py-10',
          maxWidthClass,
          vertical === 'center' &&
            'flex min-h-svh flex-col justify-center py-12 md:min-h-0 md:py-16',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
