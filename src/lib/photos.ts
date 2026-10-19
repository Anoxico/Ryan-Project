import imageCompression from 'browser-image-compression'
import { api } from './api'
import type { Photo } from './types'

export interface PhotoItem {
  key: string
  /** 已存在于服务端的照片 id */
  id?: string
  /** 展示用地址（服务端 url 或本地 objectURL） */
  url: string
  /** 待上传的本地文件 */
  file?: File
  status?: 'pending' | 'uploading' | 'error'
}

export function createPhotoItem(file: File): PhotoItem {
  return {
    key: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: URL.createObjectURL(file),
    file,
    status: 'pending',
  }
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    return await imageCompression(file, {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.82,
    })
  } catch {
    return file
  }
}

export async function toBase64(file: File): Promise<{ data: string; mime: string }> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return { data: btoa(binary), mime: file.type || 'image/jpeg' }
}

interface UploadArgs {
  surveyId?: string
  productId?: string
  file: File
  sortOrder?: number
}

export async function uploadPhoto({ surveyId, productId, file, sortOrder = 0 }: UploadArgs): Promise<Photo> {
  const compressed = await compressImage(file)
  const { data, mime } = await toBase64(compressed)
  return api<Photo>('uploadPhoto', {
    surveyId: productId ? '' : (surveyId ?? ''),
    productId: productId ?? '',
    name: compressed.name || `photo-${Date.now()}.jpg`,
    mimeType: mime,
    dataBase64: data,
    sortOrder,
  })
}

export function deletePhoto(id: string) {
  return api<{ deleted: boolean }>('deletePhoto', { id })
}

/** 将服务端照片转换为 PhotoItem */
export function toPhotoItems(photos: Photo[] | undefined): PhotoItem[] {
  return (photos ?? []).map((p) => ({ key: p.id, id: p.id, url: p.url }))
}
