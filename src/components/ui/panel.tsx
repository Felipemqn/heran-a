import * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
}

export function Panel({ title, description, action, className, children, ...props }: PanelProps) {
  return (
    <Card className={cn('flex flex-col gap-4', className)} {...props}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-jera-off">{title}</h3>
          {description && <p className="text-sm text-jera-off/60 mt-1">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div>{children}</div>
    </Card>
  )
}

export default Panel
