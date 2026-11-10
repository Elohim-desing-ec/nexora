import { useMemo } from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, FileSpreadsheet, FileText, Lightbulb, Sparkles } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useEcon } from '../store/useEcon'
import { Button, Card, Titulo, cx } from '../components/ui'
import { exportarAnalisisExcel, exportarAnalisisPDF, exportarReporteEjecutivo, exportarTabla } from '../lib/export'
import { analizarNegocio, type Nivel } from '../lib/reporteInteligente'
import { money, fecha, fechaHora } from '../lib/format'
import { stockTotal } from '../lib/inventario'
import { totalOC } from './Compras'

export default function Reportes() {
  const { productos, movimientos, ordenes, auditoria, proveedores: PROVEEDORES, sucursales } = useApp()
  const p = useEcon((s) => s.p)
  const { sucursales: sucs, proveedores, empresa } = useApp()
  const a = useMemo(() => analizarNegocio({ productos, movimientos, ordenes, sucursales: sucs, proveedores, p, empresa: empresa.nombre }), [productos, movimientos, ordenes, sucs, proveedores, p, empresa.nombre])
  const estilo: Record<Nivel, [string, JSX.Element]> = { critico: ['border-peligro/40 bg-peligro/10', <AlertOctagon key="c" size={16} className="text-peligro" />], alerta: ['border-alerta/40 bg-alerta/10', <AlertTriangle key="a" size={16} className="text-alerta" />], oportunidad: ['border-cian/40 bg-cian/10', <Lightbulb key="o" size={16} className="text-cian" />], ok: ['border-exito/40 bg-exito/10', <CheckCircle2 key="k" size={16} className="text-exito" />] }
  const reportes = [
    { t: 'Inventario valorizado', d: 'Stock por sucursal, costo, precio, lote y vencimiento', f: (x: 'xlsx' | 'pdf') => exportarTabla('Inventario', ['SKU', 'Producto', 'Categoría', ...sucursales.map((x) => x.id), 'Total', 'Valor'], productos.map((q) => [q.sku, q.nombre, q.categoria, ...sucursales.map((x) => q.stock[x.id] ?? 0), stockTotal(q), money(stockTotal(q) * q.costo)]), x) },
    { t: 'Kardex general', d: 'Últimos 1.000 movimientos de inventario', f: (x: 'xlsx' | 'pdf') => exportarTabla('Kardex', ['Fecha', 'Producto', 'Sucursal', 'Tipo', 'Cantidad', 'Costo unit.', 'Usuario'], movimientos.slice(-1000).map((m) => [fechaHora(m.fecha), productos.find((q) => q.id === m.productoId)?.nombre ?? '', m.sucursal, m.tipo, m.cantidad, money(m.costoUnit), m.usuario]), x) },
    { t: 'Órdenes de compra', d: 'Estado, proveedor y montos', f: (x: 'xlsx' | 'pdf') => exportarTabla('Compras', ['N.°', 'Fecha', 'Proveedor', 'Sucursal', 'Estado', 'Total'], ordenes.map((o) => [o.id, fecha(o.fecha), PROVEEDORES.find((q) => q.id === o.proveedorId)?.nombre ?? '', o.sucursal, o.estado, money(totalOC(o))]), x) },
    { t: 'Bitácora de auditoría', d: 'Eventos con usuario, fecha y sucursal', f: (x: 'xlsx' | 'pdf') => exportarTabla('Auditoria', ['Fecha', 'Usuario', 'Acción', 'Detalle', 'Sucursal'], auditoria.map((e) => [fechaHora(e.fecha), e.usuario, e.accion, e.detalle, e.sucursal]), x) },
  ]
  return (
    <div className="space-y-5">
      <Titulo titulo="Reportes" sub="Reportes inteligentes y exportación a Excel y PDF con membrete corporativo"></Titulo>
      <Card className="border-violeta/30" titulo={<span className="flex items-center gap-2"><Sparkles size={16} className="text-violeta" />Reporte ejecutivo inteligente</span>} accion={<Button variante="primario" onClick={() => exportarReporteEjecutivo(a)}><FileText size={15} />Descargar PDF</Button>}>
        <p className="text-sm leading-relaxed">{a.resumen}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">{a.kpis.map(([k, v]) => <div key={k} className="rounded-xl bg-fg/5 p-3"><div className="text-[11px] text-muted">{k}</div><div className="font-bold tnum">{v}</div></div>)}</div>
        <div className="mt-4 grid gap-2 lg:grid-cols-2">{a.hallazgos.map((h, k) => <div key={k} className={cx('rounded-xl border p-3', estilo[h.nivel][0])}>
          <div className="flex items-start gap-2 text-sm font-semibold">{estilo[h.nivel][1]}{h.titulo}</div>
          <p className="mt-1 text-xs text-muted">{h.detalle}</p><p className="mt-1 text-xs"><b>Acción:</b> {h.accion}</p></div>)}</div>
      </Card>
      <Card className="border-primario/30" titulo="Análisis económico completo">
        <p className="mb-3 text-sm text-muted">Excel con una hoja por pestaña y FÓRMULAS reales (CAUE, factores, depreciación, FEDI, VPN/TIR con NPV e IRR) enlazadas a la hoja Parametros. PDF con resumen ejecutivo y tablas.</p>
        <div className="flex gap-2"><Button variante="primario" onClick={() => exportarAnalisisExcel(p)}><FileSpreadsheet size={15} />Excel con fórmulas</Button><Button onClick={() => exportarAnalisisPDF(p)}><FileText size={15} />PDF</Button></div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">{reportes.map((r) => <Card key={r.t} hover titulo={r.t}><p className="mb-3 text-sm text-muted">{r.d}</p><div className="flex gap-2"><Button onClick={() => r.f('xlsx')}><FileSpreadsheet size={15} />Excel</Button><Button onClick={() => r.f('pdf')}><FileText size={15} />PDF</Button></div></Card>)}</div>
    </div>
  )
}
