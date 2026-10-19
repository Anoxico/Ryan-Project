import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppConfigProvider } from '@/lib/app-config'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppConfigProvider>
      <App />
    </AppConfigProvider>
  </React.StrictMode>,
)
