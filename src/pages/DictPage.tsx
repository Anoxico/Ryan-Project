import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useBack } from '@/lib/use-back'
import { ArrowLeft, Check, Plus, Trash2, Pencil, X, Radio, Users, Store, Package, Shapes, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import { invalidateDictCache } from '@/lib/dict'
import { cn } from '@/lib/utils'
import {
  CATEGORY_LABELS,
  DICT_TYPE_LABELS,
  type DictOption,
  type DictType,
  type ProductCategory,
} from '@/lib/types'

const TYPES: DictType[] = ['channel', 'customer', 'store', 'product_name', 'form', 'energy_rating']
const CATEGORY_SCOPED: DictType[] = ['product_name', 'form']
const CATEGORIES: ProductCategory[] = ['dishwasher', 'water_heater', 'range_hood']

const DICT_ICONS: Record<DictType, React.ReactNode> = {
  channel: <Radio className="h-4 w-4" />,
  customer: <Users className="h-4 w-4" />,
  store: <Store className="h-4 w-4" />,
  product_name: <Package className="h-4 w-4" />,
  form: <Shapes className="h-4 w-4" />,
  energy_rating: <Gauge className="h-4 w-4" />,
}

export function DictPage() {
  const navigate = useNavigate()
  const goBack = useBack('/settings')
  const [type, setType] = React.useState<DictType>('channel')
  const [category, setCategory] = React.useState<ProductCategory>('dishwasher')
  const [items, setItems] = React.useState<DictOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const [newName, setNewName] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')
  const [deleteTarget, setDeleteTarget] = React.useState<DictOption | null>(null)

  const scoped = CATEGORY_SCOPED.includes(type)
  const effectiveCategory = scoped ? category : ''

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<DictOption[]>('dictList', { type, category: effectiveCategory })
      setItems(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [type, effectiveCategory])

  React.useEffect(() => {
    void load()
  }, [load])

  async function handleAdd() {
    const name = newName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      await api('dictSave', { type, name, category: effectiveCategory })
      setNewName('')
      invalidateDictCache(type)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRename(item: DictOption) {
    const name = editName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      await api('dictSave', { id: item.id, type: item.type, name, category: item.category })
      setEditingId(null)
      invalidateDictCache(type)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await api('dictDelete', { id: deleteTarget.id })
      setDeleteTarget(null)
      invalidateDictCache(type)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-10">
      <header className="flex items-center gap-3 pt-safe pb-6">
        <button
          onClick={() => goBack()}
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-fg)]"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">字典管理</h1>
          <p className="text-xs text-[var(--color-fg-dim)]">维护自动补全使用的历史值</p>
        </div>
      </header>

      {/* 类型选择 */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t)
              setEditingId(null)
            }}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              type === t
                ? 'bg-[var(--color-brand-strong)] text-white'
                : 'glass text-[var(--color-fg-dim)]',
            )}
          >
            {DICT_ICONS[t]}
            {DICT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 类别选择（产品名 / 形态） */}
      {scoped && (
        <div className="mb-4 flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'flex-1 rounded-[0.9rem] py-2 text-sm font-semibold transition-colors',
                category === c
                  ? 'border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] text-[var(--color-brand-text)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-fg-dim)]',
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}

      {/* 新增 */}
      <div className="mb-4 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          placeholder={`新增「${DICT_TYPE_LABELS[type]}」`}
        />
        <Button onClick={() => void handleAdd()} disabled={busy || !newName.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p>}

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <Card className="py-12 text-center text-sm text-[var(--color-muted)]">
          暂无{ DICT_TYPE_LABELS[type] }字典项
        </Card>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="glass flex items-center gap-2 rounded-[1rem] px-4 py-3">
              {editingId === item.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleRename(item)}
                    className="h-10"
                    autoFocus
                  />
                  <button
                    onClick={() => void handleRename(item)}
                    className="rounded-full p-2 text-[var(--color-success)]"
                    aria-label="保存"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-full p-2 text-[var(--color-muted)]"
                    aria-label="取消"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
                  <button
                    onClick={() => {
                      setEditingId(item.id)
                      setEditName(item.name)
                    }}
                    className="rounded-full p-2 text-[var(--color-fg-dim)]"
                    aria-label="重命名"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="rounded-full p-2 text-[var(--color-danger)]"
                    aria-label="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`删除「${deleteTarget?.name ?? ''}」？`}
        description="仅从字典移除，不影响已保存的记录。"
        confirmText="删除"
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  )
}
