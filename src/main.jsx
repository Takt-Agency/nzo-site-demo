import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './i18n'

// Maintenance watcher — a tab opened before maintenance was switched on keeps
// navigating client-side without hitting nginx. Ping the server every minute;
// a 503 means maintenance is ON, so reload to get the maintenance page.
if (import.meta.env.PROD) {
  setInterval(() => {
    fetch('/', { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        if (r.status === 503) window.location.reload()
      })
      .catch(() => {})
  }, 60_000)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
