import { cn } from '../../utils/cn'

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      {Icon && (
        <div className="w-14 h-14 bg-hub-card border border-hub-border rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-hub-text-muted" />
        </div>
      )}
      <h3 className="text-base font-medium text-hub-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-hub-text-secondary mb-6 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  )
}
