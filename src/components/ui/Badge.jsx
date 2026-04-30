import { cn } from '../../utils/cn'

const variants = {
  free: 'bg-hub-green/20 text-hub-green border-hub-green/30',
  paid: 'bg-hub-blue/15 text-hub-blue border-hub-blue/30',
  locked: 'bg-hub-border/60 text-hub-text-muted border-hub-border',
  success: 'bg-hub-green/20 text-hub-green border-hub-green/30',
  error: 'bg-hub-red/20 text-hub-red border-hub-red/30',
  warning: 'bg-hub-yellow/20 text-hub-yellow border-hub-yellow/30',
  info: 'bg-hub-blue/15 text-hub-blue border-hub-blue/30',
  orange: 'bg-hub-orange/20 text-hub-orange border-hub-orange/30',
  gray: 'bg-hub-card text-hub-text-muted border-hub-border',
}

export default function Badge({ variant = 'info', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
