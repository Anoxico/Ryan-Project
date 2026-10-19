import * as React from 'react'
import { Check, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface AutocompleteOption {
  id?: string
  name: string
}

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  options: AutocompleteOption[]
  placeholder?: string
  id?: string
  invalid?: boolean
}

export function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  id,
  invalid,
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase()
    const list = q
      ? options.filter((o) => o.name.toLowerCase().includes(q))
      : options
    return list.slice(0, 8)
  }, [options, value])

  const exactMatch = options.some((o) => o.name.trim().toLowerCase() === value.trim().toLowerCase())
  const showCreateHint = value.trim().length > 0 && !exactMatch

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function choose(name: string) {
    onChange(name)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    const total = filtered.length + (showCreateHint ? 1 : 0)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(total, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + total) % Math.max(total, 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        e.preventDefault()
        choose(filtered[activeIndex].name)
      } else {
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-invalid={invalid || undefined}
        className={cn(invalid && 'border-[var(--color-accent)]/50')}
      />

      {open && (filtered.length > 0 || showCreateHint) && (
        <div className="glass-strong absolute z-40 mt-2 w-full overflow-hidden rounded-[1.1rem] py-1 shadow-2xl animate-fade-in">
          <ul className="max-h-64 overflow-y-auto no-scrollbar">
            {filtered.map((option, index) => (
              <li key={option.id ?? option.name}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(option.name)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors',
                    index === activeIndex ? 'bg-white/10 text-white' : 'text-[var(--color-fg)] hover:bg-white/5',
                  )}
                >
                  <span className="truncate">{option.name}</span>
                  {option.name === value && <Check className="h-4 w-4 text-[var(--color-success)]" />}
                </button>
              </li>
            ))}
            {showCreateHint && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(value.trim())}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                    activeIndex === filtered.length
                      ? 'bg-white/10 text-white'
                      : 'text-[var(--color-fg-dim)] hover:bg-white/5',
                  )}
                >
                  <Plus className="h-4 w-4" />
                  使用「{value.trim()}」
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
