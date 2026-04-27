import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../../utils/cn'

const config = {
  success: { Icon: CheckCircle2, bar: 'bg-hub-green', text: 'text-hub-green' },
  error:   { Icon: AlertCircle,  bar: 'bg-hub-red',   text: 'text-hub-red' },
  warning: { Icon: AlertTriangle, bar: 'bg-hub-yellow', text: 'text-hub-yellow' },
  info:    { Icon: Info,         bar: 'bg-hub-blue',   text: 'text-hub-blue' },
}

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(({ id, message, type = 'info' }) => {
        const { Icon, bar, text } = config[type] || config.info
        return (
          <div
            key={id}
            className="pointer-events-auto flex items-start gap-3 bg-hub-card border border-hub-border rounded-xl p-4 shadow-xl"
          >
            <div className={cn('shrink-0 mt-0.5', text)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-sm text-hub-text flex-1">{message}</p>
            <button
              onClick={() => onDismiss(id)}
              className="shrink-0 text-hub-text-muted hover:text-hub-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className={cn('absolute bottom-0 left-0 h-0.5 rounded-full w-full opacity-60', bar)} />
          </div>
        )
      })}
    </div>
  )
}
