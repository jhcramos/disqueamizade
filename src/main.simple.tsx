import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'

function App() {
  return (
    <div className="min-h-screen bg-dark-bg text-white p-8">
      <h1 className="text-5xl font-bold text-neon-cyan mb-4">
        DISQUE AMIZADE
      </h1>
      <p className="text-xl text-gray-400">
        Servidor funcionando! ✅
      </p>

      <div className="glass-card p-6 mt-8 max-w-md">
        <h2 className="text-2xl mb-4 text-neon-magenta">Status</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✅ Vite + React</li>
          <li>✅ TailwindCSS</li>
          <li>✅ Design System Tron</li>
        </ul>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
