import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-2xl transition-colors', {
  variants: {
    elevation: {
      flat: 'bg-jera-night/60 border border-jera-off/5',
      raised: 'bg-jera-deep/80 border border-jera-off/10 shadow-lg shadow-black/40',
      dark: 'bg-jera-black border border-jera-off/10',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: { elevation: 'raised', padding: 'md' },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ elevation, padding }), className)} {...props} />
  )
)
Card.displayName = 'Card'

export { Card, cardVariants }
export default Card
