import { cn } from '../../utils/cn'

export default function Card({ className, children, padding = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-hub-card border border-hub-border rounded-xl',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }) {
  return (
    <h2 className={cn('text-base font-semibold text-hub-text', className)}>
      {children}
    </h2>
  )
}
