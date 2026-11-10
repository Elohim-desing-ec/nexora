import { useState } from 'react'
import { FileSpreadsheet, FileText, GraduationCap, RotateCcw, Save, SlidersHorizontal, X } from 'lucide-react'
import { useEcon } from '../store/useEcon'
import { useApp } from '../store/useApp'
import { Badge, Button, Tabs, Titulo, cx } from '../components/ui'
import Parametros from './econ/Parametros'
import * as A from './econ/TabsA'
import * as B from './econ/TabsB'
import { exportarAnalisisExcel, exportarAnalisisPDF } from '../lib/export'
import { reemplazo } from '../lib/finance'

export const TABS = [
  { id: 'comparacion', label: 'a · Costos', C: A.Comparacion }, { id: 'reemplazo', label: 'b · Reemplazo', C: A.Reemplazo },
  { id: 'enfoques', label: 'c · Enfoques', C: A.Enfoques }, { id: 'estudio', label: 'd · Período de estudio', C: A.Estudio },
  { id: 'vida', label: 'e · Vida útil', C: A.VidaUtil }, { id: 'depreciacion', label: 'f · Depreciación', C: B.Depreciacion },
  { id: 'impuestos', label: 'g · Después de impuestos', C: B.Impuestos }, { id: 'indicadores', label: 'h · Indicadores', C: B.Indicadores },
  { id: 'sensibilidad', label: 'i · Sensibilidad', C: B.Sensibilidad }, { id: 'inflacion', label: 'j · Inflación', C: B.Inflacion },
  { id: 'recomendacion', label: 'k · ¿Con mi dinero?', C: B.Recomendacion }, { id: 'escenarios', label: 'Escenarios', C: B.Escenarios },
] as const

export default function Economico() {
  const { p, tab, setTab, restaurar, guardar } = useEcon()
  const presentacion = useApp((s) => s.presentacion)
  const [panel, setPanel] = useState(true)
  const T = TABS.find((t) => t.id === tab) ?? TABS[0]
  const R = reemplazo(p)
  return (
    <div>
      <Titulo titulo="Análisis económico" sub="Unidad 4 · Análisis de reemplazo y depreciación — todo se recalcula en tiempo real">
        <Badge tono={R.reemplazarAhora ? 'verde' : 'ambar'}>{R.veredicto}</Badge>
        <Button onClick={() => setPanel(!panel)}><SlidersHorizontal size={15} />Parámetros</Button>
        <Button onClick={restaurar}><RotateCcw size={15} />Restaurar valores del proyecto</Button>
        <Button onClick={() => { const n = prompt('Nombre del escenario:', `Escenario TMAR ${(p.i * 100).toFixed(0)} %`); if (n) { guardar(n); setTab('escenarios') } }}><Save size={15} />Guardar escenario</Button>
        <Button onClick={() => exportarAnalisisExcel(p)}><FileSpreadsheet size={15} />Excel</Button>
        <Button onClick={() => exportarAnalisisPDF(p)}><FileText size={15} />PDF</Button>
        <Button title="Abre el Modo Defensa en otra pestaña" onClick={() => window.open('#/defensa', '_blank')}><GraduationCap size={15} />Modo Defensa ↗</Button>
      </Titulo>
      <Tabs items={TABS.map((t) => ({ id: t.id, label: t.label }))} valor={T.id} onChange={setTab} />
      <div className={cx('mt-4 grid gap-4', panel && !presentacion && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
        <div className="min-w-0 space-y-4"><T.C /></div>
        {panel && !presentacion && (
          <aside className="glass fixed inset-y-3 right-3 z-40 w-[min(360px,calc(100vw-1.5rem))] overflow-y-auto p-4 xl:sticky xl:top-24 xl:z-0 xl:h-[calc(100vh-7rem)] xl:w-auto" style={{ background: 'color-mix(in srgb, var(--bg2) 80%, transparent)' }}>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Parámetros</h3><button aria-label="Cerrar panel" className="rounded-lg p-1 hover:bg-fg/10" onClick={() => setPanel(false)}><X size={16} /></button></div>
            <Parametros />
          </aside>
        )}
      </div>
    </div>
  )
}
