import { api } from './api'
import { CATEGORY_LABELS, type Photo, type ProductRecord, type Survey } from './types'

interface ExportData {
  surveys: Survey[]
  products: ProductRecord[]
  photos: Photo[]
  dict: unknown[]
}

export interface ExportTable {
  headers: string[]
  rows: (string | number)[][]
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  submitted: '正式记录',
}

function joinUrls(urls: string[]): string {
  return urls.join('; ')
}

export function buildExportTable(data: ExportData): ExportTable {
  const photosBySurvey = new Map<string, string[]>()
  const photosByProduct = new Map<string, string[]>()
  for (const ph of data.photos) {
    if (ph.survey_id) {
      const list = photosBySurvey.get(ph.survey_id) ?? []
      list.push(ph.url)
      photosBySurvey.set(ph.survey_id, list)
    }
    if (ph.product_id) {
      const list = photosByProduct.get(ph.product_id) ?? []
      list.push(ph.url)
      photosByProduct.set(ph.product_id, list)
    }
  }

  const productsBySurvey = new Map<string, ProductRecord[]>()
  for (const pr of data.products) {
    const list = productsBySurvey.get(pr.survey_id) ?? []
    list.push(pr)
    productsBySurvey.set(pr.survey_id, list)
  }

  const headers = [
    '巡店日期',
    '渠道',
    '客户',
    '门店',
    '巡店状态',
    '巡店备注',
    '产品类别',
    '产品名',
    '终端出样价格',
    '形态',
    '能效',
    '噪音(dB)',
    '套数',
    '升数(L)',
    '风量(m³/min)',
    '额外卖点',
    '产品参数',
    '产品备注',
    '门店照片',
    '产品照片',
  ]

  const rows: (string | number)[][] = []

  for (const s of data.surveys) {
    const surveyPhotos = joinUrls(photosBySurvey.get(s.id) ?? [])
    const products = productsBySurvey.get(s.id) ?? []

    const base: (string | number)[] = [
      s.visit_date,
      s.channel,
      s.customer,
      s.store,
      STATUS_LABELS[s.status] ?? s.status,
      s.remark ?? '',
    ]

    if (products.length === 0) {
      rows.push([...base, '', '', '', '', '', '', '', '', '', '', '', surveyPhotos, ''])
      continue
    }

    for (const p of products) {
      rows.push([
        ...base,
        CATEGORY_LABELS[p.category] ?? p.category,
        p.product_name,
        Number(p.sample_price) || 0,
        p.form || '',
        p.energy_rating || '',
        p.noise_db === '' || p.noise_db === undefined ? '' : p.noise_db,
        p.sets_count === '' || p.sets_count === undefined ? '' : p.sets_count,
        p.liter === '' || p.liter === undefined ? '' : p.liter,
        p.air_volume === '' || p.air_volume === undefined ? '' : p.air_volume,
        p.extra_points || '',
        p.product_params || '',
        p.remark || '',
        surveyPhotos,
        joinUrls(photosByProduct.get(p.id) ?? []),
      ])
    }
  }

  return { headers, rows }
}

export async function fetchExportTable(): Promise<ExportTable> {
  const data = await api<ExportData>('exportData')
  return buildExportTable(data)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function downloadCsv(table: ExportTable) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [table.headers, ...table.rows].map((row) => row.map(escape).join(','))
  // 加 BOM 以便 Excel 正确识别中文
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `巡店记录-${timestamp()}.csv`)
}

export async function downloadXlsx(table: ExportTable) {
  const XLSX = await import('xlsx')
  const aoa = [table.headers, ...table.rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = table.headers.map((h) => ({ wch: Math.max(h.length * 2, 10) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '巡店记录')
  XLSX.writeFile(wb, `巡店记录-${timestamp()}.xlsx`)
}
