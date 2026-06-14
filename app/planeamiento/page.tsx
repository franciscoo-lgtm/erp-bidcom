export const dynamic = 'force-dynamic'

import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { gasGet } from '@/app/lib/gas'

type AnalisisProducto = { producto_id: string; nombre?: string; stock_actual: number; stock_minimo?: number; stock_maximo?: number; demanda_mensual?: number; meses_cobertura?: number; estado_reposicion: string; urgencia?: string }
type ConfigReposicion = { config_id: string; producto_id: string; punto_reposicion: number; cantidad_reposicion: number; lead_time_dias?: number; proveedor_preferido?: string }

const ESTADO_REPOS: Record<string, { label: string; cls: string; icon: 'up' | 'down' | 'ok' }> = {
  critico:      { label: 'Crítico',       cls: 'bg-red-500/15     text-red-400     border-red-500/30',     icon: 'down' },
  bajo_minimo:  { label: 'Bajo mínimo',   cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30',   icon: 'down' },
  normal:       { label: 'Normal',        cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: 'ok'   },
  sobrestock:   { label: 'Sobrestock',    cls: 'bg-purple-500/15  text-purple-400  border-purple-500/30',  icon: 'up'   },
  sin_datos:    { label: 'Sin datos',     cls: 'bg-zinc-500/10    text-zinc-400    border-zinc-500/20',     icon: 'ok'   },
}

function Estado({ estado }: { estado: string }) {
  const e = ESTADO_REPOS[estado] ?? { label: estado, cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: 'ok' as const }
  const Icon = e.icon === 'up' ? TrendingUp : e.icon === 'down' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${e.cls}`}>
      <Icon className="w-3 h-3" />{e.label}
    </span>
  )
}

export default async function PlaneamientoPage() {
  let analisis:   AnalisisProducto[] = []
  let configRepo: ConfigReposicion[] = []
  let error: string | null = null

  try {
    ;[analisis, configRepo] = await Promise.all([
      gasGet<AnalisisProducto[]>('analizarTodosProductos'),
      gasGet<ConfigReposicion[]>('listarConfigReposicion'),
    ])
  } catch (err) { error = (err as Error).message }

  const criticos    = analisis.filter(p => p.estado_reposicion === 'critico').length
  const bajosMin    = analisis.filter(p => p.estado_reposicion === 'bajo_minimo').length
  const sobrestock  = analisis.filter(p => p.estado_reposicion === 'sobrestock').length
  const sinCobert   = analisis.filter(p => p.meses_cobertura != null && p.meses_cobertura < 1).length

  const urgentes = analisis.filter(p => ['critico','bajo_minimo'].includes(p.estado_reposicion))
    .sort((a, b) => (a.meses_cobertura ?? 99) - (b.meses_cobertura ?? 99))

  return (
    <div className="px-8 py-10 max-w-[1500px] mx-auto">
      <PageHeader eyebrow="ERP · Planeamiento" title="Planeamiento." description="Proyección de demanda, análisis de reposición y alertas de stock crítico." meta={`${analisis.length} productos analizados · ${configRepo.length} configs`} />

      {error && <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] text-[12px] text-red-300 fade-rise"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Stock crítico',   value: criticos.toString(),   warn: criticos > 0,   color: 'text-red-300',    delay: 1 },
          { label: 'Bajo mínimo',     value: bajosMin.toString(),   warn: bajosMin > 0,   color: 'text-amber-300',  delay: 2 },
          { label: 'Sobrestock',      value: sobrestock.toString(), warn: false,           color: 'text-purple-300', delay: 3 },
          { label: '< 1 mes cobert.', value: sinCobert.toString(),  warn: sinCobert > 0,  color: 'text-red-300',    delay: 4 },
        ].map(({ label, value, warn, color, delay }) => (
          <div key={label} className={`glass-card p-5 fade-rise fade-rise-${delay}`}>
            <p className="eyebrow mb-3">{label}</p>
            <p className={`text-[28px] font-display font-bold tabular-nums leading-none ${warn ? color : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      {urgentes.length > 0 && (
        <section className="mb-8 fade-rise fade-rise-2">
          <h2 className="text-[11px] font-semibold text-red-400/70 uppercase tracking-[0.15em] mb-4">Alertas Urgentes ({urgentes.length})</h2>
          <div className="grid gap-2">
            {urgentes.slice(0, 10).map(p => {
              const cfg = configRepo.find(c => c.producto_id === p.producto_id)
              return (
                <div key={p.producto_id} className="glass-card px-5 py-3.5 flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white/90 truncate">{p.nombre ?? p.producto_id}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">Stock actual: <span className="text-white/60 font-medium">{p.stock_actual}</span> · Mín: <span className="text-white/60">{p.stock_minimo ?? '—'}</span> · Cobertura: <span className={`font-medium ${(p.meses_cobertura ?? 99) < 1 ? 'text-red-400' : 'text-amber-400'}`}>{p.meses_cobertura != null ? `${p.meses_cobertura.toFixed(1)} meses` : '—'}</span></p>
                  </div>
                  <Estado estado={p.estado_reposicion} />
                  {cfg && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-white/30">Reponer</p>
                      <p className="text-[13px] font-semibold text-white/80">{cfg.cantidad_reposicion} u.</p>
                    </div>
                  )}
                </div>
              )
            })}
            {urgentes.length > 10 && <p className="text-center py-2 text-[11px] text-white/25">+{urgentes.length - 10} más</p>}
          </div>
        </section>
      )}

      <section className="mb-10 fade-rise fade-rise-4">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Análisis Completo de Productos</h2>
        {analisis.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin datos'}</div> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-white/[0.06]">
                {['Producto','Estado','Stock actual','Mínimo','Máximo','Dem./mes','Cobertura'].map(h => (
                  <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Stock actual','Mínimo','Máximo','Dem./mes','Cobertura'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {analisis.map((p, i) => (
                  <tr key={p.producto_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-white/85 max-w-[200px] truncate">{p.nombre ?? p.producto_id}</td>
                    <td className="px-4 py-2.5"><Estado estado={p.estado_reposicion} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-white/80">{p.stock_actual}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-white/40">{p.stock_minimo ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-white/40">{p.stock_maximo ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-white/55">{p.demanda_mensual != null ? p.demanda_mensual.toFixed(1) : '—'}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${p.meses_cobertura == null ? 'text-white/30' : p.meses_cobertura < 1 ? 'text-red-400' : p.meses_cobertura < 2 ? 'text-amber-400' : 'text-white/70'}`}>
                      {p.meses_cobertura != null ? `${p.meses_cobertura.toFixed(1)}m` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="fade-rise fade-rise-5">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Configuración de Reposición</h2>
        {configRepo.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin configuración'}</div> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-white/[0.06]">
                {['ID','Producto','Punto repos.','Cant. repos.','Lead time','Proveedor prefer.'].map(h => (
                  <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Punto repos.','Cant. repos.','Lead time'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {configRepo.map((c, i) => (
                  <tr key={c.config_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{c.config_id}</td>
                    <td className="px-4 py-2.5 text-white/80">{c.producto_id}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-white/70">{c.punto_reposicion}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-white/85">{c.cantidad_reposicion}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-white/45">{c.lead_time_dias != null ? `${c.lead_time_dias}d` : '—'}</td>
                    <td className="px-4 py-2.5 text-white/50 text-[11px]">{c.proveedor_preferido ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
