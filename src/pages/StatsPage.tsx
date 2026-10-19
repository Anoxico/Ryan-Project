import * as React from 'react'
import { BarChart3, FileSpreadsheet, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BarList, RatioBar, type RatioSegment } from '@/components/stats/Charts'
import { fetchStats } from '@/lib/stats'
import { fetchExportTable, downloadCsv, downloadXlsx, type ExportTable } from '@/lib/export'
import { CATEGORY_LABELS, type ProductCategory, type StatsResult } from '@/lib/types'

export function StatsPage() {
  const [stats, setStats] = React.useState<StatsResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [exporting, setExporting] = React.useState<'' | 'csv' | 'xlsx'>('')
  const [exportError, setExportError] = React.useState<string | null>(null)
  const cached = React.useRef<ExportTable | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await fetchStats())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function getTable(): Promise<ExportTable> {
    if (!cached.current) cached.current = await fetchExportTable()
    return cached.current
  }

  async function handleExport(kind: 'csv' | 'xlsx') {
    setExporting(kind)
    setExportError(null)
    try {
      const table = await getTable()
      if (kind === 'csv') downloadCsv(table)
      else await downloadXlsx(table)
    } catch (e) {
      setExportError((e as Error).message)
      cached.current = null
    } finally {
      setExporting('')
    }
  }

  const energyByCategory = React.useMemo(() => {
    const map = new Map<ProductCategory, RatioSegment[]>()
    for (const row of stats?.energyRatio ?? []) {
      const list = map.get(row.category) ?? []
      list.push({ label: row.energy_rating, value: row.count, ratio: row.ratio })
      map.set(row.category, list)
    }
    return Array.from(map.entries())
  }, [stats])

  return (
    <div>
      <PageHeader title="统计" subtitle="渠道 / 客户 / 门店 / 类别 / 能效" />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-[var(--color-danger)]/30">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => void load()}>
            重试
          </Button>
        </Card>
      )}

      {!loading && !error && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="巡店记录" value={stats.totals.surveys} />
            <StatBox label="产品出样" value={stats.totals.products} />
          </div>

          <Card>
            <CardTitle text="产品类别出样数量" />
            <BarList
              items={stats.byCategory.map((c) => ({
                label: CATEGORY_LABELS[c.category] ?? c.category,
                value: c.count,
              }))}
            />
          </Card>

          {energyByCategory.length > 0 && (
            <Card>
              <CardTitle text="能效占比" />
              <div className="space-y-5">
                {energyByCategory.map(([cat, segments]) => (
                  <RatioBar key={cat} title={CATEGORY_LABELS[cat] ?? cat} segments={segments} />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardTitle text="按门店巡店次数" />
            <BarList
              items={stats.byStore.map((x) => ({ label: x.name, value: x.count }))}
              emptyText="暂无门店数据"
            />
          </Card>

          <Card>
            <CardTitle text="按渠道巡店次数" />
            <BarList
              items={stats.byChannel.map((x) => ({ label: x.name, value: x.count }))}
              emptyText="暂无渠道数据"
            />
          </Card>

          <Card>
            <CardTitle text="按客户巡店次数" />
            <BarList
              items={stats.byCustomer.map((x) => ({ label: x.name, value: x.count }))}
              emptyText="暂无客户数据"
            />
          </Card>

          <Card>
            <CardTitle text="数据导出" />
            <p className="mb-3 text-sm text-[var(--color-fg-dim)]">
              导出全部巡店与产品字段，照片以图片链接形式包含在表格中。
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={exporting !== ''}
                onClick={() => void handleExport('xlsx')}
              >
                {exporting === 'xlsx' ? <Spinner /> : <FileSpreadsheet className="h-4 w-4" />}
                Excel
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={exporting !== ''}
                onClick={() => void handleExport('csv')}
              >
                {exporting === 'csv' ? <Spinner /> : <FileText className="h-4 w-4" />}
                CSV
              </Button>
            </div>
            {exportError && <p className="mt-3 text-sm text-[var(--color-danger)]">{exportError}</p>}
          </Card>
        </div>
      )}

      {!loading && !error && !stats && (
        <Card className="flex flex-col items-center py-16 text-center">
          <BarChart3 className="h-8 w-8 text-[var(--color-fg-dim)]" />
          <p className="mt-4 text-sm text-[var(--color-fg-dim)]">暂无统计数据</p>
        </Card>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <Card className="py-4">
      <p className="text-3xl font-extrabold tabular-nums tracking-tight text-[var(--color-fg)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-fg-dim)]">{label}</p>
    </Card>
  )
}

function CardTitle({ text }: { text: string }) {
  return <h2 className="mb-3 text-base font-bold">{text}</h2>
}
