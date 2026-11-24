import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { setMenuImageOrigins } from './lib/sync.js'

const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || ''
let r2Origin = ''
try { r2Origin = r2PublicUrl ? new URL(r2PublicUrl).origin : '' } catch { /* invalid optional setting */ }
setMenuImageOrigins(r2Origin ? [r2Origin] : [])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// ---- Register the service worker for offline PWA support ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        const configure = (worker) => worker?.postMessage({
          type: 'CONFIGURE_MENU_IMAGE_ORIGINS',
          origins: r2Origin ? [r2Origin] : [],
        })
        configure(registration.active)
        registration.waiting?.addEventListener('statechange', () => configure(registration.active))
        navigator.serviceWorker.addEventListener('controllerchange', () => configure(navigator.serviceWorker.controller))
      })
      .catch((err) => {
        // SW registration is non-fatal — the app still works online.
        // eslint-disable-next-line no-console
        console.warn('[sw] registration failed:', err)
      })
  })
}
