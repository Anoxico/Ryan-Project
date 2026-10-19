import { api } from './api'
import { compressImage, toBase64 } from './photos'
import type { AiStatus, ProductCategory, RecognitionResult } from './types'

export async function recognizeLabel({
  file,
  category,
}: {
  file: File
  category: ProductCategory
}): Promise<RecognitionResult> {
  const compressed = await compressImage(file)
  const { data, mime } = await toBase64(compressed)
  return api<RecognitionResult>('recognizeLabel', {
    dataBase64: data,
    mimeType: mime,
    category,
  })
}

export function getAiStatus() {
  return api<AiStatus>('aiConfigStatus')
}

export interface AiConfigInput {
  apiKey: string
  clearApiKey?: boolean
}

export function setAiConfig(input: AiConfigInput) {
  return api<AiStatus>('setAiConfig', input)
}
