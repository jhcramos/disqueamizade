import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'

function App() {
  return (
    <div className="min-h-screen bg-dark-bg text-white p-8">
      <div className="glass-card p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-neon-cyan mb-4">
          TESTE SIMPLES
        </h1>
        <p className="text-gray-400 mb-4">
          Se você está vendo isso, o React está funcionando!
        </p>
        <button className="btn-neon">
          Botão de Teste
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
