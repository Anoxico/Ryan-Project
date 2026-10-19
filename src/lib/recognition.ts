import type { ProductCategory, RecognitionResult } from './types'

export interface RecognitionFormPatch {
  productParams?: string
  noise?: string
  sets?: string
  liter?: string
  air?: string
}

function toStrOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function toNonNegativeOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x !== '')
}

function normalizeConfidence(v: unknown): RecognitionResult['confidence'] {
  return v === 'high' || v === 'medium' || v === 'low' ? v : 'low'
}

// 与后端 apps-script/Code.gs 的 aiNormalize_ 保持一致，改动需同步
export function parseRecognitionResult(raw: unknown): RecognitionResult {
  if (!raw || typeof raw !== 'object') {
    return {
      model: null,
      params: [],
      noise_db: null,
      sets_count: null,
      liter: null,
      air_volume: null,
      confidence: 'low',
      notes: null,
    }
  }
  const o = raw as Record<string, unknown>
  return {
    model: toStrOrNull(o.model),
    params: toStringArray(o.params),
    noise_db: toNonNegativeOrNull(o.noise_db),
    sets_count: toNonNegativeOrNull(o.sets_count),
    liter: toNonNegativeOrNull(o.liter),
    air_volume: toNonNegativeOrNull(o.air_volume),
    confidence: normalizeConfidence(o.confidence),
    notes: toStrOrNull(o.notes),
  }
}

const CATEGORY_NUMERIC_FIELDS: Record<
  ProductCategory,
  Array<'noise_db' | 'sets_count' | 'liter' | 'air_volume'>
> = {
  dishwasher: ['noise_db', 'sets_count'],
  water_heater: ['liter'],
  range_hood: ['air_volume'],
}

export function recognitionToFormPatch(
  result: RecognitionResult,
  category: ProductCategory,
): RecognitionFormPatch {
  const patch: RecognitionFormPatch = {}

  const lines = result.params.slice()
  if (result.model && !lines.some((l) => l === `型号：${result.model}` || l === result.model)) {
    lines.unshift(`型号：${result.model}`)
  }
  if (lines.length > 0) patch.productParams = lines.join('\n')

  const allowed = CATEGORY_NUMERIC_FIELDS[category]
  if (allowed.indexOf('noise_db') >= 0 && result.noise_db !== null) patch.noise = String(result.noise_db)
  if (allowed.indexOf('sets_count') >= 0 && result.sets_count !== null) patch.sets = String(result.sets_count)
  if (allowed.indexOf('liter') >= 0 && result.liter !== null) patch.liter = String(result.liter)
  if (allowed.indexOf('air_volume') >= 0 && result.air_volume !== null) patch.air = String(result.air_volume)

  return patch
}
