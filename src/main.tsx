import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import './styles/index.css'
import { initAnalytics } from './services/analytics'

// A tab opened before deployment can reference deleted, hashed route assets.
// Retry once per minute, including across reloads, to avoid reload loops.
window.addEventListener('vite:preloadError', (event) => {
  if (!navigator.onLine) return;
  try {
    const key = 'disque-asset-retry-at';
    const previous = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - previous < 60000) return;
    sessionStorage.setItem(key, String(Date.now()));
    event.preventDefault();
    window.location.reload();
  } catch { /* Storage may be unavailable; let the recovery screen appear. */ }
});
initAnalytics()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
