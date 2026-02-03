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
    success: 'border-green-500 bg-green-500/10 text-green-500',
    error: 'border-red-500 bg-red-500/10 text-red-500',
    info: 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan',
    warning: 'border-neon-yellow bg-neon-yellow/10 text-neon-yellow',
  }

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className={clsx(
          'glass-card px-6 py-4 min-w-[300px] border-2',
          typeStyles[type]
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icons[type]}</span>
          <p className="font-inter">{message}</p>
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

// Animation in global CSS
const style = document.createElement('style')
style.textContent = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
`
document.head.appendChild(style)
