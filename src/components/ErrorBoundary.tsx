import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'white', background: '#1a1a2e', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ff6b6b' }}>⚠️ Erro na aplicação</h1>
          <pre style={{ color: '#ffd93d', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 20 }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ color: '#888', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 10, fontSize: 12 }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.href = '/rooms'}
            style={{ marginTop: 20, padding: '10px 20px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Voltar para Salas
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
