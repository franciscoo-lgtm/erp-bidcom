export const dynamic = 'force-dynamic'

import { AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { gasGet } from '@/app/lib/gas'

type Ticket  = { ticket_id: string; cliente_id: string; serial_id?: string; producto_id?: string; descripcion?: string; estado: string; prioridad?: string; fecha_apertura?: string; fecha_cierre?: string }
type Consumo = { consumo_id: string; ticket_id: string; repuesto_id: string; cantidad: number; costo_usd?: number; fecha?: string }

const TICKET_ESTADO: Record<string, { label: string; cls: string }> = {
  abierto:      { label: 'Abierto',      cls: 'bg-blue-500/15    text-blue-400    border-blue-500/30'   },
  en_proceso:   { label: 'En proceso',   cls: 'bg-purple-500/15  text-purple-400  border-purple-500/30' },
  esperando:    { label: 'Esperando',    cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30'  },
  resuelto:     { label: 'Resuelto',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'},
  cerrado:      { label: 'Cerrado',      cls: 'bg-zinc-500/10    text-zinc-400    border-zinc-500/20'   },
  cancelado:    { label: 'Cancelado',    cls: 'bg-red-500/15     text-red-400     border-red-500/30'    },
}
const PRIORIDAD: Record<string, string> = {
  critica: 'text-red-400',
  alta:    'text-amber-400',
  media:   'text-blue-400',
  baja:    'text-white/30',
}

function Badge({ estado }: { estado: string }) {
  const e = TICKET_ESTADO[estado] ?? { label: estado, cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${e.cls}`}>{e.label}</span>
}

export default async function PostventaPage() {
  let tickets: Ticket[]   = []
  let consumos: Consumo[] = []
  let error: string | null = null

  try {
    ;[tickets, consumos] = await Promise.all([
      gasGet<Ticket[]>('listarTicketsRMA'),
      gasGet<Consumo[]>('listarConsumoRMA'),
    ])
  } catch (err) { error = (err as Error).message }

  const abiertos  = tickets.filter(t => ['abierto','en_proceso','esperando'].includes(t.estado)).length
  const criticos  = tickets.filter(t => t.prioridad === 'critica' && t.estado !== 'resuelto' && t.estado !== 'cerrado').length
  const totalCost = consumos.reduce((s, c) => s + (c.cantidad * (c.costo_usd ?? 0)), 0)

  return (
    <div className="px-8 py-10 max-w-[1500px] mx-auto">
      <PageHeader eyebrow="ERP · Postventa" title="Postventa / RMA." description="Tickets de soporte técnico y reparación, consumo de repuestos." meta={`${tickets.length} tickets · ${consumos.length} consumos`} />

      {error && <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] text-[12px] text-red-300 fade-rise"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total tickets',     value: tickets.length.toString(),                                delay: 1 },
          { label: 'Abiertos',          value: abiertos.toString(),                                      delay: 2 },
          { label: 'Críticos',          value: criticos.toString(),  warn: criticos > 0,                delay: 3 },
          { label: 'Costo repuestos',   value: `$${Math.round(totalCost).toLocaleString()}`,             delay: 4 },
        ].map(({ label, value, warn, delay }) => (
          <div key={label} className={`glass-card p-5 fade-rise fade-rise-${delay}`}>
            <p className="eyebrow mb-3">{label}</p>
            <p className={`text-[28px] font-display font-bold tabular-nums leading-none ${warn ? 'text-red-300' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      <section className="mb-10 fade-rise fade-rise-3">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Tickets RMA</h2>
        {tickets.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin tickets'}</div> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-white/[0.06]">
                {['ID','Cliente','Serial','Descripción','Estado','Prior.','Apertura','Cierre'].map(h => (
                  <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Apertura','Cierre'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {tickets.map((t, i) => (
                  <tr key={t.ticket_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{t.ticket_id}</td>
                    <td className="px-4 py-2.5 text-white/80">{t.cliente_id}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-white/35">{t.serial_id ?? '—'}</td>
                    <td className="px-4 py-2.5 text-white/55 max-w-[160px] truncate">{t.descripcion ?? '—'}</td>
                    <td className="px-4 py-2.5"><Badge estado={t.estado} /></td>
                    <td className={`px-4 py-2.5 text-[10px] font-semibold uppercase ${PRIORIDAD[t.prioridad ?? 'baja'] ?? 'text-white/30'}`}>{t.prioridad ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-white/35 text-[11px]">{t.fecha_apertura ? t.fecha_apertura.slice(0,10) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-white/25 text-[11px]">{t.fecha_cierre ? t.fecha_cierre.slice(0,10) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="fade-rise fade-rise-4">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-4">Consumo de Repuestos</h2>
        {consumos.length === 0 ? <div className="glass-card p-10 text-center text-white/25 text-[13px]">{error ? 'Error al cargar' : 'Sin consumos'}</div> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-white/[0.06]">
                {['ID','Ticket','Repuesto','Cantidad','Costo unit.','Total','Fecha'].map(h => (
                  <th key={h} className={`px-4 py-3 text-white/35 font-medium ${['Cantidad','Costo unit.','Total','Fecha'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {consumos.map((c, i) => {
                  const total = c.cantidad * (c.costo_usd ?? 0)
                  return (
                    <tr key={c.consumo_id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{c.consumo_id}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-white/40">{c.ticket_id}</td>
                      <td className="px-4 py-2.5 text-white/80">{c.repuesto_id}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-white/70">{c.cantidad}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-white/45">{c.costo_usd != null ? `$${c.costo_usd.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-white/85">${Math.round(total).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-white/30 text-[11px]">{c.fecha ? c.fecha.slice(0,10) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
