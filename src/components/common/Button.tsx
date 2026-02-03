import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
}: ButtonProps) => {
  const baseClasses = 'font-semibold tracking-wide transition-all duration-300 rounded-xl inline-flex items-center justify-center gap-2'

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark hover:shadow-card-hover',
    secondary: 'bg-transparent border border-primary/40 text-primary-light hover:bg-primary/10',
    accent: 'bg-accent text-dark-bg hover:bg-accent-dark hover:shadow-card-hover',
    ghost: 'bg-transparent border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white',
    outline: 'bg-transparent border border-primary/30 text-primary-light hover:bg-primary/10',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
