import { clsx } from 'clsx'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

export const Loading = ({ size = 'md', text, fullScreen = false, className }: LoadingProps) => {
  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  const content = (
    <div className={clsx('text-center', className)}>
      <div className={clsx(sizeClasses[size], 'mb-4 animate-bounce')}>🎪</div>
      <div className="flex items-center justify-center gap-2">
        <div className={clsx(dotSizes[size], 'bg-balada-500 rounded-full animate-pulse')} />
        <div className={clsx(dotSizes[size], 'bg-energia-500 rounded-full animate-pulse')} style={{ animationDelay: '0.2s' }} />
        <div className={clsx(dotSizes[size], 'bg-festa-400 rounded-full animate-pulse')} style={{ animationDelay: '0.4s' }} />
      </div>
      {text && <p className="text-noite-400 mt-4 text-sm">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-noite-900 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

// Skeleton components for loading states
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={clsx('bg-white/5 rounded animate-pulse', className)} />
)

export const VideoTileSkeleton = () => (
  <div className="aspect-video rounded-2xl bg-noite-800 border-2 border-white/5 animate-pulse">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-white/5" />
    </div>
    <div className="absolute bottom-0 inset-x-0 p-3">
      <div className="h-4 w-24 bg-white/5 rounded" />
    </div>
  </div>
)

export const CardSkeleton = () => (
  <div className="p-6 rounded-3xl bg-surface-light/30 border border-white/5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-white/5" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-white/5 rounded mb-2" />
        <div className="h-3 w-16 bg-white/5 rounded" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-white/5 rounded" />
      <div className="h-3 w-2/3 bg-white/5 rounded" />
    </div>
  </div>
)
