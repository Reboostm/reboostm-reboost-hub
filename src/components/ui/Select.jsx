import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder = 'Select…', className, ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-hub-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-hub-input border border-hub-border rounded-lg',
            'text-hub-text text-sm appearance-none',
            'transition-colors duration-150',
            'focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30',
            error && 'border-hub-red',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: '#1E2235' }}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted pointer-events-none" />
      </div>
      {error && <p className="text-xs text-hub-red">{error}</p>}
      {hint && !error && <p className="text-xs text-hub-text-muted">{hint}</p>}
    </div>
  )
})

export default Select
