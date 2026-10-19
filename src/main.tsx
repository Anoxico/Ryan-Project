import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppConfigProvider } from '@/lib/app-config'
import './styles.css'

if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return
    refreshing = true
    window.location.reload()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void navigator.serviceWorker.getRegistration().then((reg) => reg?.update())
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppConfigProvider>
      <App />
    </AppConfigProvider>
  </React.StrictMode>,
)
