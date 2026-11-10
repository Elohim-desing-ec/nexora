import { useMemo } from 'react'
import { AlertTriangle, Boxes, DollarSign, PiggyBank, RefreshCw, ShieldCheck, TrendingDown, Sparkles } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../store/useApp'
import { useEcon } from '../store/useEcon'
import { Badge, Card, Kpi, Titulo } from '../components/ui'
import { COLORES, Degradados, Grafico, TooltipVidrio, ejes, rejilla } from '../components/charts'
import { money, num, pct, fechaHora, plural } from '../lib/format'
import { enQuiebre, stockTotal, valorInventario, ventasMensuales, ventasRecientes } from '../lib/inventario'
import { anomalias } from '../lib/ai'
import * as F from '../lib/finance'

export default function Dashboard() {
  const { productos, movimientos, sucursal, auditoria, empresa, sucursales: SUCURSALES, proveedores, usuario, ir } = useApp()
  const p = useEcon((s) => s.p)
  const d = useMemo(() => {
    const valor = productos.reduce((s, x) => s + stockTotal(x, sucursal) * x.costo, 0)
    const hace30 = Date.now() - 30 * 86400000
    const cmv = movimientos.filter((m) => m.tipo === 'Venta' && new Date(m.fecha).getTime() > hace30 && (sucursal === 'TODAS' || m.sucursal === sucursal)).reduce((s, m) => s - m.cantidad * m.costoUnit, 0)
    const quiebres = productos.filter((x) => enQuiebre(x, sucursal))
    // Exactitud = 1 − (unidades corregidas por ajustes y mermas / unidades movidas)
    const movidas = movimientos.reduce((a, m) => a + Math.abs(m.cantidad), 0)
    const corregidas = movimientos.filter((m) => m.tipo === 'Ajuste' || m.tipo === 'Merma').reduce((a, m) => a + Math.abs(m.cantidad), 0)
    const exactitud = movidas ? 1 - corregidas / movidas : 1
    // Las 6 sucursales con más ventas se grafican por separado; el resto se agrupa en "Otras"
    const v30 = ventasRecientes(movimientos, productos, 180)
    const top = [...SUCURSALES].sort((a, b) => (v30[b.id] ?? 0) - (v30[a.id] ?? 0) || valorInventario(productos, b.id) - valorInventario(productos, a.id))
    const series = top.slice(0, 6), resto = top.slice(6).map((s) => s.id)
    const meses = ventasMensuales(movimientos, productos, SUCURSALES.map((s) => s.id)).map((m) => ({ ...m, OTRAS: resto.reduce((a, id) => a + (m[id] ?? 0), 0) }) as unknown as { mes: string } & Record<string, number>)
    const stockSuc = top.slice(0, 8).map((s) => ({ sucursal: s.id, stock: valorInventario(productos, s.id), ventas: meses.length ? meses.reduce((a, m) => a + (m[s.id] ?? 0), 0) / meses.length : 0 }))
    return { valor, rotacion: (cmv * 12) / Math.max(1, valor), quiebres, exactitud, meses, stockSuc, series, hayResto: resto.length > 0, anom: anomalias(movimientos).slice(0, 5) }
  }, [productos, movimientos, sucursal, SUCURSALES])
  const ahorro = F.ahorroAnual(p)
  const perdidasEvitadas = p.conceptos[1].actual - p.conceptos[1].nuevo
  return (
    <div className="space-y-5">
      <Titulo titulo="Dashboard ejecutivo" sub={`${empresa.nombre} · ${sucursal === 'TODAS' ? `Consolidado · ${plural(SUCURSALES.length, 'sucursal', 'sucursales')} en ${plural(new Set(SUCURSALES.map((s) => s.pais)).size, 'país', 'países')}` : SUCURSALES.find((s) => s.id === sucursal)?.nombre}`}><Badge tono="verde"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-exito" />En vivo</Badge></Titulo>
      {!productos.length && <Card className="border-primario/30" titulo="Primeros pasos con sus datos reales">
        <div className="grid gap-3 md:grid-cols-4">{([
          ['1', 'Datos de la empresa', 'Razón social, RUC y sucursales', 'configuracion', usuario?.rol === 'Gerente General'],
          ['2', 'Proveedores', `${proveedores.length} registrados`, 'compras', true],
          ['3', 'Productos', 'Uno por uno o con plantilla Excel', 'productos', true],
          ['4', 'Análisis económico', 'Costos actuales vs NEXORA', 'economico', true],
        ] as const).map(([n, t, d, pag, ok]) => <button key={n} disabled={!ok} onClick={() => ir(pag)} className="flex gap-3 rounded-xl bg-fg/5 p-3 text-left transition hover:bg-primario/15 disabled:opacity-40"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primario to-violeta text-sm font-bold text-black">{n}</span><span><span className="block text-sm font-semibold">{t}</span><span className="text-xs text-muted">{d}</span></span></button>)}</div>
        <p className="mt-3 text-xs text-muted">Los indicadores y gráficos se llenan automáticamente a medida que registre productos, ventas y compras. ¿Dudas? Pregúntele al asistente (botón ✦ abajo a la derecha).</p>
      </Card>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi titulo="Valor del inventario" valor={d.valor} formato={(v) => money(v, 0)} icono={<DollarSign size={15} />} />
        <Kpi titulo="Rotación anual" valor={d.rotacion} formato={(v) => `${num(v, 1)}×`} icono={<RefreshCw size={15} />} tono="cian" sub="Costo de ventas / inventario" />
        <Kpi titulo="Productos en quiebre" valor={d.quiebres.length} formato={(v) => num(v, 0)} icono={<AlertTriangle size={15} />} tono="rojo" sub="Stock < 1/3 del mínimo" />
        <Kpi titulo="Exactitud de inventario" valor={d.exactitud * 100} formato={(v) => `${num(v, 1)} %`} icono={<ShieldCheck size={15} />} tono="verde" />
        <Kpi titulo="Pérdidas evitadas / año" valor={perdidasEvitadas} formato={(v) => money(v, 0)} icono={<TrendingDown size={15} />} tono="ambar" sub="Errores y devoluciones" />
        <Kpi titulo="Ahorro del software / año" valor={ahorro} formato={(v) => money(v, 0)} icono={<PiggyBank size={15} />} tono="violeta" sub={`${pct(ahorro / F.totalActual(p), 0)} menos costos`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card titulo="Ventas mensuales por sucursal" className="xl:col-span-2">
          <Grafico><AreaChart data={d.meses}><Degradados /><CartesianGrid {...rejilla} /><XAxis dataKey="mes" {...ejes} /><YAxis {...ejes} tickFormatter={(v) => `${num(v / 1000, 0)}k`} /><Tooltip content={<TooltipVidrio />} /><Legend />
            {d.series.map((x, k) => <Area key={x.id} type="monotone" dataKey={x.id} name={`${x.id} · ${x.ciudad}`} stroke={COLORES[k % COLORES.length]} fill={`url(#g${k % 6})`} strokeWidth={2} />)}{d.hayResto && <Area type="monotone" dataKey="OTRAS" name="Otras" stroke="#A8A29E" fill="none" strokeDasharray="4 4" strokeWidth={2} />}</AreaChart></Grafico>
        </Card>
        <Card titulo="Ventas vs stock por sucursal">
          <Grafico><BarChart data={d.stockSuc}><Degradados /><CartesianGrid {...rejilla} /><XAxis dataKey="sucursal" {...ejes} /><YAxis {...ejes} tickFormatter={(v) => `${num(v / 1000, 0)}k`} /><Tooltip content={<TooltipVidrio />} cursor={{ fill: 'rgb(var(--fg) / .05)' }} /><Legend />
            <Bar dataKey="ventas" name="Ventas / mes" fill="url(#g0)" radius={[6, 6, 0, 0]} /><Bar dataKey="stock" name="Stock valorizado" fill="url(#g3)" radius={[6, 6, 0, 0]} /></BarChart></Grafico>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card titulo={<span className="flex items-center gap-2"><AlertTriangle size={15} className="text-peligro" />Quiebres de stock</span>}>
          <ul className="space-y-2 text-sm">{d.quiebres.slice(0, 6).map((x) => <li key={x.id} className="flex items-center justify-between gap-2 rounded-lg bg-fg/5 px-3 py-2"><span className="truncate">{x.nombre}</span><Badge tono="rojo">{stockTotal(x, sucursal)} u</Badge></li>)}{!d.quiebres.length && <li className="text-muted">Sin quiebres 🎉</li>}</ul>
        </Card>
        <Card titulo={<span className="flex items-center gap-2"><Sparkles size={15} className="text-cian" />Anomalías detectadas por IA</span>}>
          <ul className="space-y-2 text-sm">{d.anom.map(({ m, z }) => <li key={m.id} className="rounded-lg bg-fg/5 px-3 py-2"><div className="flex justify-between gap-2"><span className="truncate">{productos.find((x) => x.id === m.productoId)?.nombre}</span><Badge tono={m.tipo === 'Merma' ? 'ambar' : 'violeta'}>{m.tipo}</Badge></div><div className="text-xs text-muted">{Math.abs(m.cantidad)} u · {m.sucursal} · z = {num(z, 1)}</div></li>)}</ul>
        </Card>
        <Card titulo={<span className="flex items-center gap-2"><Boxes size={15} className="text-primario" />Actividad reciente</span>}>
          <ul className="space-y-2 text-sm">{auditoria.slice(-6).reverse().map((e) => <li key={e.id} className="border-l-2 border-primario/50 pl-3"><div className="font-medium">{e.accion}</div><div className="truncate text-xs text-muted">{e.detalle} · {fechaHora(e.fecha)}</div></li>)}</ul>
        </Card>
      </div>
    </div>
  )
}
