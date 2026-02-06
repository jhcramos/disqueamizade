import { useNavigate } from 'react-router-dom'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  showHomeButton?: boolean
}

export const ErrorState = ({ 
  title = 'Ops! Algo deu errado',
  message = 'Tenta de novo ou volta pro início.',
  onRetry,
  showHomeButton = true
}: ErrorStateProps) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-noite-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-energia-500/10 border border-energia-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-energia-500" />
        </div>

        {/* Text */}
        <h1 className="font-display font-bold text-2xl text-white mb-2">{title}</h1>
        <p className="text-noite-400 mb-8">{message}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-balada-500 text-white font-semibold hover:bg-balada-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar de novo
            </button>
          )}
          {showHomeButton && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-colors"
            >
              <Home className="w-4 h-4" />
              Voltar pro início
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty state for lists
interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState = ({ icon = '🔍', title, message, action }: EmptyStateProps) => (
  <div className="text-center py-16">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="font-display font-bold text-xl text-white mb-2">{title}</h3>
    {message && <p className="text-noite-400 text-sm mb-6">{message}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-2.5 rounded-xl bg-balada-500/10 text-balada-400 font-semibold border border-balada-500/20 hover:bg-balada-500/20 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
)
