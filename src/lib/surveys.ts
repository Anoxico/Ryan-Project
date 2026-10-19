import { api } from './api'
import type { Survey, SurveyFilters } from './types'

export function listSurveys(filters?: SurveyFilters) {
  return api<Survey[]>('listSurveys', filters ?? {})
}

export function getSurvey(id: string) {
  return api<Survey>('getSurvey', { id })
}

export interface SurveyInput {
  id?: string
  visit_date: string
  channel: string
  customer: string
  store: string
  remark?: string
  status?: 'draft' | 'submitted'
}

export function saveSurvey(input: SurveyInput) {
  return api<{ id: string }>('saveSurvey', input)
}

export function deleteSurvey(id: string) {
  return api<{ deleted: boolean }>('deleteSurvey', { id })
}
