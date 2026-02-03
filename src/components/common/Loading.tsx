interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export const Loading = ({ message = 'Carregando...', fullScreen = false }: LoadingProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />

        {/* Spinning ring */}
        <div className="absolute inset-0 border-2 border-transparent border-t-violet-500 border-r-indigo-500 rounded-full animate-spin" />
      </div>

      {message && (
        <p className="font-medium text-zinc-400">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        {content}
      </div>
    )
  }

  return content
}
