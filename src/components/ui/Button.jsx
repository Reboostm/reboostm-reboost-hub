import { cn } from '../../utils/cn'
import Spinner from './Spinner'

const variants = {
  primary: 'bg-hub-blue hover:bg-hub-blue-hover text-white shadow-sm',
  secondary: 'bg-hub-card border border-hub-border text-hub-text hover:border-hub-blue/50 hover:bg-hub-input',
  ghost: 'text-hub-text-secondary hover:text-hub-text hover:bg-hub-card',
  danger: 'bg-hub-red hover:opacity-90 text-white shadow-sm',
  accent: 'bg-hub-orange hover:opacity-90 text-white shadow-sm',
  outline: 'border border-hub-blue text-hub-blue hover:bg-hub-blue/10',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-hub-blue/40 focus:ring-offset-1 focus:ring-offset-hub-bg',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
