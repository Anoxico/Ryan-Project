import * as React from 'react'
import { api } from './api'
import type { DictOption, DictType, ProductCategory } from './types'

interface DictCache {
  key: string
  options: DictOption[]
}

const cache = new Map<string, DictOption[]>()

function cacheKey(type: DictType, category?: ProductCategory) {
  return `${type}:${category ?? ''}`
}

export function useDict(type: DictType, category?: ProductCategory) {
  const key = cacheKey(type, category)
  const [options, setOptions] = React.useState<DictOption[]>(() => cache.get(key) ?? [])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<DictOption[]>('dictList', { type, category: category ?? '' })
      cache.set(key, data)
      setOptions(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [key, type, category])

  React.useEffect(() => {
    void reload()
  }, [reload])

  return { options, loading, error, reload }
}

export function invalidateDictCache(type?: DictType) {
  if (!type) {
    cache.clear()
    return
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(`${type}:`)) cache.delete(key)
  }
}
