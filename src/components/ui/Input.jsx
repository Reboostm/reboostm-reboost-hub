import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Input = forwardRef(function Input({ label, error, hint, className, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-hub-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2.5 bg-hub-input border border-hub-border rounded-lg',
          'text-hub-text placeholder:text-hub-text-muted text-sm',
          'transition-colors duration-150',
          'focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30',
          error && 'border-hub-red focus:border-hub-red focus:ring-hub-red/30',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-hub-red">{error}</p>}
      {hint && !error && <p className="text-xs text-hub-text-muted">{hint}</p>}
    </div>
  )
})

export default Input
