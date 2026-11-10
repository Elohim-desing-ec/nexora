import { useMemo, useState } from 'react'
import { CheckCircle2, Pencil, Plus, Trash2, Truck, Trophy, Building2 } from 'lucide-react'
import { useApp } from '../store/useApp'
import { Badge, Button, Campo, Card, Modal, NumInput, Scroll, Titulo } from '../components/ui'
import { money, fecha, num } from '../lib/format'
import type { Orden, Proveedor, SucursalId } from '../data/base'

export const totalOC = (o: Orden) => o.items.reduce((s, i) => s + i.cantidad * i.costo, 0)
const nuevoProv = (): Proveedor => ({ id: crypto.randomUUID(), nombre: '', ruc: '', ciudad: '', contacto: '', telefono: '', email: '', cumplimiento: 100, indicePrecio: 1 })

export default function Compras() {
  const { ordenes, productos, proveedores, sucursales, usuario, crearOrden, avanzarOrden, guardarProveedor, eliminarProveedor } = useApp()
  const [nueva, setNueva] = useState<{ proveedorId: string; sucursal: SucursalId; items: { productoId: string; cantidad: number; costo: number }[] } | null>(null)
  const [prov, setProv] = useState<Proveedor | null>(null), [err, setErr] = useState('')
  const puedeAprobar = usuario?.rol === 'Gerente General' || usuario?.rol === 'Analista Financiero'
  const puedeRecibir = usuario?.rol === 'Gerente General' || usuario?.rol === 'Jefe de Bodega'
  const puedeEditar = usuario?.rol !== 'Auditor'
  // Cumplimiento real: % de órdenes aprobadas que ya fueron recibidas (si hay historial); si no, el valor registrado.
  const ranking = useMemo(() => proveedores.map((p) => {
    const os = ordenes.filter((o) => o.proveedorId === p.id && o.estado !== 'Borrador')
    const cumplimiento = os.length ? (os.filter((o) => o.estado === 'Recibida').length / os.length) * 100 : p.cumplimiento
    return { ...p, cumplimiento, compras: os.reduce((s, o) => s + totalOC(o), 0), puntaje: cumplimiento * 0.6 + (2 - p.indicePrecio) * 100 * 0.4 }
  }).sort((a, b) => b.puntaje - a.puntaje), [proveedores, ordenes])
  const tono = { Borrador: 'gris', Aprobada: 'azul', Recibida: 'verde' } as const
  const item = () => ({ productoId: productos[0].id, cantidad: 10, costo: productos[0].costo })
  const sinDatos = !sucursales.length ? 'Primero registre una sucursal en Configuración' : !productos.length ? 'Primero registre productos en Inventario' : !proveedores.length ? 'Primero registre un proveedor' : ''
  return (
    <div className="space-y-5">
      <Titulo titulo="Compras y proveedores" sub="Flujo: Borrador → Aprobada → Recibida (al recibir se actualizan el stock, el costo promedio y el kardex)">
        {puedeEditar && <Button onClick={() => { setErr(''); setProv(nuevoProv()) }}><Building2 size={15} />Nuevo proveedor</Button>}
        {puedeEditar && <Button variante="primario" disabled={!!sinDatos} title={sinDatos} onClick={() => setNueva({ proveedorId: proveedores[0].id, sucursal: sucursales[0]?.id ?? '', items: [item()] })}><Plus size={15} />Nueva orden</Button>}
      </Titulo>
      {sinDatos && <Card><p className="text-sm text-muted">{sinDatos} para poder crear órdenes de compra.</p></Card>}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card titulo="Órdenes de compra" className="xl:col-span-2"><Scroll><table className="tabla">
          <thead><tr><th>N.°</th><th>Fecha</th><th>Proveedor</th><th>Sucursal</th><th className="num">Ítems</th><th className="num">Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>{ordenes.slice().reverse().map((o) => <tr key={o.id}>
            <td className="font-mono text-xs">{o.id}</td><td>{fecha(o.fecha)}</td><td>{proveedores.find((p) => p.id === o.proveedorId)?.nombre ?? '—'}</td><td>{o.sucursal}</td><td className="num">{o.items.length}</td><td className="num font-semibold">{money(totalOC(o))}</td>
            <td><Badge tono={tono[o.estado]}>{o.estado}</Badge></td>
            <td>{o.estado === 'Borrador' && <Button variante="exito" disabled={!puedeAprobar} title={puedeAprobar ? '' : 'Requiere Gerente o Analista'} className="!py-1 text-xs" onClick={() => avanzarOrden(o.id)}><CheckCircle2 size={14} />Aprobar</Button>}
              {o.estado === 'Aprobada' && <Button disabled={!puedeRecibir} className="!py-1 text-xs" onClick={() => avanzarOrden(o.id)}><Truck size={14} />Recibir</Button>}</td>
          </tr>)}</tbody></table></Scroll>
          {!ordenes.length && <p className="py-8 text-center text-sm text-muted">Aún no hay órdenes de compra.</p>}</Card>
        <Card titulo={<span className="flex items-center gap-2"><Trophy size={15} className="text-alerta" />Ranking de proveedores</span>}>
          <ol className="space-y-2">{ranking.map((p, k) => <li key={p.id} className="flex items-center gap-3 rounded-xl bg-fg/5 px-3 py-2">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${k < 3 ? 'bg-gradient-to-br from-alerta to-peligro text-white' : 'bg-fg/10'}`}>{k + 1}</span>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.nombre}</div><div className="text-xs text-muted">Cumplimiento {num(p.cumplimiento, 0)} % · Precio {num(p.indicePrecio, 2)} · Compras {money(p.compras, 0)}</div>
              <div className="mt-1 h-1.5 rounded-full bg-fg/10"><div className="h-full rounded-full bg-gradient-to-r from-primario to-cian" style={{ width: `${p.cumplimiento}%` }} /></div></div>
            <span className="text-sm font-bold tnum">{num(p.puntaje, 1)}</span></li>)}</ol>
          {!ranking.length && <p className="text-sm text-muted">Sin proveedores registrados.</p>}
          <p className="mt-3 text-[11px] text-muted">Puntaje = 60 % cumplimiento (órdenes recibidas / aprobadas) + 40 % competitividad de precio (1 = precio de mercado).</p>
        </Card>
      </div>
      <Card titulo={`Proveedores (${proveedores.length})`}><Scroll><table className="tabla">
        <thead><tr><th>Nombre</th><th>RUC</th><th>Ciudad</th><th>Contacto</th><th>Teléfono</th><th>Correo</th><th /></tr></thead>
        <tbody>{proveedores.map((p) => <tr key={p.id}><td className="font-medium">{p.nombre}</td><td className="font-mono text-xs">{p.ruc}</td><td>{p.ciudad}</td><td>{p.contacto}</td><td>{p.telefono}</td><td className="text-muted">{p.email}</td>
          <td>{puedeEditar && <div className="flex gap-1"><Button variante="fantasma" className="!p-1.5" title="Editar" onClick={() => { setErr(''); setProv({ ...p }) }}><Pencil size={15} /></Button><Button variante="fantasma" className="!p-1.5 text-peligro" title="Eliminar" onClick={() => { if (confirm(`¿Eliminar ${p.nombre}?`)) { const e = eliminarProveedor(p.id); if (e) alert(e) } }}><Trash2 size={15} /></Button></div>}</td></tr>)}</tbody></table></Scroll>
        {!proveedores.length && <p className="py-6 text-center text-sm text-muted">Registre sus proveedores con "Nuevo proveedor".</p>}</Card>

      <Modal abierto={!!prov} onClose={() => setProv(null)} titulo={proveedores.some((x) => x.id === prov?.id) ? 'Editar proveedor' : 'Nuevo proveedor'} ancho="max-w-xl">
        {prov && <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const r = guardarProveedor(prov); if (r) setErr(r); else setProv(null) }}>
          <Campo label="Nombre o razón social"><input autoFocus className="inp" value={prov.nombre} onChange={(e) => setProv({ ...prov, nombre: e.target.value })} /></Campo>
          <Campo label="RUC"><input className="inp" inputMode="numeric" maxLength={13} value={prov.ruc} onChange={(e) => setProv({ ...prov, ruc: e.target.value.replace(/\D/g, '') })} /></Campo>
          <Campo label="Ciudad"><input className="inp" value={prov.ciudad} onChange={(e) => setProv({ ...prov, ciudad: e.target.value })} /></Campo>
          <Campo label="Persona de contacto"><input className="inp" value={prov.contacto} onChange={(e) => setProv({ ...prov, contacto: e.target.value })} /></Campo>
          <Campo label="Teléfono"><input className="inp" value={prov.telefono} onChange={(e) => setProv({ ...prov, telefono: e.target.value })} /></Campo>
          <Campo label="Correo"><input type="email" className="inp" value={prov.email} onChange={(e) => setProv({ ...prov, email: e.target.value })} /></Campo>
          <Campo label="Cumplimiento inicial (%)" ayuda="Se recalcula solo con las órdenes recibidas"><NumInput min={0} max={100} value={prov.cumplimiento} onChange={(v) => setProv({ ...prov, cumplimiento: Math.max(0, Math.min(100, v)) })} /></Campo>
          <Campo label="Índice de precio" ayuda="1 = mercado · 0,95 = 5 % más barato"><NumInput step={0.01} value={prov.indicePrecio} onChange={(v) => setProv({ ...prov, indicePrecio: v })} /></Campo>
          {err && <p className="text-sm text-peligro sm:col-span-2">{err}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" onClick={() => setProv(null)}>Cancelar</Button><Button variante="primario" type="submit">Guardar</Button></div>
        </form>}
      </Modal>

      <Modal abierto={!!nueva} onClose={() => setNueva(null)} titulo="Nueva orden de compra">
        {nueva && <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Proveedor"><select className="inp" value={nueva.proveedorId} onChange={(e) => setNueva({ ...nueva, proveedorId: e.target.value })}>{proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Campo>
            <Campo label="Sucursal de destino"><select className="inp" value={nueva.sucursal} onChange={(e) => setNueva({ ...nueva, sucursal: e.target.value as SucursalId })}>{sucursales.map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}</select></Campo>
          </div>
          {nueva.items.map((it, k) => <div key={k} className="grid grid-cols-[1fr_90px_110px_auto] items-end gap-2">
            <Campo label="Producto"><select className="inp" value={it.productoId} onChange={(e) => { const p = productos.find((x) => x.id === e.target.value)!; const items = [...nueva.items]; items[k] = { ...it, productoId: p.id, costo: p.costo }; setNueva({ ...nueva, items }) }}>{productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Campo>
            <Campo label="Cant."><NumInput value={it.cantidad} onChange={(v) => { const items = [...nueva.items]; items[k] = { ...it, cantidad: Math.max(1, Math.round(v)) }; setNueva({ ...nueva, items }) }} /></Campo>
            <Campo label="Costo"><NumInput step={0.01} value={it.costo} onChange={(v) => { const items = [...nueva.items]; items[k] = { ...it, costo: v }; setNueva({ ...nueva, items }) }} /></Campo>
            <Button variante="fantasma" className="text-peligro" onClick={() => setNueva({ ...nueva, items: nueva.items.filter((_, j) => j !== k) })}><Trash2 size={15} /></Button>
          </div>)}
          <div className="flex items-center justify-between"><Button onClick={() => setNueva({ ...nueva, items: [...nueva.items, item()] })}><Plus size={15} />Ítem</Button>
            <div className="text-sm">Total: <b className="tnum">{money(nueva.items.reduce((s, i) => s + i.cantidad * i.costo, 0))}</b></div></div>
          <Button variante="primario" className="w-full" disabled={!nueva.items.length} onClick={() => { crearOrden(nueva); setNueva(null) }}>Crear como borrador</Button>
        </div>}
      </Modal>
    </div>
  )
}
