import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, Barcode, FileSpreadsheet, History, Pencil, Plus, Printer, Search, Trash2, PackageMinus } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import { useApp } from '../store/useApp'
import { Badge, Button, Campo, Card, Modal, NumInput, Scroll, Titulo } from '../components/ui'
import { money, fecha, fechaHora, num } from '../lib/format'
import { enQuiebre, kardex, stockTotal } from '../lib/inventario'
import { CATEGORIAS, type Producto, type Sucursal, type SucursalId } from '../data/base'
import type { TipoOperacion } from '../store/useApp'
import { exportarTabla } from '../lib/export'

const vacio = (sucs: Sucursal[]): Producto => ({ id: `P${Date.now()}`, sku: '', nombre: '', categoria: CATEGORIAS[0], costo: 0, precio: 0, stock: Object.fromEntries(sucs.map((x) => [x.id, 0])), min: 10, max: 100, lote: '', vence: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10), proveedorId: '' })

function CodigoBarras({ valor }: { valor: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => { if (ref.current) JsBarcode(ref.current, valor || '0000', { format: 'CODE128', height: 50, fontSize: 12, background: '#ffffff', lineColor: '#0A0907' }) }, [valor])
  return <svg ref={ref} />
}

export default function Productos() {
  const { productos, movimientos, usuario, sucursal, guardarProducto, eliminarProducto, transferir, registrar, proveedores, sucursales: SUCURSALES } = useApp()
  const soloLectura = usuario?.rol === 'Auditor'
  const [q, setQ] = useState(''), [cat, setCat] = useState('Todas')
  const [edit, setEdit] = useState<Producto | null>(null)
  const [codigo, setCodigo] = useState<Producto | null>(null)
  const [trans, setTrans] = useState<{ p: Producto; de: SucursalId; a: SucursalId; cant: number; err?: string } | null>(null)
  const [aj, setAj] = useState<{ p: Producto; s: SucursalId; cant: number; tipo: TipoOperacion; nota: string; costo: number; err?: string } | null>(null)
  const [kx, setKx] = useState<{ p: Producto; s: SucursalId | 'TODAS' } | null>(null)
  useEffect(() => { const id = sessionStorage.getItem('nx-p'); if (id) { sessionStorage.removeItem('nx-p'); const p = productos.find((x) => x.id === id); if (p) setKx({ p, s: 'TODAS' }) } }, [productos])

  const suc0 = sucursal === 'TODAS' ? SUCURSALES[0]?.id ?? '' : sucursal
  // Hasta 5 sucursales: una columna por sucursal. Con más: solo la sucursal elegida arriba (o el total).
  const cols = SUCURSALES.length <= 5 ? SUCURSALES.map((x) => x.id) : sucursal !== 'TODAS' ? [sucursal] : []
  const [pag, setPag] = useState(0), POR_PAG = 50
  const categorias = useMemo(() => [...new Set([...CATEGORIAS, ...productos.map((p) => p.categoria)])], [productos])
  const lista = useMemo(() => productos.filter((p) => (cat === 'Todas' || p.categoria === cat) && `${p.sku} ${p.nombre} ${p.lote}`.toLowerCase().includes(q.toLowerCase())), [productos, q, cat])
  const filasK = kx ? kardex(kx.p.id, movimientos, kx.s) : []
  const exportar = (f: 'xlsx' | 'pdf') => exportarTabla('Inventario', ['SKU', 'Producto', 'Categoría', 'Costo', 'Precio', ...SUCURSALES.map((x) => x.id), 'Total', 'Valor', 'Lote', 'Vence'], lista.map((p) => [p.sku, p.nombre, p.categoria, money(p.costo), money(p.precio), ...SUCURSALES.map((x) => p.stock[x.id] ?? 0), stockTotal(p), money(stockTotal(p) * p.costo), p.lote, p.vence]), f)
  const set = (k: keyof Producto, v: unknown) => edit && setEdit({ ...edit, [k]: v })

  return (
    <div className="space-y-5">
      <Titulo titulo="Productos e inventario" sub={`${productos.length} productos · ${new Set(productos.map((p) => p.categoria)).size} categorías · ${SUCURSALES.length} sucursales${cols.length < SUCURSALES.length ? ' (elija una sucursal arriba para ver su columna)' : ''}`}>
        <Button onClick={() => exportar('xlsx')}><FileSpreadsheet size={15} />Excel</Button><Button onClick={() => exportar('pdf')}><Printer size={15} />PDF</Button>
        {!soloLectura && productos.length > 0 && <Button onClick={() => setAj({ p: productos[0], s: suc0, cant: 1, tipo: 'Venta', nota: '', costo: productos[0].costo })}><PackageMinus size={15} />Registrar movimiento</Button>}
        {!soloLectura && <Button variante="primario" disabled={!SUCURSALES.length} title={SUCURSALES.length ? '' : 'Primero registre una sucursal en Configuración'} onClick={() => setEdit(vacio(SUCURSALES))}><Plus size={15} />Nuevo producto</Button>}
      </Titulo>
      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="inp pl-9" placeholder="Buscar por SKU, nombre o lote…" value={q} onChange={(e) => { setQ(e.target.value); setPag(0) }} /></div>
          <select className="inp !w-auto" value={cat} onChange={(e) => { setCat(e.target.value); setPag(0) }}><option>Todas</option>{categorias.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <Scroll><table className="tabla">
          <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th className="num">Costo</th><th className="num">Precio</th>{cols.map((s) => <th key={s} className="num">{s}</th>)}<th className="num">Total</th><th>Vence</th><th>Estado</th><th></th></tr></thead>
          <tbody>{lista.slice(pag * POR_PAG, (pag + 1) * POR_PAG).map((p) => {
            const t = stockTotal(p), vence = (new Date(p.vence).getTime() - Date.now()) / 864e5
            return <tr key={p.id}>
              <td className="font-mono text-xs text-muted">{p.sku}</td><td className="font-medium">{p.nombre}</td><td className="text-muted">{p.categoria}</td>
              <td className="num">{money(p.costo)}</td><td className="num">{money(p.precio)}</td>
              {cols.map((s) => <td key={s} className={`num ${(p.stock[s] ?? 0) < p.min / 3 ? 'text-peligro font-semibold' : ''}`}>{p.stock[s] ?? 0}</td>)}
              <td className="num font-semibold">{t}</td><td className={vence < 60 ? 'text-alerta' : 'text-muted'}>{fecha(p.vence)}</td>
              <td>{enQuiebre(p, sucursal) ? <Badge tono="rojo">Quiebre</Badge> : t > p.max * 3 ? <Badge tono="ambar">Sobrestock</Badge> : <Badge tono="verde">OK</Badge>}</td>
              <td><div className="flex gap-0.5">
                <Button variante="fantasma" className="!p-1.5" title="Kardex" onClick={() => setKx({ p, s: 'TODAS' })}><History size={15} /></Button>
                <Button variante="fantasma" className="!p-1.5" title="Código de barras / QR" onClick={() => setCodigo(p)}><Barcode size={15} /></Button>
                {!soloLectura && <>
                  <Button variante="fantasma" className="!p-1.5" title="Transferir" onClick={() => setTrans({ p, de: SUCURSALES[0]?.id ?? '', a: SUCURSALES[1]?.id ?? SUCURSALES[0]?.id ?? '', cant: 1 })}><ArrowLeftRight size={15} /></Button>
                  <Button variante="fantasma" className="!p-1.5" title="Registrar venta, compra, ajuste o merma" onClick={() => setAj({ p, s: suc0, cant: 1, tipo: 'Venta', nota: '', costo: p.costo })}><PackageMinus size={15} /></Button>
                  <Button variante="fantasma" className="!p-1.5" title="Editar" onClick={() => setEdit(structuredClone(p))}><Pencil size={15} /></Button>
                  <Button variante="fantasma" className="!p-1.5 text-peligro" title="Eliminar" onClick={() => confirm(`¿Eliminar ${p.nombre}?`) && eliminarProducto(p.id)}><Trash2 size={15} /></Button>
                </>}
              </div></td>
            </tr>
          })}</tbody>
        </table></Scroll>
        {lista.length > POR_PAG && <div className="mt-3 flex items-center justify-between text-xs text-muted"><span>{pag * POR_PAG + 1}–{Math.min(lista.length, (pag + 1) * POR_PAG)} de {lista.length} productos</span><div className="flex gap-1"><Button className="!py-1" disabled={pag === 0} onClick={() => setPag(pag - 1)}>Anterior</Button><Button className="!py-1" disabled={(pag + 1) * POR_PAG >= lista.length} onClick={() => setPag(pag + 1)}>Siguiente</Button></div></div>}
        {!lista.length && <p className="py-10 text-center text-sm text-muted">{productos.length ? 'Ningún producto coincide con la búsqueda.' : 'Aún no hay productos. Pulse "Nuevo producto" o importe un Excel en Configuración → Mis datos.'}</p>}
      </Card>

      <Modal abierto={!!edit} onClose={() => setEdit(null)} titulo={productos.some((x) => x.id === edit?.id) ? 'Editar producto' : 'Nuevo producto'}>
        {edit && <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!edit.sku || !edit.nombre) return alert('SKU y nombre son obligatorios'); if (edit.min > edit.max) return alert('El mínimo no puede superar al máximo'); guardarProducto(edit); setEdit(null) }}>
          <Campo label="SKU"><input className="inp" value={edit.sku} onChange={(e) => set('sku', e.target.value)} /></Campo>
          <Campo label="Nombre"><input className="inp" value={edit.nombre} onChange={(e) => set('nombre', e.target.value)} /></Campo>
          <Campo label="Categoría" ayuda="Elija una o escriba una nueva"><input className="inp" list="cats" value={edit.categoria} onChange={(e) => set('categoria', e.target.value)} /><datalist id="cats">{categorias.map((c) => <option key={c} value={c} />)}</datalist></Campo>
          <Campo label="Proveedor"><select className="inp" value={edit.proveedorId} onChange={(e) => set('proveedorId', e.target.value)}><option value="">— Sin proveedor —</option>{proveedores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Campo>
          <Campo label="Costo ($)"><NumInput step={0.01} value={edit.costo} onChange={(v) => set('costo', v)} /></Campo>
          <Campo label="Precio ($)"><NumInput step={0.01} value={edit.precio} onChange={(v) => set('precio', v)} /></Campo>
          <div className="sm:col-span-2"><div className="mb-1 text-xs font-medium text-muted">Stock actual por sucursal ({SUCURSALES.length})</div>
            <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto rounded-xl bg-fg/5 p-2 sm:grid-cols-3">{SUCURSALES.map((x) => <Campo key={x.id} label={`${x.id} · ${x.ciudad}`}><NumInput value={edit.stock[x.id] ?? 0} onChange={(v) => set('stock', { ...edit.stock, [x.id]: Math.max(0, Math.round(v)) })} /></Campo>)}</div></div>
          <Campo label="Stock mínimo (por sucursal)"><NumInput value={edit.min} onChange={(v) => set('min', v)} /></Campo>
          <Campo label="Stock máximo (por sucursal)"><NumInput value={edit.max} onChange={(v) => set('max', v)} /></Campo>
          <Campo label="Lote"><input className="inp" value={edit.lote} onChange={(e) => set('lote', e.target.value)} /></Campo>
          <Campo label="Fecha de vencimiento"><input type="date" className="inp" value={edit.vence} onChange={(e) => set('vence', e.target.value)} /></Campo>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" onClick={() => setEdit(null)}>Cancelar</Button><Button variante="primario" type="submit">Guardar</Button></div>
        </form>}
      </Modal>

      <Modal abierto={!!codigo} onClose={() => setCodigo(null)} titulo="Etiqueta de producto" ancho="max-w-md">
        {codigo && <div className="space-y-4"><div id="etiqueta" className="flex flex-col items-center gap-3 rounded-xl bg-white p-5 text-slate-900">
          <div className="text-center text-sm font-bold">{codigo.nombre}</div><CodigoBarras valor={codigo.sku} />
          <QRCodeSVG value={JSON.stringify({ sku: codigo.sku, lote: codigo.lote, vence: codigo.vence })} size={110} /><div className="text-xs">Lote {codigo.lote} · Vence {codigo.vence} · {money(codigo.precio)}</div>
        </div><Button variante="primario" className="w-full" onClick={() => { const w = window.open('', '_blank', 'width=400,height=500'); if (w) { w.document.write(`<body style="font-family:sans-serif;display:flex;justify-content:center">${document.getElementById('etiqueta')!.outerHTML}</body>`); w.document.close(); w.print() } }}><Printer size={15} />Imprimir etiqueta</Button></div>}
      </Modal>

      <Modal abierto={!!trans} onClose={() => setTrans(null)} titulo={`Transferir · ${trans?.p.nombre}`} ancho="max-w-md">
        {trans && <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Origen"><select className="inp" value={trans.de} onChange={(e) => setTrans({ ...trans, de: e.target.value as SucursalId })}>{SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.ciudad} ({(trans.p.stock[s.id] ?? 0)})</option>)}</select></Campo>
            <Campo label="Destino"><select className="inp" value={trans.a} onChange={(e) => setTrans({ ...trans, a: e.target.value as SucursalId })}>{SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.ciudad} ({(trans.p.stock[s.id] ?? 0)})</option>)}</select></Campo>
          </div>
          <Campo label="Cantidad"><NumInput min={1} value={trans.cant} onChange={(v) => setTrans({ ...trans, cant: Math.round(v), err: undefined })} /></Campo>
          {trans.err && <p className="text-xs text-peligro">{trans.err}</p>}
          <Button variante="primario" className="w-full" onClick={() => { const e = transferir(trans.p.id, trans.de, trans.a, trans.cant); if (e) setTrans({ ...trans, err: e }); else setTrans(null) }}><ArrowLeftRight size={15} />Confirmar transferencia</Button>
        </div>}
      </Modal>

      <Modal abierto={!!aj} onClose={() => setAj(null)} titulo="Registrar movimiento de inventario" ancho="max-w-md">
        {aj && <div className="space-y-3">
          <Campo label="Producto"><select className="inp" value={aj.p.id} onChange={(e) => { const p = productos.find((x) => x.id === e.target.value)!; setAj({ ...aj, p, costo: p.costo, err: undefined }) }}>{productos.map((x) => <option key={x.id} value={x.id}>{x.sku} · {x.nombre}</option>)}</select></Campo>
          <div className="grid grid-cols-4 gap-1.5">{(['Venta', 'Compra', 'Ajuste', 'Merma'] as const).map((t) => <button key={t} type="button" onClick={() => setAj({ ...aj, tipo: t, err: undefined })} className={`rounded-xl border px-2 py-2 text-xs font-medium transition ${aj.tipo === t ? 'border-primario/60 bg-primario/15' : 'border-fg/10 bg-fg/5 hover:bg-fg/10'}`}>{t}</button>)}</div>
          <p className="text-xs text-muted">{{ Venta: 'Salida por venta: descuenta stock y alimenta el pronóstico de la IA.', Compra: 'Entrada directa de mercadería: suma stock y recalcula el costo promedio ponderado.', Ajuste: 'Corrección por conteo físico: positivo suma, negativo resta.', Merma: 'Pérdida por daño, robo o vencimiento: descuenta stock.' }[aj.tipo]}</p>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Sucursal"><select className="inp" value={aj.s} onChange={(e) => setAj({ ...aj, s: e.target.value as SucursalId, err: undefined })}>{SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.ciudad} ({(aj.p.stock[s.id] ?? 0)} u)</option>)}</select></Campo>
            <Campo label="Cantidad"><NumInput value={aj.cant} onChange={(v) => setAj({ ...aj, cant: Math.round(v), err: undefined })} /></Campo>
          </div>
          {aj.tipo === 'Compra' && <Campo label="Costo unitario ($)"><NumInput step={0.01} value={aj.costo} onChange={(v) => setAj({ ...aj, costo: v })} /></Campo>}
          <Campo label="Nota (opcional)"><input className="inp" value={aj.nota} onChange={(e) => setAj({ ...aj, nota: e.target.value })} placeholder="Ej.: factura 001-002-345, motivo del ajuste" /></Campo>
          {aj.err && <p className="text-xs text-peligro">{aj.err}</p>}
          <Button variante="primario" className="w-full" onClick={() => { const e = registrar(aj.p.id, aj.s, aj.tipo, aj.cant, aj.nota, aj.costo); if (e) setAj({ ...aj, err: e }); else setAj(null) }}>Registrar {aj.tipo.toLowerCase()}</Button>
        </div>}
      </Modal>

      <Modal abierto={!!kx} onClose={() => setKx(null)} titulo={`Kardex · ${kx?.p.nombre} (promedio ponderado)`} ancho="max-w-6xl">
        {kx && <div className="space-y-3">
          <div className="flex flex-wrap gap-2"><select className="inp !w-auto" value={kx.s} onChange={(e) => setKx({ ...kx, s: e.target.value as SucursalId })}><option value="TODAS">Consolidado</option>{SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}</select>
            <Button onClick={() => exportarTabla(`Kardex_${kx.p.sku}`, ['Fecha', 'Tipo', 'Suc.', 'Entrada', 'Salida', 'Costo unit.', 'Saldo', 'CPP', 'Valor'], filasK.map((f) => [fechaHora(f.fecha), f.tipo, f.sucursal, f.entrada, f.salida, num(f.costoUnit, 4), f.saldo, num(f.cpp, 4), money(f.valor)]), 'xlsx')}><FileSpreadsheet size={15} />Excel</Button></div>
          <div className="max-h-[60vh] overflow-auto"><table className="tabla"><thead className="sticky top-0 bg-[var(--bg2)]"><tr><th>Fecha</th><th>Tipo</th><th>Suc.</th><th className="num">Entrada</th><th className="num">Salida</th><th className="num">Costo unit.</th><th className="num">Saldo</th><th className="num">Costo prom.</th><th className="num">Valor</th><th>Usuario</th></tr></thead>
            <tbody>{filasK.slice().reverse().map((f, k) => <tr key={k}><td>{fechaHora(f.fecha)}</td><td>{f.tipo}</td><td>{f.sucursal}</td><td className="num text-exito">{f.entrada || ''}</td><td className="num text-peligro">{f.salida || ''}</td><td className="num">{money(f.costoUnit)}</td><td className="num font-semibold">{f.saldo}</td><td className="num">{num(f.cpp, 4)}</td><td className="num">{money(f.valor)}</td><td className="text-muted">{f.usuario}</td></tr>)}</tbody></table></div>
        </div>}
      </Modal>
    </div>
  )
}
