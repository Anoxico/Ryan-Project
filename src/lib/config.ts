export interface AppConfig {
  endpoint: string
  token: string
}

const STORAGE_KEY = 'shop-visit-manager.config.v1'

export function loadConfig(): AppConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppConfig
    if (!parsed.endpoint || !parsed.token) return null
    return parsed
  } catch {
    return null
  }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function normalizeEndpoint(input: string): string {
  const value = input.trim()
  if (!value) return value
  // 允许粘贴带参数的完整 Web App URL，去掉查询串
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return value
  }
}
