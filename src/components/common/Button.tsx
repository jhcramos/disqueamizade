import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-medium transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variantStyles = {
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-glow-violet hover:brightness-110',
    secondary: 'bg-rose-500 text-white hover:bg-rose-400 hover:shadow-glow-rose',
    outline: 'bg-transparent border border-zinc-700 text-zinc-300 hover:border-violet-500 hover:text-violet-400',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50',
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Carregando...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}
