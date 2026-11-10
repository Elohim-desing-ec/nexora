import { lazy, Suspense, useState } from 'react'
import { Loader2, MapPin, Search } from 'lucide-react'
import { Campo, NumInput } from './ui'
import { TIPOS_SUCURSAL, type Sucursal, type TipoSucursal } from '../data/base'
import { PAISES, bandera, pais } from '../data/paises'
import { buscarDireccion, type Lugar } from '../lib/geo'
import type { Vuelo } from './Globo'

const Globo = lazy(() => import('./Globo'))

export const sucursalVacia = (paisCodigo = 'EC'): Sucursal => {
  const p = pais(paisCodigo)
  return { id: '', nombre: '', tipo: 'Sucursal', pais: paisCodigo, ciudad: '', direccion: '', lat: p?.lat ?? 0, lng: p?.lng ?? 0, activa: true }
}

/** Formulario de sucursal con búsqueda de dirección real (OpenStreetMap) y ubicación en el globo 3D. */
export function EditorSucursal({ v, set }: { v: Sucursal; set: (s: Sucursal) => void }) {
  const [q, setQ] = useState(''), [res, setRes] = useState<Lugar[]>([]), [cargando, setCargando] = useState(false), [msg, setMsg] = useState('')
  const [vuelo, setVuelo] = useState<Vuelo | null>(null)
  const buscar = async () => {
    if (!q.trim()) return
    setCargando(true); setMsg('')
    try { const r = await buscarDireccion(q); setRes(r); if (!r.length) setMsg('Sin resultados. Pruebe con ciudad y país, ej.: "Av. Amazonas, Quito, Ecuador".') }
    catch { setMsg('No se pudo consultar el mapa (¿sin internet?). Puede hacer clic en el globo o escribir las coordenadas.') }
    setCargando(false)
  }
  const elegir = (l: Lugar) => {
    set({ ...v, lat: +l.lat.toFixed(6), lng: +l.lng.toFixed(6), ciudad: v.ciudad || l.ciudad, pais: PAISES.some((p) => p.codigo === l.pais) ? l.pais : v.pais, direccion: v.direccion || l.nombre.split(',').slice(0, 2).join(',') })
    setVuelo({ lng: l.lng, lat: l.lat, zoom: 15, t: Date.now() }); setRes([])
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Código" ayuda="Corto y único, ej.: GYE-01, BOG, MAD"><input className="inp uppercase" maxLength={12} value={v.id} onChange={(e) => set({ ...v, id: e.target.value.replace(/\s/g, '-').toUpperCase() })} /></Campo>
          <Campo label="Tipo"><select className="inp" value={v.tipo} onChange={(e) => set({ ...v, tipo: e.target.value as TipoSucursal })}>{TIPOS_SUCURSAL.map((t) => <option key={t}>{t}</option>)}</select></Campo>
        </div>
        <Campo label="Nombre"><input className="inp" value={v.nombre} onChange={(e) => set({ ...v, nombre: e.target.value })} placeholder="Ej.: Centro de distribución Bogotá" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="País"><select className="inp" value={v.pais} onChange={(e) => { const p = pais(e.target.value); set({ ...v, pais: e.target.value, lat: p?.lat ?? v.lat, lng: p?.lng ?? v.lng }); if (p) setVuelo({ lng: p.lng, lat: p.lat, zoom: 4, t: Date.now() }) }}>{PAISES.map((p) => <option key={p.codigo} value={p.codigo}>{bandera(p.codigo)} {p.nombre}</option>)}</select></Campo>
          <Campo label="Ciudad"><input className="inp" value={v.ciudad} onChange={(e) => set({ ...v, ciudad: e.target.value })} /></Campo>
        </div>
        <Campo label="Dirección"><input className="inp" value={v.direccion} onChange={(e) => set({ ...v, direccion: e.target.value })} /></Campo>
        <div className="rounded-xl bg-fg/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cian"><MapPin size={13} />Ubicación real</div>
          <div className="flex gap-2"><input className="inp" placeholder="Buscar dirección, ciudad o lugar…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar() } }} />
            <button type="button" onClick={buscar} className="grid w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-primario to-violeta text-black" aria-label="Buscar dirección">{cargando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}</button></div>
          {res.length > 0 && <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">{res.map((l, k) => <li key={k}><button type="button" onClick={() => elegir(l)} className="w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-primario/15">{bandera(l.pais)} {l.nombre}</button></li>)}</ul>}
          {msg && <p className="mt-2 text-xs text-alerta">{msg}</p>}
          <div className="mt-2 grid grid-cols-2 gap-2"><Campo label="Latitud"><NumInput step={0.0001} value={v.lat} onChange={(x) => set({ ...v, lat: x })} /></Campo><Campo label="Longitud"><NumInput step={0.0001} value={v.lng} onChange={(x) => set({ ...v, lng: x })} /></Campo></div>
          <p className="mt-1 text-[11px] text-muted">Datos de OpenStreetMap. También puede hacer clic en el globo para ubicarla.</p>
        </div>
      </div>
      <Suspense fallback={<div className="espacio min-h-[320px] rounded-xl" />}>
        <Globo className="min-h-[320px] lg:min-h-full" autoRotar={false} volarA={vuelo} puntos={[{ id: 'nueva', nombre: v.nombre || 'Nueva sucursal', lat: v.lat, lng: v.lng, valor: 1, detalle: [v.ciudad, pais(v.pais)?.nombre].filter(Boolean).join(', ') }]} seleccion="nueva"
          onClickMapa={(lng, lat) => set({ ...v, lat: +lat.toFixed(6), lng: +lng.toFixed(6) })} />
      </Suspense>
    </div>
  )
}
