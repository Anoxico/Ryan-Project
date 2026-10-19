import { loadConfig, type AppConfig } from './config'

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

async function rawCall<T>(
  config: AppConfig,
  action: string,
  payload?: unknown,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(config.endpoint, {
      method: 'POST',
      // 使用 text/plain 规避预检请求，Apps Script 端按 JSON 解析 body
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: config.token, payload: payload ?? {} }),
      redirect: 'follow',
    })
  } catch {
    throw new Error('网络请求失败，请检查 Web App 地址或网络')
  }

  let json: ApiResponse<T>
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new Error('返回内容无法解析，请确认 Web App 已正确部署')
  }

  if (!json.ok) throw new Error(json.error || '请求失败')
  return json.data as T
}

export async function api<T>(action: string, payload?: unknown): Promise<T> {
  const config = loadConfig()
  if (!config) throw new Error('尚未配置后端地址与口令')
  return rawCall<T>(config, action, payload)
}

/** 使用显式配置调用，供首次配置页连通性测试使用 */
export async function apiWith<T>(
  config: AppConfig,
  action: string,
  payload?: unknown,
): Promise<T> {
  return rawCall<T>(config, action, payload)
}

export { rawCall }
