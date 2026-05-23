import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { API_ORIGIN } from './services/apiBase.js'

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window)

  window.fetch = (input, init) => {
    const localApiPrefix = 'http://localhost:3000'

    if (typeof input === 'string' && input.startsWith(localApiPrefix)) {
      const rewrittenUrl = input.replace(localApiPrefix, API_ORIGIN)
      return originalFetch(rewrittenUrl, init)
    }

    if (input instanceof Request && input.url.startsWith(localApiPrefix)) {
      const rewrittenUrl = input.url.replace(localApiPrefix, API_ORIGIN)
      const rewrittenRequest = new Request(rewrittenUrl, input)
      return originalFetch(rewrittenRequest, init)
    }

    return originalFetch(input, init)
  }
}

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
