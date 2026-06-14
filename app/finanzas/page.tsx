export const dynamic = 'force-dynamic'

import { AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { gasGet } from '@/app/lib/gas'

type CuentaCobrar = { cc_id: string; cliente_id: string; factura_id?: string; monto_usd: number; fecha_vencimiento?: string; estado: string; fecha_pago?: string }
type CuentaPagar  = { cp_id: string; proveedor_id: string; monto_usd: number; fecha_vencimiento?: string; estado: string; fecha_pago?: string; concepto?: string }
type TipoCambio   = { tc_id: string; moneda: string; tipo: string; valor: number; fecha: string }

const ESTADO: Record<string, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30'  },
  parcial:    { label: 'Parcial',    cls: 'bg-blue-500/15    text-blue-400    border-blue-500/30'   },
  pagado:     { label: 'Pagado',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'},
  vencido:    { label: 'Vencido',    cls: 'bg-red-500/15     text-red-400     border-red-500/30'    },
  cancelado:  { label: 'Cancelado',  cls: 'bg-zinc-500/10    text-zinc-400    border-zinc-500/20'   },
}
function Badge({ estado }: { estado: string }) {
  const e = ESTADO[estado] ?? { label: estado, cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${e.cls}`}>{e.label}</span>
}

export default async function FinanzasPage() {
  let cobrar: CuentaCobrar[] = []
  let pagar:  CuentaPagar[]  = []
  let tc:     TipoCambio[]   = []
  let error: string | null = null

  try {
    ;[cobrar, pagar, tc] = await Promise.all([
      gasGet<CuentaCobrar[]>('listarCuentasCobrar'),
      gasGet<CuentaPagar[]>('listarCuentasPagar'),
      gasGet<TipoCambio[]>('listarTiposCambio'),
    ])
  } catch (err) { error = (err as Error).message }

  const porCobrar  = cobrar.filter(c => c.estado === 'pendiente' || c.estado === 'parcial').reduce((s, c) => s + (c.monto_usd ?? 0), 0)
  const porPagar   = pagar.filter(p => p.estado === 'pendiente' || p.estado === 'parcial').reduce((s, p) => s + (p.monto_usd ?? 0), 0)
  const vencidos   = cobrar.filter(c => c.estado === 'vencido').length
  const tcOficial  = tc.find(t => t.tipo?.toLowerCase().includes('oficial'))
  const tcBlue     = tc.find(t => t.tipo?.toLowerCase().includes('blue') || t.tipo?.toLowerCase().includes('paralelo'))

  return (
    <div className="px-8 py-10 max-w-[1500px] mx-auto">
      <PageHeader eyebrow="ERP · Finanzas" title="Finanzas." description="Cuentas a cobrar y pagar, pagos y tipos de cambio." meta={`${cobrar.length} cuentas a cobrar · ${pagar.length} a pagar`} />

      {error && <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] text-[12px] text-red-300 fade-rise"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Por cobrar USD',  value: `$${Math.round(porCobrar).toLocaleString()}`,  delay: 1 },
          { label: 'Por pagar USD',   value: `$${Math.round(porPagar).toLocaleString()}`,   delay: 2 },
          { label: 'Vencidos',        value: vencidos.toString(), warn: vencidos > 0,        delay: 3 },
          { label: 'Tipo cambio',     value: tcBlue ? `$${tcBlue.valor.toLocaleString()}` : tcOficial ? `$${tcOficial.valor.toLocaleString()}` : '—', delay: 4 },
        ].map(({ label, value, warn, delay }) => (
          <div key={label} className={`glass-card p-5 fade-rise fade-rise-${delay}`}>
            <p className="eyebrow mb-3">{label}</p>
            <p className={`text-[28px] font-display font-bold tabular-nums leading-none ${warn ? 'text-red-300' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      {tc.length > 0 && (
        <section className="mb-8 fade-rise fade-rise-2">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Tipos de Cambio Vigentes</h2>
          <div className="flex flex-wrap gap-3">
            {tc.slice(0, 8).map(t => (
              <div key={t.tc_id} className="glass-card px-5 py-3 flex gap-6 items-center">
                <div><p className="eyebrow mb-0.5">{t.moneda} · {t.tipo}</p><p className="text-[20px] font-display font-bold text-white tabular-nums">${t.valor.toLocaleString()}</p></div>
                <p className="text-[11px] text-white/25">{t.fecha ? t.fecha.slice(0,10) : '—'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="fade-rise fade-rise-3">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Cuentas a Cobrar</h2>
          {cobrar.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin registros'}</div> : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-white/[0.06]">
                  {['ID','Cliente','Estado','Monto USD','Vence'].map(h => (
                    <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Monto USD','Vence'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {cobrar.map((c, i) => (
                    <tr key={c.cc_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{c.cc_id}</td>
                      <td className="px-4 py-2.5 text-white/80">{c.cliente_id}</td>
                      <td className="px-4 py-2.5"><Badge estado={c.estado} /></td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-white/85">${(c.monto_usd ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-white/35 text-[11px]">{c.fecha_vencimiento ? c.fecha_vencimiento.slice(0,10) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="fade-rise fade-rise-4">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Cuentas a Pagar</h2>
          {pagar.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin registros'}</div> : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-white/[0.06]">
                  {['ID','Proveedor','Concepto','Estado','Monto USD','Vence'].map(h => (
                    <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Monto USD','Vence'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {pagar.map((p, i) => (
                    <tr key={p.cp_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{p.cp_id}</td>
                      <td className="px-4 py-2.5 text-white/80">{p.proveedor_id}</td>
                      <td className="px-4 py-2.5 text-white/50 max-w-[120px] truncate text-[11px]">{p.concepto ?? '—'}</td>
                      <td className="px-4 py-2.5"><Badge estado={p.estado} /></td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-white/85">${(p.monto_usd ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-white/35 text-[11px]">{p.fecha_vencimiento ? p.fecha_vencimiento.slice(0,10) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
