import { api } from './api'
import type { StatsResult } from './types'

export function fetchStats() {
  return api<StatsResult>('stats')
}
