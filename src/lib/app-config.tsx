import * as React from 'react'
import {
  clearConfig as clearStoredConfig,
  loadConfig,
  saveConfig as saveStoredConfig,
  type AppConfig,
} from './config'

interface AppConfigContextValue {
  config: AppConfig | null
  isConfigured: boolean
  setConfig: (config: AppConfig) => void
  resetConfig: () => void
}

const AppConfigContext = React.createContext<AppConfigContextValue | null>(null)

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = React.useState<AppConfig | null>(() => loadConfig())

  const setConfig = React.useCallback((next: AppConfig) => {
    saveStoredConfig(next)
    setConfigState(next)
  }, [])

  const resetConfig = React.useCallback(() => {
    clearStoredConfig()
    setConfigState(null)
  }, [])

  const value = React.useMemo<AppConfigContextValue>(
    () => ({ config, isConfigured: !!config, setConfig, resetConfig }),
    [config, setConfig, resetConfig],
  )

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
}

export function useAppConfig(): AppConfigContextValue {
  const ctx = React.useContext(AppConfigContext)
  if (!ctx) throw new Error('useAppConfig 必须在 AppConfigProvider 内使用')
  return ctx
}
