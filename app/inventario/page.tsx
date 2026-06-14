export const dynamic = 'force-dynamic'

import { AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { gasGet } from '@/app/lib/gas'

type StockGranel = { producto_id: string; nombre?: string; ubicacion_id: string; cantidad: number; costo_promedio_usd: number; stock_minimo?: number; fecha_actualizacion?: string }
type Serial      = { serial_id: string; producto_id: string; numero_serie: string; estado: string; ubicacion_id?: string; costo_usd?: number; fecha_ingreso?: string }

const SERIAL_ESTADO: Record<string, { label: string; cls: string }> = {
  en_stock:      { label: 'En stock',      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  vendido:       { label: 'Vendido',       cls: 'bg-blue-500/15    text-blue-400    border-blue-500/30'   },
  en_servicio:   { label: 'En servicio',   cls: 'bg-purple-500/15  text-purple-400  border-purple-500/30' },
  en_reparacion: { label: 'En reparación', cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30'  },
  dado_de_baja:  { label: 'Baja',          cls: 'bg-zinc-500/10    text-zinc-400    border-zinc-500/20'   },
}

export default async function InventarioPage() {
  let granel:   StockGranel[] = []
  let seriales: Serial[]      = []
  let error:    string | null = null

  try {
    ;[granel, seriales] = await Promise.all([
      gasGet<StockGranel[]>('listarStockGranel'),
      gasGet<Serial[]>('listarSeriales'),
    ])
  } catch (err) { error = (err as Error).message }

  const totalUnidades  = granel.reduce((s, r) => s + (r.cantidad ?? 0), 0)
  const disponibles    = seriales.filter(s => s.estado === 'en_stock').length
  const valorGranel    = granel.reduce((s, r) => s + r.cantidad * (r.costo_promedio_usd ?? 0), 0)
  const bajoMinimo     = granel.filter(r => r.stock_minimo != null && r.cantidad <= r.stock_minimo).length

  return (
    <div className="px-8 py-10 max-w-[1500px] mx-auto">
      <PageHeader eyebrow="ERP · Inventario" title="Inventario." description="Stock granel por ubicación y unidades serializadas." meta={`${granel.length} productos · ${seriales.length} seriales`} />

      {error && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] text-[12px] text-red-300 fade-rise">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Unidades granel',   value: totalUnidades.toLocaleString(),                          delay: 1 },
          { label: 'Seriales en stock', value: disponibles.toString(),                                   delay: 2 },
          { label: 'Valor granel USD',  value: `$${Math.round(valorGranel).toLocaleString()}`,           delay: 3 },
          { label: 'Bajo mínimo',       value: bajoMinimo.toString(), warn: bajoMinimo > 0,              delay: 4 },
        ].map(({ label, value, warn, delay }) => (
          <div key={label} className={`glass-card p-5 fade-rise fade-rise-${delay}`}>
            <p className="eyebrow mb-3">{label}</p>
            <p className={`text-[28px] font-display font-bold tabular-nums leading-none ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      <section className="mb-10 fade-rise fade-rise-3">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Stock Granel</h2>
        {granel.length === 0
          ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin registros'}</div>
          : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Producto','Ubicación','Cantidad','Costo prom.','Total USD','Mín.','Actualizado'].map(h => (
                      <th key={h} className={`px-4 py-3 text-white/35 font-medium ${h === 'Producto' || h === 'Ubicación' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {granel.map((row, i) => {
                    const total = row.cantidad * (row.costo_promedio_usd ?? 0)
                    const bajo  = row.stock_minimo != null && row.cantidad <= row.stock_minimo
                    return (
                      <tr key={`${row.producto_id}-${row.ubicacion_id}`} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="px-4 py-2.5 font-medium text-white/85">{row.nombre ?? row.producto_id}</td>
                        <td className="px-4 py-2.5 text-white/45 font-mono text-[11px]">{row.ubicacion_id}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${bajo ? 'text-red-300' : 'text-white/85'}`}>{row.cantidad}{bajo && <span className="ml-1 text-[9px] text-red-400">▼</span>}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-white/55">${(row.costo_promedio_usd ?? 0).toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-white/85">${Math.round(total).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-white/35">{row.stock_minimo ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right text-white/30 text-[11px]">{row.fecha_actualizacion ? row.fecha_actualizacion.slice(0,10) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </section>

      <section className="fade-rise fade-rise-4">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Unidades Serializadas</h2>
        {seriales.length === 0
          ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin unidades'}</div>
          : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Serial ID','Producto','Nro. serie','Estado','Ubicación','Costo USD','Ingreso'].map(h => (
                      <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Costo USD','Ingreso'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seriales.slice(0, 200).map((s, i) => {
                    const est = SERIAL_ESTADO[s.estado] ?? { label: s.estado, cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
                    return (
                      <tr key={s.serial_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{s.serial_id}</td>
                        <td className="px-4 py-2.5 text-white/80">{s.producto_id}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-white/60">{s.numero_serie}</td>
                        <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${est.cls}`}>{est.label}</span></td>
                        <td className="px-4 py-2.5 text-white/35 text-[11px]">{s.ubicacion_id ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-white/55">{s.costo_usd != null ? `$${s.costo_usd.toFixed(0)}` : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-white/30 text-[11px]">{s.fecha_ingreso ? s.fecha_ingreso.slice(0,10) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {seriales.length > 200 && <p className="text-center py-3 text-[11px] text-white/25 border-t border-white/[0.04]">Mostrando 200 de {seriales.length}</p>}
            </div>
          )
        }
      </section>
    </div>
  )
}
