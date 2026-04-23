import * as React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  label = 'Carregando',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn('animate-pulse rounded-lg bg-jera-off/5', className)}
      {...props}
    />
  )
}

export default Skeleton
