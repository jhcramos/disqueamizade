import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface TooltipProps {
  content: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const Tooltip = ({
  content,
  children,
  position = 'top',
  delay = 200,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()

        let x = rect.left + rect.width / 2
        let y = rect.top

        switch (position) {
          case 'top':
            y = rect.top - 10
            break
          case 'bottom':
            y = rect.bottom + 10
            break
          case 'left':
            x = rect.left - 10
            y = rect.top + rect.height / 2
            break
          case 'right':
            x = rect.right + 10
            y = rect.top + rect.height / 2
            break
        }

        setCoords({ x, y })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2 translate-y-0',
    left: '-translate-x-full -translate-y-1/2',
    right: 'translate-x-0 -translate-y-1/2',
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            className={clsx(
              'fixed z-50 px-3 py-2 text-sm text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl pointer-events-none',
              positionClasses[position]
            )}
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  )
}
