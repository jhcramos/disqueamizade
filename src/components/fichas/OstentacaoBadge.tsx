import { Crown } from 'lucide-react'

interface OstentacaoBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export const OstentacaoBadge = ({ size = 'md', showLabel = true, className = '' }: OstentacaoBadgeProps) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold
        bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20
        border border-amber-400/40
        text-amber-300
        shadow-[0_0_12px_rgba(251,191,36,0.25)]
        animate-pulse
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Crown className={`${iconSize[size]} text-amber-400`} />
      {showLabel && <span>Ostentação</span>}
    </div>
  )
}

// Wrapper for avatar with golden glow
export const OstentacaoAvatarRing = ({ children, isOstentacao, className = '' }: { 
  children: React.ReactNode
  isOstentacao: boolean
  className?: string 
}) => {
  if (!isOstentacao) return <>{children}</>
  
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-full opacity-75 blur-[2px] animate-pulse" />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}
