import * as React from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  open: boolean
  photos: { url: string }[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function Lightbox({ open, photos, index, onIndexChange, onClose }: LightboxProps) {
  const startX = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndexChange(Math.max(0, index - 1))
      if (e.key === 'ArrowRight') onIndexChange(Math.min(photos.length - 1, index + 1))
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, index, photos.length, onClose, onIndexChange])

  if (!open || photos.length === 0) return null
  const current = photos[Math.min(index, photos.length - 1)]

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return
    const delta = e.changedTouches[0].clientX - startX.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) onIndexChange(Math.min(photos.length - 1, index + 1))
      else onIndexChange(Math.max(0, index - 1))
    }
    startX.current = null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="safe-top flex items-center justify-between px-4 py-3">
        <span className="text-sm tabular-nums text-[var(--color-on-dark-dim)]">
          {index + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="glass-dark flex h-10 w-10 items-center justify-center rounded-full text-white"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2">
        <img
          src={current.url}
          alt=""
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={onClose}
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={() => onIndexChange(Math.max(0, index - 1))}
              disabled={index === 0}
              className="glass-dark absolute left-2 flex h-11 w-11 items-center justify-center rounded-full text-white disabled:opacity-30"
              aria-label="上一张"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onIndexChange(Math.min(photos.length - 1, index + 1))}
              disabled={index === photos.length - 1}
              className="glass-dark absolute right-2 flex h-11 w-11 items-center justify-center rounded-full text-white disabled:opacity-30"
              aria-label="下一张"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
