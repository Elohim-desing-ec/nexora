import { useMemo, useState } from 'react'
import { Bot, Brain, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react'
import { ComposedChart, Line, Area, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../store/useApp'
import { useEcon } from '../store/useEcon'
import { Badge, Button, Card, Scroll, Titulo } from '../components/ui'
import { Degradados, Grafico, TooltipVidrio, ejes, rejilla } from '../components/charts'
import { anomalias, reorden } from '../lib/ai'
import { money, num, pct, fechaHora } from '../lib/format'
import { enQuiebre, stockTotal } from '../lib/inventario'
import * as F from '../lib/finance'

export default function IA() {
  const { productos, movimientos, crearOrden, usuario, proveedores, sucursales, sucursal } = useApp()
  const p = useEcon((s) => s.p)
  const [sel, setSel] = useState(productos[0]?.id)
  const prod = productos.find((x) => x.id === sel) ?? productos[0]
  const r = useMemo(() => (prod ? reorden(prod, movimientos) : null), [prod, movimientos])
  const sugerencias = useMemo(() => productos.map((x) => ({ x, r: reorden(x, movimientos) })).filter((s) => s.r.sugerido > 0).sort((a, b) => a.r.cobertura - b.r.cobertura), [productos, movimientos])
  const anom = useMemo(() => anomalias(movimientos).slice(0, 12), [movimientos])
  if (!prod || !r) return <div className="space-y-5"><Titulo titulo="Inteligencia NEXORA" /><Card><p className="py-10 text-center text-sm text-muted">La IA necesita productos y ventas registradas para pronosticar. Agregue datos en Inventario o en Configuración → Mis datos.</p></Card></div>
  const serie = [...r.serie.map((v, k) => ({ sem: `S${k + 1}`, real: v, pm: Number.isFinite(r.f.pm[k]) ? r.f.pm[k] : undefined, tendencia: r.f.a + r.f.b * k })),
    ...r.f.futuro.map((v, h) => ({ sem: `+${h + 1}`, pronostico: v, tendencia: r.f.a + r.f.b * (r.serie.length + h) }))]
  const R = F.reemplazo(p), K = F.indicadores(p)
  const valor = productos.reduce((s, x) => s + stockTotal(x) * x.costo, 0)
  const resumen = `Buenos días, ${usuario?.nombre.split(' ')[0]}. El inventario consolidado vale ${money(valor, 0)} en ${productos.length} productos. Hay ${productos.filter((x) => enQuiebre(x)).length} productos en quiebre y ${sugerencias.length} con sugerencia de compra por llegar a su punto de reorden. La IA detectó ${anom.length} movimientos atípicos (mermas o ventas fuera de lo normal) que conviene revisar. En lo económico, NEXORA ahorra ${money(K.A, 0)} al año (VPN ${money(K.VPN, 0)}, TIR ${pct(K.TIR, 1)}) y el veredicto del análisis de reemplazo es: ${R.veredicto}.`
  const generarOC = () => {
    if (!proveedores.length) return alert('Primero registre al menos un proveedor en Compras.')
    const porProv = new Map<string, typeof sugerencias>()
    const provDe = (id: string) => (proveedores.some((p) => p.id === id) ? id : proveedores[0].id)
    sugerencias.slice(0, 15).forEach((s) => porProv.set(provDe(s.x.proveedorId), [...(porProv.get(provDe(s.x.proveedorId)) ?? []), s]))
    porProv.forEach((ss, prov) => crearOrden({ proveedorId: prov, sucursal: sucursal === 'TODAS' ? sucursales[0]?.id ?? '' : sucursal, items: ss.map((s) => ({ productoId: s.x.id, cantidad: s.r.sugerido, costo: s.x.costo })) }))
    alert(`Se crearon ${porProv.size} órdenes en borrador (ver Compras).`)
  }
  return (
    <div className="space-y-5">
      <Titulo titulo="Inteligencia NEXORA" sub="Pronóstico de demanda, reorden automático y detección de anomalías (modelos estadísticos ejecutados en el navegador)" />
      <Card className="relative overflow-hidden"><div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violeta/30 blur-3xl" />
        <div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primario to-violeta text-black"><Bot size={22} /></div>
          <div><div className="mb-1 flex items-center gap-2 text-sm font-semibold">Asistente NEXORA <Badge tono="violeta"><Sparkles size={10} />IA</Badge></div><p className="text-sm leading-relaxed text-fg/90">{resumen}</p></div></div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" titulo={<span className="flex items-center gap-2"><TrendingUp size={15} className="text-cian" />Pronóstico de demanda a 30 días</span>} accion={<select className="inp !w-auto" value={sel} onChange={(e) => setSel(e.target.value)}>{productos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>}>
          <Grafico><ComposedChart data={serie}><Degradados /><CartesianGrid {...rejilla} /><XAxis dataKey="sem" {...ejes} interval={2} /><YAxis {...ejes} /><Tooltip content={<TooltipVidrio fmt={(v) => `${num(v, 1)} u`} />} /><Legend />
            <Area dataKey="real" name="Ventas reales" stroke="#D4AF37" fill="url(#g0)" strokeWidth={2} /><Line dataKey="pm" name="Promedio móvil (4)" stroke="#FB923C" dot={false} strokeWidth={2} /><Line dataKey="tendencia" name="Regresión lineal" stroke="#A8A29E" strokeDasharray="4 4" dot={false} /><Area dataKey="pronostico" name="Pronóstico" stroke="#F3D58A" fill="url(#g2)" strokeWidth={2.5} /></ComposedChart></Grafico>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">{[['Demanda 30 días', `${num(r.f.dias30, 0)} u`], ['Tendencia semanal', pct(r.f.tendencia, 1)], ['Stock de seguridad', `${num(r.ss, 0)} u`], ['Punto de reorden', `${r.rop} u`], ['Cobertura', `${num(r.cobertura, 0)} días`]].map(([a, b]) => <div key={a} className="rounded-lg bg-fg/5 p-2"><div className="text-muted">{a}</div><div className="text-sm font-semibold tnum">{b}</div></div>)}</div>
          <p className="mt-2 text-[11px] text-muted">Modelo: y = a + b·t (mínimos cuadrados) × índice estacional de 4 semanas. ROP = demanda diaria × 7 días + 1,65·σ·√L.</p>
        </Card>
        <Card titulo={<span className="flex items-center gap-2"><Brain size={15} className="text-violeta" />Anomalías (z-score &gt; 2,5)</span>}>
          <ul className="max-h-[420px] space-y-2 overflow-y-auto text-sm">{anom.map(({ m, z }) => <li key={m.id} className="rounded-lg bg-fg/5 px-3 py-2"><div className="flex justify-between gap-2"><span className="truncate font-medium">{productos.find((x) => x.id === m.productoId)?.nombre}</span><Badge tono={m.tipo === 'Merma' ? 'ambar' : 'rojo'}>{m.tipo}</Badge></div><div className="text-xs text-muted">{Math.abs(m.cantidad)} u · {m.sucursal} · {fechaHora(m.fecha)} · z = {num(z, 2)}</div></li>)}</ul>
        </Card>
      </div>
      <Card titulo={<span className="flex items-center gap-2"><ShoppingCart size={15} />Sugerencias automáticas de compra ({sugerencias.length})</span>} accion={<Button variante="primario" disabled={!sugerencias.length} onClick={generarOC}>Generar órdenes en borrador</Button>}>
        <Scroll><table className="tabla"><thead><tr><th>Producto</th><th className="num">Stock</th><th className="num">ROP</th><th className="num">Demanda 30 d</th><th className="num">Cobertura</th><th className="num">Sugerido</th><th className="num">Costo estimado</th></tr></thead>
          <tbody>{sugerencias.slice(0, 15).map(({ x, r }) => <tr key={x.id}><td>{x.nombre}</td><td className="num">{r.stock}</td><td className="num">{r.rop}</td><td className="num">{num(r.f.dias30, 0)}</td><td className="num"><Badge tono={r.cobertura < 7 ? 'rojo' : 'ambar'}>{num(r.cobertura, 0)} d</Badge></td><td className="num font-semibold">{r.sugerido}</td><td className="num">{money(r.sugerido * x.costo)}</td></tr>)}</tbody></table></Scroll>
      </Card>
    </div>
  )
}
