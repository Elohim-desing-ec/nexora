import { lazy, Suspense, useMemo, useState } from 'react'
import { useApp } from '../store/useApp'
import { Badge, Card, Scroll, Titulo } from '../components/ui'
import { fechaHora, money } from '../lib/format'
import { stockTotal, valorInventario } from '../lib/inventario'
import { bandera } from '../data/paises'

const Globo = lazy(() => import('../components/Globo'))

export default function Auditoria() {
  const { auditoria, movimientos, productos, sucursales: SUCURSALES } = useApp()
  const [q, setQ] = useState(''), [vista, setVista] = useState<'eventos' | 'movimientos'>('eventos')
  const ev = useMemo(() => auditoria.slice().reverse().filter((e) => `${e.usuario} ${e.accion} ${e.detalle} ${e.sucursal}`.toLowerCase().includes(q.toLowerCase())).slice(0, 300), [auditoria, q])
  const mv = useMemo(() => movimientos.slice(-400).reverse().filter((m) => `${m.usuario} ${m.tipo} ${m.sucursal} ${productos.find((p) => p.id === m.productoId)?.nombre}`.toLowerCase().includes(q.toLowerCase())).slice(0, 300), [movimientos, productos, q])
  return (
    <div className="space-y-5">
      <Titulo titulo="Trazabilidad y auditoría" sub="Quién hizo qué, cuándo y dónde — registro inmutable de cada acción" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" titulo="Bitácora" accion={<div className="flex w-full flex-wrap gap-2 sm:w-auto"><select className="inp !w-auto" value={vista} onChange={(e) => setVista(e.target.value as 'eventos')}><option value="eventos">Eventos del sistema</option><option value="movimientos">Movimientos de inventario</option></select><input className="inp min-w-0 flex-1 sm:!w-56 sm:flex-none" placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} /></div>}>
          <div className="max-h-[520px] overflow-auto"><Scroll><table className="tabla">
            {vista === 'eventos' ? <><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th><th>Sucursal</th></tr></thead>
              <tbody>{ev.map((e) => <tr key={e.id}><td>{fechaHora(e.fecha)}</td><td>{e.usuario}</td><td><Badge tono="azul">{e.accion}</Badge></td><td className="max-w-xs truncate">{e.detalle}</td><td>{e.sucursal}</td></tr>)}</tbody></>
              : <><thead><tr><th>Fecha</th><th>Usuario</th><th>Tipo</th><th>Producto</th><th>Sucursal</th><th className="num">Cant.</th></tr></thead>
                <tbody>{mv.map((m) => <tr key={m.id}><td>{fechaHora(m.fecha)}</td><td>{m.usuario}</td><td><Badge tono={m.cantidad > 0 ? 'verde' : m.tipo === 'Merma' ? 'ambar' : 'gris'}>{m.tipo}</Badge></td><td>{productos.find((p) => p.id === m.productoId)?.nombre}</td><td>{m.sucursal}</td><td className={`num ${m.cantidad > 0 ? 'text-exito' : 'text-peligro'}`}>{m.cantidad}</td></tr>)}</tbody></>}
          </table></Scroll></div>
        </Card>
        <Card titulo="Mapa global de sucursales">
          <Suspense fallback={<div className="espacio h-[420px] rounded-xl" />}>
            <Globo className="h-[420px]" puntos={SUCURSALES.map((s) => ({ id: s.id, nombre: `${bandera(s.pais)} ${s.nombre}`, lat: s.lat, lng: s.lng, valor: valorInventario(productos, s.id) + 1, detalle: `${s.direccion || s.ciudad}\nInventario: ${money(valorInventario(productos, s.id), 0)}` }))} />
          </Suspense>
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs">{SUCURSALES.map((s) => <li key={s.id} className="flex justify-between gap-2"><span className="truncate">{bandera(s.pais)} {s.nombre}</span><span className="tnum text-muted">{productos.reduce((a, p) => a + stockTotal(p, s.id), 0)} u</span></li>)}<li className="flex justify-between font-semibold"><span>Total</span><span className="tnum">{productos.reduce((a, p) => a + stockTotal(p), 0)} u</span></li></ul>
        </Card>
      </div>
    </div>
  )
}
