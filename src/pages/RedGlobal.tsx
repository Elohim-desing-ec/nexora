import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Building2, Globe2, Landmark, MapPin, RefreshCw, Rotate3d, TrendingUp, Plus } from 'lucide-react'
import { useApp } from '../store/useApp'
import { Badge, Button, Card, Kpi, Scroll, Titulo, cx } from '../components/ui'
import type { EstiloGlobo, Vuelo, ArcoGlobo } from '../components/Globo'
import { bandera, pais, SIMBOLOS } from '../data/paises'
import { money, num, pct } from '../lib/format'
import { stockTotal, valorInventario, ventasRecientes } from '../lib/inventario'
import { tiposDeCambio, type Tasas } from '../lib/geo'

const Globo = lazy(() => import('../components/Globo'))
const nf = (v: number, d = 0) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v)

export default function RedGlobal() {
  const { sucursales, productos, movimientos, empresa, usuario, ir } = useApp()
  const [estilo, setEstilo] = useState<EstiloGlobo>('oscuro'), [rotar, setRotar] = useState(true)
  const [sel, setSel] = useState<string | null>(null), [vuelo, setVuelo] = useState<Vuelo | null>(null)
  const [fx, setFx] = useState<Tasas | null>(null), [fxError, setFxError] = useState(false)
  useEffect(() => { tiposDeCambio(empresa.moneda).then((t) => (t ? setFx(t) : setFxError(true))) }, [empresa.moneda])

  const d = useMemo(() => {
    const ventas = ventasRecientes(movimientos, productos, 30)
    const filas = sucursales.map((s) => ({ s, valor: valorInventario(productos, s.id), unidades: productos.reduce((a, p) => a + stockTotal(p, s.id), 0), ventas: ventas[s.id] ?? 0 }))
    const total = filas.reduce((a, f) => a + f.valor, 0)
    const porPais = [...new Set(sucursales.map((s) => s.pais))].map((c) => {
      const fs = filas.filter((f) => f.s.pais === c)
      return { pais: c, sucursales: fs.length, ciudades: new Set(fs.map((f) => f.s.ciudad)).size, valor: fs.reduce((a, f) => a + f.valor, 0), unidades: fs.reduce((a, f) => a + f.unidades, 0), ventas: fs.reduce((a, f) => a + f.ventas, 0) }
    }).sort((a, b) => b.valor - a.valor)
    // Arcos: transferencias entre sucursales (últimos 180 días)
    const desde = Date.now() - 180 * 864e5, flujo = new Map<string, number>()
    for (const m of movimientos) if (m.tipo === 'Transferencia' && m.cantidad < 0 && new Date(m.fecha).getTime() > desde) { const a = m.nota?.replace('Hacia ', ''); if (a) flujo.set(`${m.sucursal}>${a}`, (flujo.get(`${m.sucursal}>${a}`) ?? 0) - m.cantidad) }
    const arcos: ArcoGlobo[] = [...flujo.entries()].flatMap(([k, peso]) => { const [x, y] = k.split('>').map((id) => sucursales.find((s) => s.id === id)); return x && y ? [{ de: [x.lng, x.lat] as [number, number], a: [y.lng, y.lat] as [number, number], peso }] : [] })
    return { filas, total, porPais, arcos, ciudades: new Set(sucursales.map((s) => `${s.ciudad}|${s.pais}`)).size, ventas: filas.reduce((a, f) => a + f.ventas, 0) }
  }, [sucursales, productos, movimientos])

  const local = (valor: number, codigoPais: string) => {
    const m = pais(codigoPais)?.moneda
    if (!m || m === empresa.moneda || !fx?.tasas[m]) return null
    return `${SIMBOLOS[m] ?? m} ${nf(valor * fx.tasas[m])}`
  }
  const volar = (id: string) => { const s = sucursales.find((x) => x.id === id); if (s) { setSel(id); setVuelo({ lng: s.lng, lat: s.lat, zoom: 13, t: Date.now() }) } }

  if (!sucursales.length) return <div className="space-y-5"><Titulo titulo="Red global" sub="Sus sucursales en el mundo" />
    <Card><div className="py-10 text-center"><Globe2 className="mx-auto mb-3 text-cian" size={40} /><p className="text-sm text-muted">Aún no hay sucursales registradas.</p>{usuario?.rol === 'Gerente General' && <Button variante="primario" className="mt-4" onClick={() => ir('configuracion')}><Plus size={15} />Agregar sucursales</Button>}</div></Card></div>

  return (
    <div className="space-y-5">
      <Titulo titulo="Red global" sub={`${empresa.nombre || 'Su empresa'} · operación nacional e internacional en tiempo real`}>
        {usuario?.rol === 'Gerente General' && <Button onClick={() => ir('configuracion')}><Plus size={15} />Sucursal</Button>}
      </Titulo>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi titulo="Países" valor={d.porPais.length} formato={(v) => num(v, 0)} icono={<Globe2 size={15} />} tono="cian" />
        <Kpi titulo="Ciudades" valor={d.ciudades} formato={(v) => num(v, 0)} icono={<MapPin size={15} />} tono="violeta" />
        <Kpi titulo="Sucursales" valor={sucursales.length} formato={(v) => num(v, 0)} icono={<Building2 size={15} />} />
        <Kpi titulo="Inventario global" valor={d.total} formato={(v) => money(v, 0)} icono={<Landmark size={15} />} tono="verde" sub={empresa.moneda} />
        <Kpi titulo="Ventas 30 días" valor={d.ventas} formato={(v) => money(v, 0)} icono={<TrendingUp size={15} />} tono="ambar" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="!p-3 xl:col-span-2">
          <div className="relative">
            <Suspense fallback={<div className="espacio h-[560px] rounded-xl" />}>
              <Globo className="h-[460px] sm:h-[560px]" puntos={d.filas.map((f) => ({ id: f.s.id, nombre: `${bandera(f.s.pais)} ${f.s.nombre}`, lat: f.s.lat, lng: f.s.lng, valor: f.valor + 1, detalle: `${f.s.tipo} · ${f.s.ciudad}\nInventario: ${money(f.valor, 0)}${local(f.valor, f.s.pais) ? ` (${local(f.valor, f.s.pais)})` : ''}\nVentas 30 d: ${money(f.ventas, 0)}` }))}
                arcos={d.arcos} seleccion={sel} onSeleccion={setSel} estilo={estilo} autoRotar={rotar} volarA={vuelo} />
            </Suspense>
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <div className="flex overflow-hidden rounded-xl border border-white/15 bg-black/70 text-xs text-white backdrop-blur">{(['oscuro', 'satelite', 'claro'] as const).map((e) => <button key={e} onClick={() => setEstilo(e)} className={cx('px-3 py-1.5 capitalize transition', estilo === e ? 'bg-gradient-to-r from-primario to-violeta font-semibold text-black' : 'hover:bg-white/10')}>{e === 'satelite' ? 'Satélite' : e}</button>)}</div>
              <button onClick={() => setRotar(!rotar)} className={cx('flex items-center gap-1 rounded-xl border border-white/15 px-3 py-1.5 text-xs text-white backdrop-blur', rotar ? 'bg-primario/30' : 'bg-black/70')}><Rotate3d size={13} />Rotación</button>
              <button onClick={() => { setSel(null); setVuelo({ lng: sucursales[0].lng, lat: sucursales[0].lat, zoom: 1.6, t: Date.now() }) }} className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur"><Globe2 size={13} />Vista mundial</button>
            </div>
            <p className="pointer-events-none absolute bottom-3 left-3 hidden text-[11px] text-white/70 sm:block">Arrastre para girar · rueda o pellizco para acercar · clic derecho + arrastrar para inclinar</p>
          </div>
        </Card>
        <Card titulo="Sucursales por país" className="max-h-[620px] overflow-y-auto">
          <div className="space-y-3">{d.porPais.map((p) => <div key={p.pais}>
            <div className="mb-1 flex items-center justify-between text-sm font-semibold"><span>{bandera(p.pais)} {pais(p.pais)?.nombre ?? p.pais}</span><span className="tnum text-muted">{pct(d.total ? p.valor / d.total : 0, 0)}</span></div>
            <ul className="space-y-1">{d.filas.filter((f) => f.s.pais === p.pais).map((f) => <li key={f.s.id}><button onClick={() => volar(f.s.id)} className={cx('w-full rounded-xl px-3 py-2 text-left transition', sel === f.s.id ? 'bg-primario/20' : 'bg-fg/5 hover:bg-fg/10')}>
              <div className="flex items-center justify-between gap-2 text-sm"><span className="truncate"><b className="font-mono text-xs">{f.s.id}</b> · {f.s.nombre}</span><Badge tono={f.s.tipo === 'Matriz' ? 'violeta' : 'gris'}>{f.s.tipo}</Badge></div>
              <div className="mt-0.5 flex justify-between text-xs text-muted"><span>{f.s.ciudad}</span><span className="tnum">{money(f.valor, 0)}{local(f.valor, f.s.pais) && <span className="ml-1 text-cian">≈ {local(f.valor, f.s.pais)}</span>}</span></div>
            </button></li>)}</ul></div>)}</div>
        </Card>
      </div>
      <Card titulo="Consolidado por país" accion={<span className="flex items-center gap-1.5 text-xs text-muted"><RefreshCw size={12} />{fx ? `Tipos de cambio reales (${empresa.moneda} base) · ${new Date(fx.fecha).toLocaleDateString('es-EC')} · open.er-api.com` : fxError ? 'Tipos de cambio no disponibles (sin internet)' : 'Cargando tipos de cambio…'}</span>}>
        <Scroll><table className="tabla"><thead><tr><th>País</th><th className="num">Sucursales</th><th className="num">Ciudades</th><th className="num">Unidades</th><th className="num">Inventario ({empresa.moneda})</th><th className="num">En moneda local</th><th className="num">Ventas 30 d</th><th className="num">Participación</th></tr></thead>
          <tbody>{d.porPais.map((p) => { const m = pais(p.pais)?.moneda ?? ''; return <tr key={p.pais}><td>{bandera(p.pais)} {pais(p.pais)?.nombre ?? p.pais}</td><td className="num">{p.sucursales}</td><td className="num">{p.ciudades}</td><td className="num">{num(p.unidades, 0)}</td><td className="num font-semibold">{money(p.valor, 0)}</td>
            <td className="num text-cian">{local(p.valor, p.pais) ?? (m === empresa.moneda ? '—' : '…')}</td><td className="num">{money(p.ventas, 0)}</td><td className="num">{pct(d.total ? p.valor / d.total : 0, 1)}</td></tr> })}</tbody></table></Scroll>
        {fx && <p className="mt-3 text-xs text-muted">Tasas usadas: {[...new Set(sucursales.map((s) => pais(s.pais)?.moneda).filter((m): m is string => !!m && m !== empresa.moneda))].map((m) => `1 ${empresa.moneda} = ${nf(fx.tasas[m] ?? NaN, 4)} ${m}`).join(' · ') || 'todas las sucursales usan la moneda de la empresa'}</p>}
      </Card>
    </div>
  )
}
