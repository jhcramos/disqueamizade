import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: () => void
}

export const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: 'border-l-emerald-500 bg-zinc-900',
    error: 'border-l-red-500 bg-zinc-900',
    info: 'border-l-violet-500 bg-zinc-900',
    warning: 'border-l-amber-500 bg-zinc-900',
  }

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    info: 'text-violet-400',
    warning: 'text-amber-400',
  }

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  }

  const Icon = icons[type]

  return createPortal(
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className={clsx(
          'px-5 py-4 min-w-[300px] border border-zinc-800 border-l-4 rounded-xl shadow-2xl',
          typeStyles[type]
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={clsx('w-5 h-5 flex-shrink-0', iconColors[type])} />
          <p className="text-zinc-200 text-sm flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
