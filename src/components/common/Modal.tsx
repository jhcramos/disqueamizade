import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`modal-content ${sizeClasses[size]}`}>
        {title && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-50">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div>{children}</div>
      </div>
    </>,
    document.body
  )
}
