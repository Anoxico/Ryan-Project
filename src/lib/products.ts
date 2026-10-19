import { api } from './api'
import type { ProductCategory } from './types'

export interface ProductInput {
  id?: string
  survey_id: string
  category: ProductCategory
  product_name: string
  product_params?: string
  sample_price: number
  form?: string
  energy_rating?: string
  noise_db?: number | ''
  sets_count?: number | ''
  extra_points?: string
  liter?: number | ''
  air_volume?: number | ''
  remark?: string
  sort_order?: number
}

export function saveProduct(input: ProductInput) {
  return api<{ id: string }>('saveProduct', input)
}

export function deleteProduct(id: string) {
  return api<{ deleted: boolean }>('deleteProduct', { id })
}

export function duplicateProduct(id: string) {
  return api<{ id: string }>('duplicateProduct', { id })
}
