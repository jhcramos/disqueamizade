import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

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
    success: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    error: 'border-red-500 bg-red-500/10 text-red-500',
    info: 'border-primary bg-primary/10 text-primary-light',
    warning: 'border-accent bg-accent/10 text-accent',
  }

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div
        className={clsx(
          'card px-6 py-4 min-w-[300px] border',
          typeStyles[type]
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icons[type]}</span>
          <p>{message}</p>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
