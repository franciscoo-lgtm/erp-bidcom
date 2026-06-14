export const dynamic = 'force-dynamic'

import { AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { gasGet } from '@/app/lib/gas'

type Presupuesto = { presupuesto_id: string; cliente_id: string; fecha: string; validez_dias?: number; estado: string; total_usd: number; referencia?: string }
type Factura     = { factura_id: string; cliente_id: string; entidad_legal_id?: string; fecha: string; total_usd: number; estado: string; canal?: string }
type Remito      = { remito_id: string; factura_id?: string; cliente_id: string; fecha?: string; estado: string }

const PPTO_ESTADO: Record<string, { label: string; cls: string }> = {
  borrador:  { label: 'Borrador',  cls: 'bg-zinc-500/10    text-zinc-400    border-zinc-500/20'   },
  enviado:   { label: 'Enviado',   cls: 'bg-blue-500/15    text-blue-400    border-blue-500/30'   },
  aprobado:  { label: 'Aprobado',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'},
  rechazado: { label: 'Rechazado', cls: 'bg-red-500/15     text-red-400     border-red-500/30'    },
  facturado: { label: 'Facturado', cls: 'bg-purple-500/15  text-purple-400  border-purple-500/30' },
  vencido:   { label: 'Vencido',   cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30'  },
}
const REMITO_ESTADO: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30'  },
  entregado: { label: 'Entregado', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'},
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/15     text-red-400     border-red-500/30'    },
}

function Badge({ estado, map }: { estado: string; map: typeof PPTO_ESTADO }) {
  const e = map[estado] ?? { label: estado, cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${e.cls}`}>{e.label}</span>
}

export default async function ComercialPage() {
  let presupuestos: Presupuesto[] = []
  let facturas:     Factura[]     = []
  let remitos:      Remito[]      = []
  let error: string | null = null

  try {
    ;[presupuestos, facturas, remitos] = await Promise.all([
      gasGet<Presupuesto[]>('listarPresupuestos'),
      gasGet<Factura[]>('listarFacturas'),
      gasGet<Remito[]>('listarRemitos'),
    ])
  } catch (err) { error = (err as Error).message }

  const aprobados     = presupuestos.filter(p => p.estado === 'aprobado').length
  const totalFact     = facturas.reduce((s, f) => s + (f.total_usd ?? 0), 0)
  const remitosPend   = remitos.filter(r => r.estado === 'pendiente').length

  return (
    <div className="px-8 py-10 max-w-[1500px] mx-auto">
      <PageHeader eyebrow="ERP · Comercial" title="Comercial." description="Presupuestos, facturas Canal A/B y remitos de entrega." meta={`${presupuestos.length} presupuestos · ${facturas.length} facturas`} />

      {error && <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] text-[12px] text-red-300 fade-rise"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Presupuestos',      value: presupuestos.length.toString() },
          { label: 'Aprobados',         value: aprobados.toString() },
          { label: 'Facturado USD',     value: `$${Math.round(totalFact).toLocaleString()}` },
          { label: 'Remitos pendientes',value: remitosPend.toString() },
        ].map(({ label, value }, i) => (
          <div key={label} className={`glass-card p-5 fade-rise fade-rise-${i+1}`}>
            <p className="eyebrow mb-3">{label}</p>
            <p className="text-[28px] font-display font-bold text-white tabular-nums leading-none">{value}</p>
          </div>
        ))}
      </div>

      <section className="mb-10 fade-rise fade-rise-3">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Presupuestos</h2>
        {presupuestos.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin presupuestos'}</div> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-white/[0.06]">
                {['ID','Cliente','Referencia','Estado','Total USD','Fecha','Validez'].map(h => (
                  <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Total USD','Fecha','Validez'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {presupuestos.map((p, i) => (
                  <tr key={p.presupuesto_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{p.presupuesto_id}</td>
                    <td className="px-4 py-2.5 text-white/80">{p.cliente_id}</td>
                    <td className="px-4 py-2.5 text-white/50 max-w-[140px] truncate">{p.referencia ?? '—'}</td>
                    <td className="px-4 py-2.5"><Badge estado={p.estado} map={PPTO_ESTADO} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-white/85">${(p.total_usd ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-white/35 text-[11px]">{p.fecha ? p.fecha.slice(0,10) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-white/35 text-[11px]">{p.validez_dias != null ? `${p.validez_dias}d` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10 fade-rise fade-rise-4">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Facturas</h2>
        {facturas.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin facturas'}</div> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-white/[0.06]">
                {['ID','Cliente','Entidad','Canal','Estado','Total USD','Fecha'].map(h => (
                  <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Total USD','Fecha'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {facturas.map((f, i) => (
                  <tr key={f.factura_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{f.factura_id}</td>
                    <td className="px-4 py-2.5 text-white/80">{f.cliente_id}</td>
                    <td className="px-4 py-2.5 text-white/45 text-[11px]">{f.entidad_legal_id ?? '—'}</td>
                    <td className="px-4 py-2.5"><span className={`text-[10px] font-semibold uppercase tracking-wider ${f.canal === 'B' ? 'text-amber-400' : 'text-blue-400'}`}>Canal {f.canal ?? 'A'}</span></td>
                    <td className="px-4 py-2.5"><Badge estado={f.estado} map={PPTO_ESTADO} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-white/85">${(f.total_usd ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-white/35 text-[11px]">{f.fecha ? f.fecha.slice(0,10) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="fade-rise fade-rise-5">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Remitos</h2>
        {remitos.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin remitos'}</div> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-white/[0.06]">
                {['ID','Factura','Cliente','Estado','Fecha'].map(h => (
                  <th key={h} className={`px-4 py-3 text-white/35 font-medium ${h === 'Fecha' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {remitos.map((r, i) => (
                  <tr key={r.remito_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{r.remito_id}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{r.factura_id ?? '—'}</td>
                    <td className="px-4 py-2.5 text-white/80">{r.cliente_id}</td>
                    <td className="px-4 py-2.5"><Badge estado={r.estado} map={REMITO_ESTADO} /></td>
                    <td className="px-4 py-2.5 text-right text-white/35 text-[11px]">{r.fecha ? r.fecha.slice(0,10) : '—'}</td>
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
