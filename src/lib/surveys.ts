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
  return api<{ deleted: number }>('deleteSurvey', { id })
}

export function deleteSurveys(ids: string[]) {
  return api<{ deleted: number }>('deleteSurveys', { ids })
}

export interface DeletedSurvey extends Survey {
  deleted_at: string
  days_left: number
}

export function listDeletedSurveys() {
  return api<DeletedSurvey[]>('listDeletedSurveys')
}

export function restoreSurvey(id: string) {
  return api<{ restored: number }>('restoreSurvey', { id })
}

export function purgeSurvey(id: string) {
  return api<{ purged: boolean }>('purgeSurvey', { id })
}

export function emptyRecycleBin() {
  return api<{ purged: number }>('emptyRecycleBin')
}

export interface StoreGroup {
  store: string
  channel: string
  customer: string
  visitCount: number
  latestDate: string
  cover?: string
  surveys: Survey[]
}

/** 将巡店单按门店分组（输入应按日期倒序），封面取最近一次有照片的记录 */
export function groupByStore(surveys: Survey[]): StoreGroup[] {
  const map = new Map<string, StoreGroup>()
  for (const s of surveys) {
    let group = map.get(s.store)
    if (!group) {
      group = {
        store: s.store,
        channel: s.channel,
        customer: s.customer,
        visitCount: 0,
        latestDate: s.visit_date,
        cover: undefined,
        surveys: [],
      }
      map.set(s.store, group)
    }
    group.visitCount += 1
    group.surveys.push(s)
    if (!group.cover && s.thumbnail) group.cover = s.thumbnail
  }
  return Array.from(map.values())
}
