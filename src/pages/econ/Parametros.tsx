import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useEcon } from '../../store/useEcon'
import { Campo, NumInput } from '../../components/ui'
import { inversion, NOMBRE_DEP, type MetodoDep } from '../../lib/finance'
import { money } from '../../lib/format'

const Grupo = ({ t, children }: { t: string; children: ReactNode }) => <details open className="group rounded-xl bg-fg/5 p-3"><summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-cian">{t}</summary><div className="mt-3 space-y-2.5">{children}</div></details>
const Pct = ({ v, on }: { v: number; on: (x: number) => void }) => <NumInput step={0.5} value={+(v * 100).toFixed(4)} onChange={(x) => on(x / 100)} />

function Serie({ label, valores, on }: { label: string; valores: number[]; on: (k: number, v: number) => void }) {
  return <div><div className="mb-1 text-xs text-muted">{label}</div><div className="grid grid-cols-4 gap-1.5">{valores.map((v, k) => <label key={k} className="text-[10px] text-muted">Año {k + 1}<NumInput className="!px-2 !py-1 text-xs" step={100} value={v} onChange={(x) => on(k, x)} /></label>)}</div></div>
}

/** Panel lateral: todos los datos del proyecto son editables y se recalcula en tiempo real. */
export default function Parametros() {
  const { p, set } = useEcon()
  return (
    <div className="space-y-3 text-sm">
      <Grupo t="Proyecto">
        <div className="grid grid-cols-2 gap-2">
          <Campo label="TMAR (%)"><Pct v={p.i} on={(x) => set((q) => { q.i = x })} /></Campo>
          <Campo label="Impuesto renta (%)"><Pct v={p.impuesto} on={(x) => set((q) => { q.impuesto = x })} /></Campo>
          <Campo label="Licencia"><NumInput step={500} value={p.licencia} onChange={(x) => set((q) => { q.licencia = x })} /></Campo>
          <Campo label="Implementación"><NumInput step={500} value={p.implementacion} onChange={(x) => set((q) => { q.implementacion = x })} /></Campo>
          <Campo label="Capacitación"><NumInput step={500} value={p.capacitacion} onChange={(x) => set((q) => { q.capacitacion = x })} /></Campo>
          <Campo label="Valor residual S"><NumInput step={500} value={p.S} onChange={(x) => set((q) => { q.S = x })} /></Campo>
          <Campo label="Vida fiscal n"><NumInput min={1} max={8} value={p.n} onChange={(x) => set((q) => { q.n = Math.max(1, Math.min(8, Math.round(x))) })} /></Campo>
          <Campo label="Inflación (%)"><Pct v={p.inflacion} on={(x) => set((q) => { q.inflacion = x })} /></Campo>
        </div>
        <div className="rounded-lg bg-primario/10 px-3 py-2 text-xs">Inversión P = <b className="tnum">{money(inversion(p))}</b></div>
      </Grupo>
      <Grupo t="Costos anuales (actual vs NEXORA)">
        <div className="grid grid-cols-2 gap-1.5 text-[10px] uppercase text-muted"><span>Actual</span><span>NEXORA</span></div>
        {p.conceptos.map((c, k) => <div key={k}><div className="mb-1 flex gap-1"><input aria-label="Concepto" className="inp !px-2 !py-1 text-xs" value={c.nombre} onChange={(e) => set((q) => { q.conceptos[k].nombre = e.target.value })} />
          <button aria-label="Quitar concepto" title="Quitar" disabled={p.conceptos.length <= 1} className="rounded-lg px-1.5 text-muted hover:bg-peligro/15 hover:text-peligro disabled:opacity-30" onClick={() => set((q) => { q.conceptos.splice(k, 1) })}><Trash2 size={13} /></button></div>
          <div className="grid grid-cols-2 gap-1.5"><NumInput step={100} value={c.actual} onChange={(x) => set((q) => { q.conceptos[k].actual = x })} /><NumInput step={100} value={c.nuevo} onChange={(x) => set((q) => { q.conceptos[k].nuevo = x })} /></div></div>)}
        <button className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-fg/20 py-2 text-xs text-muted hover:border-primario hover:text-fg" onClick={() => set((q) => { q.conceptos.push({ nombre: 'Nuevo concepto', actual: 0, nuevo: 0 }) })}><Plus size={13} />Agregar concepto de costo</button>
        <button className="w-full rounded-lg bg-fg/5 py-1.5 text-[11px] text-muted hover:bg-fg/10" title="Copia el total de costos al COA del año 1 del defensor y del retador" onClick={() => set((q) => { q.defensor.coa[0] = q.conceptos.reduce((s, c) => s + c.actual, 0); q.retador.coa[0] = q.conceptos.reduce((s, c) => s + c.nuevo, 0) })}>Usar estos totales como COA del año 1</button>
      </Grupo>
      <Grupo t="Defensor (sistema actual)">
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Valor de mercado hoy"><NumInput step={100} value={p.defensor.vm0} onChange={(x) => set((q) => { q.defensor.vm0 = x })} /></Campo>
          <Campo label="Costo original (hundido)"><NumInput step={500} value={p.defensor.costoOriginal} onChange={(x) => set((q) => { q.defensor.costoOriginal = x })} /></Campo>
          <Campo label="Edad (años)"><NumInput value={p.defensor.edad} onChange={(x) => set((q) => { q.defensor.edad = Math.max(1, Math.round(x)) })} /></Campo>
          <Campo label="Vida restante máx."><NumInput min={1} max={4} value={p.defensor.vidaRestante} onChange={(x) => set((q) => { q.defensor.vidaRestante = Math.max(1, Math.min(4, Math.round(x))) })} /></Campo>
        </div>
        <Serie label="Valor de mercado al final del año" valores={p.defensor.vm} on={(k, x) => set((q) => { q.defensor.vm[k] = x })} />
        <Serie label="COA" valores={p.defensor.coa} on={(k, x) => set((q) => { q.defensor.coa[k] = x })} />
      </Grupo>
      <Grupo t="Retador (NEXORA)">
        <Serie label="Valor de mercado al final del año" valores={p.retador.vm} on={(k, x) => set((q) => { q.retador.vm[k] = x })} />
        <Serie label="COA" valores={p.retador.coa} on={(k, x) => set((q) => { q.retador.coa[k] = x })} />
      </Grupo>
      <Grupo t="Depreciación">
        <Campo label="Método para FEDI"><select className="inp" value={p.depMetodo} onChange={(e) => set((q) => { q.depMetodo = e.target.value as MetodoDep })}>{Object.entries(NOMBRE_DEP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Factor saldo decreciente" ayuda="2 = doble · 1,5 = 150 %"><NumInput step={0.1} value={p.factorSD} onChange={(x) => set((q) => { q.factorSD = x })} /></Campo>
          <Campo label="Clase MACRS"><select className="inp" value={p.macrsClase} onChange={(e) => set((q) => { q.macrsClase = +e.target.value as 5 })}><option value={3}>3 años</option><option value={5}>5 años</option><option value={7}>7 años</option></select></Campo>
        </div>
        <Serie label="Unidades de producción (transacciones/año)" valores={p.unidades} on={(k, x) => set((q) => { q.unidades[k] = x })} />
      </Grupo>
    </div>
  )
}
