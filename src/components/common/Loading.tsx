interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export const Loading = ({ message = 'Carregando...', fullScreen = false }: LoadingProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />

        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />

        {/* Inner glow */}
        <div className="absolute inset-2 bg-primary/10 rounded-full blur-md" />
      </div>

      {message && (
        <p className="text-xl text-gray-400 font-medium">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-12">
          {content}
        </div>
      </div>
    )
  }

  return content
}
