const PREFIX = 'svm.draft.'

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveDraft(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* 存储不可用时忽略 */
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

export const surveyDraftKey = (id?: string) => (id ? `survey-${id}` : 'survey-new')

export const productDraftKey = (surveyId: string, id?: string) =>
  id ? `product-${id}` : `product-new-${surveyId}`

export interface SurveyDraft {
  visitDate: string
  channel: string
  customer: string
  store: string
  remark: string
  status: 'draft' | 'submitted'
}

export interface ProductDraft {
  category: string
  productName: string
  productParams: string
  price: string
  form: string
  energy: string
  noise: string
  sets: string
  extra: string
  liter: string
  air: string
  remark: string
}
