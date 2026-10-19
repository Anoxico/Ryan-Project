import * as React from 'react'
import { ScanText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { createPhotoItem, type PhotoItem } from '@/lib/photos'
import { recognizeLabel } from '@/lib/ai'
import {
  parseRecognitionResult,
  recognitionToFormPatch,
  type RecognitionFormPatch,
} from '@/lib/recognition'
import type { ProductCategory, RecognitionResult } from '@/lib/types'

const CONFIDENCE_LABELS: Record<RecognitionResult['confidence'], string> = {
  high: '高',
  medium: '中',
  low: '低',
}

interface LabelRecognizerProps {
  category: ProductCategory
  disabled?: boolean
  photos: PhotoItem[]
  onPhotosChange: (photos: PhotoItem[]) => void
  onRecognized: (patch: RecognitionFormPatch) => void
}

export function LabelRecognizer({
  category,
  disabled,
  photos,
  onPhotosChange,
  onRecognized,
}: LabelRecognizerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const fileRef = React.useRef<File | null>(null)
  const itemRef = React.useRef<PhotoItem | null>(null)
  const reqIdRef = React.useRef(0)
  const photosRef = React.useRef(photos)
  photosRef.current = photos
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = React.useState<RecognitionResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [savePhoto, setSavePhoto] = React.useState(false)

  React.useEffect(() => {
    reqIdRef.current += 1
    setStatus('idle')
    setResult(null)
    setError(null)
    setSavePhoto(false)
    removeSavedPhoto()
  }, [category])

  function removeSavedPhoto() {
    const key = itemRef.current?.key
    if (!key) return
    const target = photosRef.current.find((p) => p.key === key)
    if (target?.file) URL.revokeObjectURL(target.url)
    onPhotosChange(photosRef.current.filter((p) => p.key !== key))
    itemRef.current = null
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    removeSavedPhoto()
    fileRef.current = file
    setSavePhoto(false)
    await recognize(file)
  }

  async function recognize(file: File) {
    const reqId = ++reqIdRef.current
    setResult(null)
    setError(null)
    setStatus('loading')
    try {
      const raw = await recognizeLabel({ file, category })
      if (reqId !== reqIdRef.current) return
      const parsed = parseRecognitionResult(raw)
      setResult(parsed)
      onRecognized(recognitionToFormPatch(parsed, category))
      setStatus('done')
    } catch (err) {
      if (reqId !== reqIdRef.current) return
      setError((err as Error).message || '识别失败')
      setStatus('error')
    }
  }

  function toggleSave(checked: boolean) {
    if (disabled) return
    const file = fileRef.current
    if (!file) return
    if (checked) {
      const item = createPhotoItem(file)
      itemRef.current = item
      onPhotosChange([...photos, item])
    } else {
      const key = itemRef.current?.key
      if (key) {
        const target = photos.find((p) => p.key === key)
        if (target?.file) URL.revokeObjectURL(target.url)
        onPhotosChange(photos.filter((p) => p.key !== key))
      }
      itemRef.current = null
    }
    setSavePhoto(checked)
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="glass"
        className="w-full"
        disabled={disabled || status === 'loading'}
        onClick={() => inputRef.current?.click()}
      >
        {status === 'loading' ? <Spinner /> : <ScanText className="h-4 w-4" />}
        {status === 'loading' ? '识别中…' : '拍照识别铭牌'}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="选择铭牌图片"
        className="hidden"
        onChange={handleFile}
      />

      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      {status === 'error' && fileRef.current && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => {
            if (fileRef.current) recognize(fileRef.current)
          }}
        >
          重试
        </Button>
      )}

      {status === 'done' && result && (
        <div className="glass space-y-2 rounded-[1.05rem] p-4 text-sm">
          <p className="font-semibold text-white">
            已识别，请核对（置信度：{CONFIDENCE_LABELS[result.confidence]}）
          </p>
          {result.notes && <p className="text-[var(--color-fg-dim)]">{result.notes}</p>}
          <label className="flex items-center gap-2 text-[var(--color-fg-dim)]">
            <input type="checkbox" checked={savePhoto} disabled={disabled} onChange={(e) => toggleSave(e.target.checked)} />
            同时保存铭牌图到照片
          </label>
        </div>
      )}
    </div>
  )
}
