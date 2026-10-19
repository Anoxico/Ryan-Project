export type ProductCategory = 'dishwasher' | 'water_heater' | 'range_hood'

export type DictType =
  | 'channel'
  | 'customer'
  | 'store'
  | 'product_name'
  | 'form'
  | 'energy_rating'

export type SurveyStatus = 'draft' | 'submitted'

export interface DictOption {
  id: string
  type: DictType
  name: string
  category: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Photo {
  id: string
  survey_id: string
  product_id: string
  drive_file_id: string
  url: string
  sort_order: number
  created_at: string
}

export interface ProductRecord {
  id: string
  survey_id: string
  category: ProductCategory
  product_name: string
  product_params: string
  sample_price: number
  remark: string
  form: string
  energy_rating: string
  noise_db: number | ''
  sets_count: number | ''
  extra_points: string
  liter: number | ''
  air_volume: number | ''
  sort_order: number
  created_at?: string
  updated_at?: string
  photos?: Photo[]
}

export interface Survey {
  id: string
  visit_date: string
  channel: string
  customer: string
  store: string
  remark: string
  status: SurveyStatus
  created_at?: string
  updated_at?: string
  product_count?: number
  thumbnail?: string
  products?: ProductRecord[]
  survey_photos?: Photo[]
}

export interface StatsResult {
  byChannel: { name: string; count: number }[]
  byCustomer: { name: string; count: number }[]
  byStore: { name: string; count: number }[]
  byCategory: { category: ProductCategory; count: number }[]
  energyRatio: { category: ProductCategory; energy_rating: string; count: number; ratio: number }[]
  totals: { surveys: number; products: number }
}

export interface SurveyFilters {
  dateFrom?: string
  dateTo?: string
  channel?: string
  customer?: string
  store?: string
  category?: ProductCategory
  productName?: string
  energy?: string
  form?: string
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  dishwasher: '洗碗机',
  water_heater: '热水器',
  range_hood: '抽油烟机',
}

export const DICT_TYPE_LABELS: Record<DictType, string> = {
  channel: '渠道',
  customer: '客户',
  store: '门店',
  product_name: '产品名',
  form: '形态',
  energy_rating: '能效',
}

export type AiProvider = 'gemini' | 'openai'

export interface RecognitionResult {
  model: string | null
  params: string[]
  noise_db: number | null
  sets_count: number | null
  liter: number | null
  air_volume: number | null
  confidence: 'high' | 'medium' | 'low'
  notes: string | null
}

export interface AiStatus {
  configured: boolean
  provider: AiProvider
  model: string
}
