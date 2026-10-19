import * as React from 'react'
import { ImagePlus, X, RotateCw, Loader2 } from 'lucide-react'
import { Lightbox } from './Lightbox'
import type { PhotoItem } from '@/lib/photos'
import { cn } from '@/lib/utils'

interface PhotoUploaderProps {
  photos: PhotoItem[]
  onAddFiles: (files: File[]) => void
  onRemove: (key: string) => void
  onRetry?: (key: string) => void
  disabled?: boolean
  hint?: string
}

export function PhotoUploader({
  photos,
  onAddFiles,
  onRemove,
  onRetry,
  disabled,
  hint,
}: PhotoUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
    if (files.length) onAddFiles(files)
    e.target.value = ''
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo, i) => (
          <div key={photo.key} className="relative aspect-square overflow-hidden rounded-[0.9rem] bg-[var(--color-surface-2)]">
            <img
              src={photo.url}
              alt=""
              onClick={() => setPreviewIndex(i)}
              className="h-full w-full cursor-zoom-in object-cover"
            />

            {photo.status === 'uploading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}

            {photo.status === 'error' && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(photo.key)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-accent)]/25 text-[0.65rem] font-semibold text-white"
              >
                <RotateCw className="h-4 w-4" />
                重试
              </button>
            )}

            <button
              type="button"
              onClick={() => onRemove(photo.key)}
              disabled={disabled}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
              aria-label="删除照片"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            'flex aspect-square flex-col items-center justify-center gap-1 rounded-[0.9rem] border border-dashed border-[var(--color-line-strong)] text-[var(--color-muted)] transition-colors active:bg-white/5 disabled:opacity-40',
          )}
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-[0.62rem]">添加</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {hint && <p className="mt-2 text-xs text-[var(--color-muted)]">{hint}</p>}

      <Lightbox
        open={previewIndex !== null}
        photos={photos}
        index={previewIndex ?? 0}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  )
}
