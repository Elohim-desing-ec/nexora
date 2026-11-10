import { lazy, Suspense, useRef, useState } from 'react'
import { Database, Download, Eraser, FileUp, Pencil, Plus, Trash2, Users, BookOpen, ArrowRight, Building2, Save, HardDriveDownload, HardDriveUpload } from 'lucide-react'
import { useApp, ROLES, PERMISOS, type Usuario, type FilaImport } from '../store/useApp'
import { useEcon } from '../store/useEcon'
import { Badge, Button, Campo, Card, Modal, Scroll, Tabs, Titulo, cx } from '../components/ui'
import { MENU } from '../components/Layout'
import { descargarPlantilla, leerArchivo } from '../lib/importar'
import { money } from '../lib/format'
import { SECTORES, type Empresa, type Sucursal } from '../data/base'
import { PAISES, MONEDAS, SIMBOLOS, bandera, pais } from '../data/paises'
import { EditorSucursal, sucursalVacia } from '../components/EditorSucursal'
import { valorInventario } from '../lib/inventario'

const Globo = lazy(() => import('../components/Globo'))

const ve = (rol: Usuario['rol']) => MENU.filter((m) => PERMISOS[rol].includes(m.id)).map((m) => m.label)

function Usuarios() {
  const { usuarios, usuario, guardarUsuario, eliminarUsuario } = useApp()
  const [edit, setEdit] = useState<Usuario | null>(null), [err, setErr] = useState('')
  const tono = { 'Gerente General': 'violeta', 'Jefe de Bodega': 'azul', 'Analista Financiero': 'cian', Auditor: 'ambar', Ayudante: 'verde' } as const
  return <>
    <Card titulo={`Usuarios del sistema (${usuarios.length})`} accion={<Button variante="primario" onClick={() => { setErr(''); setEdit({ id: crypto.randomUUID(), nombre: '', usuario: '', email: '', rol: 'Ayudante', clave: '' }) }}><Plus size={15} />Agregar persona</Button>}>
      <Scroll><table className="tabla"><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Puede ver</th><th /></tr></thead>
        <tbody>{usuarios.map((u) => <tr key={u.id}>
          <td className="font-medium"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primario to-violeta text-[10px] font-bold text-black">{u.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>{u.nombre}{u.id === usuario?.id && <Badge tono="verde">Usted</Badge>}</div></td>
          <td className="font-mono text-xs">{u.usuario}</td><td><Badge tono={tono[u.rol]}>{u.rol}</Badge></td>
          <td className="whitespace-normal text-xs text-muted">{ve(u.rol).join(' · ')}</td>
          <td><div className="flex gap-1"><Button variante="fantasma" className="!p-1.5" title="Editar" onClick={() => { setErr(''); setEdit({ ...u }) }}><Pencil size={15} /></Button>
            <Button variante="fantasma" className="!p-1.5 text-peligro" title="Eliminar" onClick={() => { if (confirm(`¿Eliminar a ${u.nombre}?`)) { const e = eliminarUsuario(u.id); if (e) alert(e) } }}><Trash2 size={15} /></Button></div></td>
        </tr>)}</tbody></table></Scroll>
      <p className="mt-3 text-xs text-muted">Para asignar funciones a una persona, edítela y cambie su rol. Cada rol ve un menú distinto.</p>
    </Card>
    <Modal abierto={!!edit} onClose={() => setEdit(null)} titulo={usuarios.some((x) => x.id === edit?.id) ? 'Editar usuario' : 'Agregar persona'} ancho="max-w-lg">
      {edit && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const r = guardarUsuario({ ...edit, nombre: edit.nombre.trim(), usuario: edit.usuario.trim().toLowerCase(), email: edit.email.trim() }); if (r) setErr(r); else setEdit(null) }}>
        <Campo label="Nombre completo"><input autoFocus className="inp" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value, usuario: edit.usuario || '' })} placeholder="Ej.: Ana Mora" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Usuario (para ingresar)" ayuda="Corto y sin espacios, ej.: ana"><input className="inp" value={edit.usuario} onChange={(e) => setEdit({ ...edit, usuario: e.target.value.replace(/\s/g, '').toLowerCase() })} /></Campo>
          <Campo label="Contraseña" ayuda="Fácil de recordar, ej.: ana2026"><input className="inp" value={edit.clave} onChange={(e) => setEdit({ ...edit, clave: e.target.value })} /></Campo>
        </div>
        <Campo label="Rol"><select className="inp" value={edit.rol} onChange={(e) => setEdit({ ...edit, rol: e.target.value as Usuario['rol'] })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Campo>
        <p className="text-xs text-muted">Con este rol verá: {ve(edit.rol).join(', ')}.</p>
        <Campo label="Correo (opcional)"><input type="email" className="inp" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Campo>
        {err && <p className="text-sm text-peligro">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" onClick={() => setEdit(null)}>Cancelar</Button><Button variante="primario" type="submit">Guardar</Button></div>
      </form>}
    </Modal>
  </>
}

export function FormEmpresa({ e, setE }: { e: Empresa; setE: (e: Empresa) => void }) {
  const p = pais(e.pais)
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <Campo label="Razón social"><input className="inp" value={e.nombre} onChange={(x) => setE({ ...e, nombre: x.target.value })} placeholder="Ej.: Distribuidora Pacífico S.A." /></Campo>
    <Campo label="País (sede principal)"><select className="inp" value={e.pais} onChange={(x) => { const n = pais(x.target.value); setE({ ...e, pais: x.target.value, moneda: n?.moneda ?? e.moneda }) }}>{PAISES.map((q) => <option key={q.codigo} value={q.codigo}>{bandera(q.codigo)} {q.nombre}</option>)}</select></Campo>
    <Campo label="Moneda de la empresa" ayuda="Costos, precios y reportes"><select className="inp" value={e.moneda} onChange={(x) => setE({ ...e, moneda: x.target.value })}>{MONEDAS.map((m) => <option key={m} value={m}>{m} ({SIMBOLOS[m]})</option>)}</select></Campo>
    <Campo label={`Identificación fiscal (${p?.idFiscal ?? 'ID'})`}><input className="inp" value={e.idFiscal} onChange={(x) => setE({ ...e, idFiscal: x.target.value })} /></Campo>
    <Campo label="Sector"><select className="inp" value={e.sector} onChange={(x) => setE({ ...e, sector: x.target.value })}><option value="">— Elegir —</option>{SECTORES.map((q) => <option key={q}>{q}</option>)}</select></Campo>
    <Campo label="Teléfono"><input className="inp" value={e.telefono} onChange={(x) => setE({ ...e, telefono: x.target.value })} /></Campo>
  </div>
}

function EmpresaTab() {
  const { empresa, sucursales, productos, guardarEmpresa, guardarSucursal, eliminarSucursal } = useApp()
  const [e, setE] = useState<Empresa>(empresa), [ok, setOk] = useState(false)
  const [ed, setEd] = useState<{ v: Sucursal; previa?: string } | null>(null), [err, setErr] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const paises = new Set(sucursales.map((x) => x.pais)).size
  return <>
    <Card titulo="Datos de la empresa" accion={<div className="flex items-center gap-3">{ok && <span className="text-sm text-exito">Guardado ✓</span>}<Button variante="primario" onClick={() => { guardarEmpresa({ ...e, configurada: true }); setOk(true) }}><Save size={15} />Guardar</Button></div>}>
      <FormEmpresa e={e} setE={(x) => { setOk(false); setE(x) }} />
      <p className="mt-3 text-xs text-muted">El nombre aparece en el menú y en el membrete de los reportes. La moneda se usa en todo el sistema.</p>
    </Card>
    <Card titulo={`Red de sucursales · ${sucursales.length} en ${paises} ${paises === 1 ? 'país' : 'países'}`} accion={<Button variante="primario" onClick={() => { setErr(''); setEd({ v: sucursalVacia(empresa.pais) }) }}><Plus size={15} />Agregar sucursal</Button>}>
      <div className="grid gap-4 xl:grid-cols-5">
        <Suspense fallback={<div className="espacio h-[380px] rounded-xl xl:col-span-2" />}><Globo className="h-[380px] xl:col-span-2" seleccion={sel} onSeleccion={setSel} puntos={sucursales.map((x) => ({ id: x.id, nombre: `${x.id} · ${x.nombre}`, lat: x.lat, lng: x.lng, valor: valorInventario(productos, x.id) + 1, detalle: `${x.tipo} · ${x.ciudad}, ${pais(x.pais)?.nombre ?? x.pais}` }))} /></Suspense>
        <div className="min-w-0 xl:col-span-3"><Scroll><table className="tabla"><thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Ubicación</th><th className="num">Inventario</th><th /></tr></thead>
          <tbody>{sucursales.map((x) => <tr key={x.id} className={cx(sel === x.id && 'bg-primario/10')} onClick={() => setSel(x.id)}>
            <td className="font-mono text-xs font-semibold">{x.id}</td><td className="font-medium">{x.nombre}</td><td><Badge tono={x.tipo === 'Matriz' ? 'violeta' : 'azul'}>{x.tipo}</Badge></td>
            <td>{bandera(x.pais)} {x.ciudad}<div className="max-w-[220px] truncate text-[11px] text-muted">{x.direccion}</div></td><td className="num">{money(valorInventario(productos, x.id), 0)}</td>
            <td><div className="flex gap-1"><Button variante="fantasma" className="!p-1.5" title="Editar" onClick={() => { setErr(''); setEd({ v: { ...x }, previa: x.id }) }}><Pencil size={15} /></Button>
              <Button variante="fantasma" className="!p-1.5 text-peligro" title="Eliminar" onClick={() => { if (confirm(`¿Eliminar la sucursal ${x.nombre}?`)) { const r = eliminarSucursal(x.id); if (r) alert(r) } }}><Trash2 size={15} /></Button></div></td>
          </tr>)}</tbody></table></Scroll>
          {!sucursales.length && <p className="py-8 text-center text-sm text-muted">Agregue su primera sucursal: puede estar en cualquier país.</p>}</div>
      </div>
    </Card>
    <Modal abierto={!!ed} onClose={() => setEd(null)} titulo={ed?.previa ? `Editar sucursal ${ed.previa}` : 'Nueva sucursal'} ancho="max-w-5xl">
      {ed && <div className="space-y-3"><EditorSucursal v={ed.v} set={(v) => setEd({ ...ed, v })} />
        {err && <p className="text-sm text-peligro">{err}</p>}
        <div className="flex justify-end gap-2"><Button onClick={() => setEd(null)}>Cancelar</Button><Button variante="primario" onClick={() => { const r = guardarSucursal(ed.v, ed.previa); if (r) setErr(r); else setEd(null) }}><Save size={15} />Guardar sucursal</Button></div></div>}
    </Modal>
  </>
}

function Datos() {
  const { productos, movimientos, sucursales, vaciarDatos, importarProductos, ir, respaldo, restaurar } = useApp()
  const econ = useEcon()
  const archivo = useRef<HTMLInputElement>(null), resp = useRef<HTMLInputElement>(null)
  const [prev, setPrev] = useState<{ filas: FilaImport[]; errores: string[]; nombre: string } | null>(null)
  const [msg, setMsg] = useState('')
  const descargar = () => {
    const blob = new Blob([JSON.stringify({ app: 'NEXORA', version: 3, fecha: new Date().toISOString(), datos: respaldo(), economico: { p: econ.p, escenarios: econ.escenarios } }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `NEXORA_respaldo_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href)
  }
  const cargar = async (f: File) => {
    try {
      const j = JSON.parse(await f.text())
      if (j.app !== 'NEXORA' || !j.datos?.usuarios) throw new Error()
      if (!confirm(`¿Restaurar el respaldo del ${new Date(j.fecha).toLocaleString('es-EC')}? Reemplaza todos los datos actuales.`)) return
      restaurar(j.datos); if (j.economico) useEcon.setState({ p: j.economico.p, escenarios: j.economico.escenarios ?? [] })
      setMsg('Respaldo restaurado correctamente.')
    } catch { alert('El archivo no es un respaldo válido de NEXORA.') }
  }
  return <>
    <Card titulo="Estado actual"><div className="grid gap-3 text-sm sm:grid-cols-3">{[['Productos', productos.length], ['Movimientos', movimientos.length], ['Valor del inventario', money(valorInventario(productos), 0)]].map(([a, b]) => <div key={a} className="rounded-xl bg-fg/5 p-3"><div className="text-xs text-muted">{a}</div><div className="text-xl font-bold tnum">{b}</div></div>)}</div>
      {msg && <p className="mt-3 rounded-lg bg-exito/10 p-3 text-sm text-exito">{msg}</p>}</Card>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card hover titulo={<span className="flex items-center gap-2"><FileUp size={15} className="text-cian" />Cargar productos desde Excel</span>}>
        <p className="mb-3 text-sm text-muted">Descargue la plantilla, llénela con sus productos (una fila por producto) e impórtela. Acepta .xlsx, .xls y .csv. Si el SKU ya existe, se actualiza.</p>
        <div className="flex flex-wrap gap-2"><Button disabled={!sucursales.length} onClick={() => descargarPlantilla(sucursales)}><Download size={15} />Plantilla</Button><Button variante="primario" onClick={() => archivo.current?.click()}><FileUp size={15} />Importar Excel</Button></div>
        <input ref={archivo} type="file" accept=".xlsx,.xls,.csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPrev({ ...(await leerArchivo(f, sucursales)), nombre: f.name }); e.target.value = '' }} />
      </Card>
      <Card hover titulo={<span className="flex items-center gap-2"><Plus size={15} className="text-exito" />Registrar uno por uno</span>}>
        <p className="mb-3 text-sm text-muted">En Inventario: "Nuevo producto" para crearlo y "Registrar movimiento" para ventas, compras, ajustes y mermas.</p>
        <Button onClick={() => ir('productos')}>Ir a Inventario <ArrowRight size={15} /></Button>
      </Card>
      <Card hover titulo={<span className="flex items-center gap-2"><HardDriveDownload size={15} className="text-violeta" />Respaldo</span>}>
        <p className="mb-3 text-sm text-muted">Los datos se guardan en este navegador. Descargue un respaldo para no perderlos o para llevarlos a otra computadora (incluye usuarios, inventario y análisis económico).</p>
        <div className="flex flex-wrap gap-2"><Button variante="primario" onClick={descargar}><HardDriveDownload size={15} />Descargar respaldo</Button><Button onClick={() => resp.current?.click()}><HardDriveUpload size={15} />Restaurar respaldo</Button></div>
        <input ref={resp} type="file" accept=".json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) cargar(f); e.target.value = '' }} />
      </Card>
      <Card hover titulo={<span className="flex items-center gap-2"><Eraser size={15} className="text-peligro" />Vaciar inventario</span>}>
        <p className="mb-3 text-sm text-muted">Borra productos, movimientos y órdenes (usuarios, proveedores y empresa se conservan). Descargue un respaldo antes.</p>
        <Button variante="peligro" onClick={() => { if (confirm('¿Borrar TODO el inventario, movimientos y órdenes? Esta acción no se puede deshacer.')) { vaciarDatos(); setMsg('Inventario vaciado.') } }}><Eraser size={15} />Vaciar inventario</Button>
      </Card>
    </div>
    <Modal abierto={!!prev} onClose={() => setPrev(null)} titulo={`Vista previa · ${prev?.nombre}`} ancho="max-w-5xl">
      {prev && <div className="space-y-3">
        <div className="flex flex-wrap gap-2"><Badge tono="verde">{prev.filas.length} filas válidas</Badge>{prev.errores.length > 0 && <Badge tono="rojo">{prev.errores.length} con errores</Badge>}</div>
        {prev.errores.length > 0 && <ul className="max-h-24 overflow-auto rounded-lg bg-peligro/10 p-2 text-xs text-peligro">{prev.errores.map((e) => <li key={e}>{e}</li>)}</ul>}
        <div className="max-h-[50vh] overflow-auto"><table className="tabla"><thead><tr><th>SKU</th><th>Nombre</th><th>Categoría</th><th className="num">Costo</th><th className="num">Precio</th>{sucursales.map((x) => <th key={x.id} className="num">{x.id}</th>)}<th>Vence</th><th /></tr></thead>
          <tbody>{prev.filas.map((f) => <tr key={f.sku}><td className="font-mono text-xs">{f.sku}</td><td>{f.nombre}</td><td>{f.categoria}</td><td className="num">{money(f.costo)}</td><td className="num">{money(f.precio)}</td>{sucursales.map((x) => <td key={x.id} className="num">{f.stock[x.id] ?? 0}</td>)}<td>{f.vence}</td><td>{productos.some((p) => p.sku.toLowerCase() === f.sku.toLowerCase()) ? <Badge tono="ambar">Actualiza</Badge> : <Badge tono="verde">Nuevo</Badge>}</td></tr>)}</tbody></table></div>
        <div className="flex justify-end gap-2"><Button onClick={() => setPrev(null)}>Cancelar</Button><Button variante="primario" disabled={!prev.filas.length} onClick={() => { const r = importarProductos(prev.filas); setPrev(null); setMsg(`Importación lista: ${r.nuevos} productos nuevos y ${r.actualizados} actualizados. Cada uno quedó con su "Saldo inicial" en el kardex.`) }}>Importar {prev.filas.length} productos</Button></div>
      </div>}
    </Modal>
  </>
}

function Guia() {
  const pasos = [
    ['Empresa', 'En la pestaña Empresa elija país, moneda y datos fiscales, y agregue todas sus sucursales (en cualquier país) ubicándolas en el globo.'],
    ['Usuarios', 'Agregue a cada persona con un usuario corto, una contraseña fácil y su rol.'],
    ['Proveedores', 'En Compras → "Nuevo proveedor" registre a quienes le venden.'],
    ['Productos', 'Cárguelos con la plantilla de Excel (Mis datos) o uno por uno en Inventario. El stock inicial queda como "Saldo inicial" en el kardex.'],
    ['Operación diaria', 'Registre ventas, compras, ajustes y mermas en Inventario → "Registrar movimiento". Las órdenes de compra siguen Borrador → Aprobada → Recibida.'],
    ['IA', 'Con algunas semanas de ventas registradas, NEXORA pronostica la demanda, calcula el punto de reorden y sugiere compras.'],
    ['Análisis económico', 'Escriba los costos reales del sistema actual y de NEXORA en Parámetros; el veredicto se recalcula solo.'],
    ['Respaldo', 'Descargue un respaldo cada cierto tiempo en Mis datos → Respaldo.'],
  ]
  return <Card titulo="¿Cómo empezar a usar NEXORA con datos reales?"><ol className="space-y-3">{pasos.map(([t, d], k) => <li key={t} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primario to-violeta text-xs font-bold text-black">{k + 1}</span><div><div className="font-semibold">{t}</div><p className="text-sm text-muted">{d}</p></div></li>)}</ol></Card>
}

export default function Configuracion() {
  const [t, setT] = useState<'usuarios' | 'empresa' | 'datos' | 'guia'>('usuarios')
  return <div className="space-y-4">
    <Titulo titulo="Configuración" sub="Empresa, usuarios del sistema y carga de datos reales" />
    <Tabs items={[{ id: 'usuarios', label: 'Usuarios', icon: <Users size={14} /> }, { id: 'empresa', label: 'Empresa', icon: <Building2 size={14} /> }, { id: 'datos', label: 'Mis datos', icon: <Database size={14} /> }, { id: 'guia', label: 'Guía', icon: <BookOpen size={14} /> }]} valor={t} onChange={setT} />
    {t === 'usuarios' ? <Usuarios /> : t === 'empresa' ? <EmpresaTab /> : t === 'datos' ? <Datos /> : <Guia />}
  </div>
}
