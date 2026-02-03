import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className, ...props }, ref) => {
    return (
      <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-rajdhani uppercase tracking-wider text-gray-400">
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={clsx(
            'input-neon',
            error && 'border-red-500 focus:border-red-500 focus:shadow-none',
            className
          )}
          {...props}
        />

        {error && (
          <span className="text-sm text-red-500 font-inter">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
