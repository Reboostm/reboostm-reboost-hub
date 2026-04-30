import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
}

export default function Modal({ isOpen, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-hub-card border border-hub-border rounded-xl w-full shadow-2xl flex flex-col max-h-[90vh]',
          sizes[size]
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-hub-border shrink-0">
            <h2 className="text-base font-semibold text-hub-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-hub-text-muted hover:text-hub-text hover:bg-hub-input transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-hub-border flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
