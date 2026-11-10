import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { EMPRESA_BASE, type Empresa, type Evento, type Movimiento, type Orden, type Producto, type Proveedor, type Sucursal, type SucursalId, type EstadoOC } from '../data/base'

export type Rol = 'Gerente General' | 'Jefe de Bodega' | 'Analista Financiero' | 'Auditor' | 'Ayudante'
export const ROLES: Rol[] = ['Gerente General', 'Jefe de Bodega', 'Analista Financiero', 'Auditor', 'Ayudante']
export type Pagina = 'dashboard' | 'red' | 'productos' | 'compras' | 'ia' | 'auditoria' | 'reportes' | 'economico' | 'configuracion'
/** usuario = nombre corto para iniciar sesión (ej. "eduardo"). */
export interface Usuario { id: string; nombre: string; usuario: string; rol: Rol; email: string; clave: string }

/** Equipo del proyecto. Usuario = primer nombre; contraseña = nombre + 2026. Se cambian en Configuración. */
const equipo = (id: string, nombre: string, usuario: string, rol: Rol): Usuario => ({ id, nombre, usuario, rol, email: '', clave: `${usuario}2026` })
export const USUARIOS: Usuario[] = [
  equipo('u1', 'Eduardo Lara Pincay', 'eduardo', 'Gerente General'),
  equipo('u2', 'Kattia Arreaga Castro', 'kattia', 'Ayudante'),
  equipo('u3', 'Emilio Espinoza Escobar', 'emilio', 'Ayudante'),
  equipo('u4', 'Holger Ferruzola Lucas', 'holger', 'Ayudante'),
  equipo('u5', 'Emily Hidalgo Castro', 'emily', 'Ayudante'),
  equipo('u6', 'Christopher Martínez Bastidas', 'christopher', 'Ayudante'),
]

export const PERMISOS: Record<Rol, Pagina[]> = {
  'Gerente General': ['dashboard', 'red', 'productos', 'compras', 'ia', 'auditoria', 'reportes', 'economico', 'configuracion'],
  'Jefe de Bodega': ['dashboard', 'red', 'productos', 'compras', 'ia', 'reportes'],
  'Analista Financiero': ['dashboard', 'red', 'compras', 'ia', 'reportes', 'economico'],
  Auditor: ['dashboard', 'red', 'productos', 'auditoria', 'reportes', 'economico'],
  Ayudante: ['dashboard', 'red', 'productos', 'reportes'],
}

/** Fila de producto para importar desde Excel/CSV. */
export interface FilaImport { sku: string; nombre: string; categoria: string; costo: number; precio: number; stock: Record<SucursalId, number>; min: number; max: number; lote: string; vence: string }
export type TipoOperacion = 'Venta' | 'Compra' | 'Ajuste' | 'Merma'

interface Datos { empresa: Empresa; sucursales: Sucursal[]; proveedores: Proveedor[]; productos: Producto[]; movimientos: Movimiento[]; ordenes: Orden[]; auditoria: Evento[]; usuarios: Usuario[] }

interface AppState extends Datos {
  usuario: Usuario | null
  tema: 'oscuro' | 'claro'
  presentacion: boolean
  pagina: Pagina
  sucursal: SucursalId | 'TODAS'
  menuColapsado: boolean
  setMenuColapsado: (v: boolean) => void
  login: (u: Usuario) => void
  logout: () => void
  ir: (p: Pagina) => void
  setTema: (t: 'oscuro' | 'claro') => void
  setPresentacion: (v: boolean) => void
  setSucursal: (s: SucursalId | 'TODAS') => void
  guardarEmpresa: (e: Empresa) => void
  guardarSucursal: (s: Sucursal, idAnterior?: string) => string | null
  eliminarSucursal: (id: string) => string | null
  guardarProducto: (p: Producto) => void
  eliminarProducto: (id: string) => void
  guardarProveedor: (p: Proveedor) => string | null
  eliminarProveedor: (id: string) => string | null
  transferir: (productoId: string, de: SucursalId, a: SucursalId, cantidad: number) => string | null
  registrar: (productoId: string, s: SucursalId, tipo: TipoOperacion, cantidad: number, nota: string, costoUnit?: number) => string | null
  crearOrden: (o: Omit<Orden, 'id' | 'fecha' | 'estado' | 'creadaPor'>) => void
  avanzarOrden: (id: string) => void
  vaciarDatos: () => void
  importarProductos: (filas: FilaImport[]) => { nuevos: number; actualizados: number }
  guardarUsuario: (u: Usuario) => string | null
  eliminarUsuario: (id: string) => string | null
  respaldo: () => Datos
  restaurar: (d: Datos) => void
}

const sello = () => new Date().toISOString()

/**
 * Almacenamiento en IndexedDB: cientos de MB (localStorage solo admite ~5 MB), necesario para empresas
 * grandes con miles de productos y movimientos. Si encuentra datos antiguos en localStorage, los migra.
 */
const almacen: StateStorage = {
  getItem: async (n) => (await idbGet<string>(n)) ?? localStorage.getItem(n),
  setItem: async (n, v) => { await idbSet(n, v); localStorage.removeItem(n) },
  removeItem: async (n) => { await idbDel(n); localStorage.removeItem(n) },
}
const total = (p: Producto) => Object.values(p.stock).reduce((a, b) => a + (b || 0), 0)
const VACIO = { productos: [], movimientos: [], ordenes: [], auditoria: [] }

export const useApp = create<AppState>()(persist((set, get) => {
  const log = (accion: string, detalle: string, sucursal: SucursalId | '—' = '—') =>
    set({ auditoria: [...get().auditoria, { id: crypto.randomUUID(), fecha: sello(), usuario: get().usuario?.nombre ?? 'Sistema', accion, detalle, sucursal }] })
  const mov = (m: Omit<Movimiento, 'id' | 'fecha' | 'usuario'>) =>
    ({ ...m, id: crypto.randomUUID(), fecha: sello(), usuario: get().usuario?.nombre ?? 'Sistema' }) as Movimiento
  /** Movimientos que explican la diferencia de stock entre dos versiones de un producto (kardex siempre cuadra). */
  const difStock = (p: Producto, prev: Producto | undefined, nota: string) => [...new Set([...Object.keys(p.stock), ...Object.keys(prev?.stock ?? {})])].flatMap((s) => {
    const d = (p.stock[s] ?? 0) - (prev?.stock[s] ?? 0)
    return d ? [mov({ productoId: p.id, sucursal: s, tipo: prev ? 'Ajuste' : 'Saldo inicial', cantidad: d, costoUnit: p.costo, nota })] : []
  })
  return {
    usuario: null, usuarios: USUARIOS, tema: 'oscuro', presentacion: false, pagina: 'dashboard', sucursal: 'TODAS',
    // En laptops pequeñas el menú arranca contraído para dar más espacio al contenido.
    menuColapsado: typeof window !== 'undefined' && window.innerWidth < 1440,
    setMenuColapsado: (menuColapsado) => set({ menuColapsado }),
    empresa: EMPRESA_BASE, sucursales: [], proveedores: [], ...VACIO,
    login: (usuario) => { set({ usuario, pagina: 'dashboard' }); log('Inicio de sesión', `${usuario.nombre} (${usuario.rol})`) },
    logout: () => { log('Cierre de sesión', get().usuario?.nombre ?? ''); set({ usuario: null }) },
    ir: (pagina) => set({ pagina }),
    setTema: (tema) => set({ tema }),
    setPresentacion: (presentacion) => set({ presentacion }),
    setSucursal: (sucursal) => set({ sucursal }),
    guardarEmpresa: (empresa) => { set({ empresa }); log('Datos de empresa actualizados', `${empresa.nombre} · ${empresa.pais} · ${empresa.moneda}`) },
    guardarSucursal: (s, idAnterior) => {
      const id = s.id.trim().toUpperCase()
      if (!id || !s.nombre.trim() || !s.ciudad.trim()) return 'Código, nombre y ciudad son obligatorios'
      const lista = get().sucursales, previa = idAnterior ?? (lista.some((x) => x.id === id) ? id : undefined)
      if (lista.some((x) => x.id === id && x.id !== previa)) return `Ya existe una sucursal con el código ${id}`
      const nueva = { ...s, id }
      let { productos, movimientos, ordenes } = get()
      if (previa && previa !== id) { // cambio de código: se renombra en todo el historial
        productos = productos.map((p) => { const st = { ...p.stock }; if (previa in st) { st[id] = st[previa]; delete st[previa] } return { ...p, stock: st } })
        movimientos = movimientos.map((m) => (m.sucursal === previa ? { ...m, sucursal: id } : m))
        ordenes = ordenes.map((o) => (o.sucursal === previa ? { ...o, sucursal: id } : o))
      }
      set({ sucursales: previa ? lista.map((x) => (x.id === previa ? nueva : x)) : [...lista, nueva], productos, movimientos, ordenes })
      log(previa ? 'Sucursal editada' : 'Sucursal creada', `${id} · ${s.nombre} (${s.ciudad}, ${s.pais})`, id)
      return null
    },
    eliminarSucursal: (id) => {
      const u = get().productos.reduce((a, p) => a + (p.stock[id] ?? 0), 0)
      if (u > 0) return `La sucursal aún tiene ${u} unidades en stock. Transfiéralas antes de eliminarla.`
      if (get().ordenes.some((o) => o.sucursal === id && o.estado !== 'Recibida')) return 'Tiene órdenes de compra pendientes'
      if (get().sucursales.length <= 1) return 'Debe existir al menos una sucursal'
      set({ sucursales: get().sucursales.filter((x) => x.id !== id), productos: get().productos.map((p) => { const st = { ...p.stock }; delete st[id]; return { ...p, stock: st } }), sucursal: get().sucursal === id ? 'TODAS' : get().sucursal })
      log('Sucursal eliminada', id); return null
    },
    guardarProducto: (p) => {
      const prev = get().productos.find((x) => x.id === p.id)
      set({ productos: prev ? get().productos.map((x) => (x.id === p.id ? p : x)) : [...get().productos, p], movimientos: [...get().movimientos, ...difStock(p, prev, prev ? 'Edición de producto' : 'Registro inicial')] })
      log(prev ? 'Producto editado' : 'Producto creado', `${p.sku} · ${p.nombre}`)
    },
    eliminarProducto: (id) => { const p = get().productos.find((x) => x.id === id); set({ productos: get().productos.filter((x) => x.id !== id) }); log('Producto eliminado', `${p?.sku} · ${p?.nombre}`) },
    guardarProveedor: (p) => {
      if (!p.nombre.trim()) return 'El nombre es obligatorio'
      const existe = get().proveedores.some((x) => x.id === p.id)
      set({ proveedores: existe ? get().proveedores.map((x) => (x.id === p.id ? p : x)) : [...get().proveedores, p] })
      log(existe ? 'Proveedor editado' : 'Proveedor creado', p.nombre); return null
    },
    eliminarProveedor: (id) => {
      if (get().ordenes.some((o) => o.proveedorId === id && o.estado !== 'Recibida')) return 'Tiene órdenes de compra pendientes'
      const p = get().proveedores.find((x) => x.id === id)
      set({ proveedores: get().proveedores.filter((x) => x.id !== id) }); log('Proveedor eliminado', p?.nombre ?? ''); return null
    },
    transferir: (productoId, de, a, cantidad) => {
      const p = get().productos.find((x) => x.id === productoId)
      if (!p || cantidad <= 0) return 'Cantidad inválida'
      if (de === a) return 'Origen y destino deben ser distintos'
      if ((p.stock[de] ?? 0) < cantidad) return `Stock insuficiente en ${de} (${p.stock[de] ?? 0} u)`
      const np = { ...p, stock: { ...p.stock, [de]: (p.stock[de] ?? 0) - cantidad, [a]: (p.stock[a] ?? 0) + cantidad } }
      set({
        productos: get().productos.map((x) => (x.id === p.id ? np : x)),
        movimientos: [...get().movimientos, mov({ productoId, sucursal: de, tipo: 'Transferencia', cantidad: -cantidad, costoUnit: p.costo, nota: `Hacia ${a}` }), mov({ productoId, sucursal: a, tipo: 'Transferencia', cantidad, costoUnit: p.costo, nota: `Desde ${de}` })],
      })
      log('Transferencia', `${cantidad} u de ${p.nombre}: ${de} → ${a}`, de)
      return null
    },
    registrar: (productoId, s, tipo, cantidad, nota, costoUnit) => {
      const p = get().productos.find((x) => x.id === productoId)
      if (!p || !cantidad) return 'Cantidad inválida'
      const q = tipo === 'Venta' || tipo === 'Merma' ? -Math.abs(cantidad) : tipo === 'Compra' ? Math.abs(cantidad) : cantidad
      if ((p.stock[s] ?? 0) + q < 0) return `Stock insuficiente en ${s} (${p.stock[s] ?? 0} u)`
      const cu = tipo === 'Compra' && costoUnit ? costoUnit : p.costo
      // Compra: el costo del producto pasa a ser el promedio ponderado.
      const costo = tipo === 'Compra' ? (total(p) * p.costo + q * cu) / (total(p) + q) : p.costo
      set({ productos: get().productos.map((x) => (x.id === p.id ? { ...p, costo: Math.round(costo * 10000) / 10000, stock: { ...p.stock, [s]: (p.stock[s] ?? 0) + q } } : x)), movimientos: [...get().movimientos, mov({ productoId, sucursal: s, tipo, cantidad: q, costoUnit: cu, nota })] })
      log(tipo, `${q > 0 ? '+' : ''}${q} u de ${p.nombre}${nota ? ' · ' + nota : ''}`, s)
      return null
    },
    crearOrden: (o) => {
      const id = `OC-${1001 + get().ordenes.length}`
      set({ ordenes: [...get().ordenes, { ...o, id, fecha: sello(), estado: 'Borrador', creadaPor: get().usuario?.nombre ?? '' }] })
      log('Orden de compra creada', id, o.sucursal)
    },
    avanzarOrden: (id) => {
      const o = get().ordenes.find((x) => x.id === id); if (!o || o.estado === 'Recibida') return
      const sig: EstadoOC = o.estado === 'Borrador' ? 'Aprobada' : 'Recibida'
      let productos = get().productos, movimientos = get().movimientos
      if (sig === 'Recibida') {
        productos = productos.map((p) => { const it = o.items.find((i) => i.productoId === p.id); if (!it) return p; const t = total(p); return { ...p, costo: Math.round(((t * p.costo + it.cantidad * it.costo) / (t + it.cantidad)) * 10000) / 10000, stock: { ...p.stock, [o.sucursal]: (p.stock[o.sucursal] ?? 0) + it.cantidad } } })
        movimientos = [...movimientos, ...o.items.map((it) => mov({ productoId: it.productoId, sucursal: o.sucursal, tipo: 'Compra', cantidad: it.cantidad, costoUnit: it.costo, nota: id }))]
      }
      set({ ordenes: get().ordenes.map((x) => (x.id === id ? { ...x, estado: sig } : x)), productos, movimientos })
      log(`Orden ${sig.toLowerCase()}`, id, o.sucursal)
    },
    vaciarDatos: () => { set({ ...VACIO }); log('Inventario vaciado', 'Se eliminaron productos, movimientos y órdenes') },
    importarProductos: (filas) => {
      let productos = [...get().productos]
      const movs: Movimiento[] = []
      let nuevos = 0, actualizados = 0
      for (const f of filas) {
        const prev = productos.find((p) => p.sku.toLowerCase() === f.sku.toLowerCase())
        const p: Producto = { id: prev?.id ?? `P${Date.now()}${nuevos}`, proveedorId: prev?.proveedorId ?? '', ...f }
        movs.push(...difStock(p, prev, 'Importado desde Excel'))
        if (prev) { productos = productos.map((x) => (x.id === prev.id ? p : x)); actualizados++ } else { productos.push(p); nuevos++ }
      }
      set({ productos, movimientos: [...get().movimientos, ...movs] })
      log('Importación de productos', `${nuevos} nuevos · ${actualizados} actualizados`)
      return { nuevos, actualizados }
    },
    guardarUsuario: (u) => {
      const lista = get().usuarios
      if (!u.nombre.trim() || !u.usuario.trim() || !u.clave) return 'Nombre, usuario y contraseña son obligatorios'
      if (lista.some((x) => x.id !== u.id && x.usuario.toLowerCase() === u.usuario.toLowerCase())) return 'Ese nombre de usuario ya existe'
      const existe = lista.some((x) => x.id === u.id)
      const nueva = existe ? lista.map((x) => (x.id === u.id ? u : x)) : [...lista, u]
      if (!nueva.some((x) => x.rol === 'Gerente General')) return 'Debe quedar al menos un Gerente General'
      set({ usuarios: nueva, usuario: get().usuario?.id === u.id ? u : get().usuario })
      log(existe ? 'Usuario editado' : 'Usuario creado', `${u.nombre} (${u.rol})`)
      return null
    },
    eliminarUsuario: (id) => {
      if (get().usuario?.id === id) return 'No puede eliminar su propio usuario'
      const u = get().usuarios.find((x) => x.id === id)
      const nueva = get().usuarios.filter((x) => x.id !== id)
      if (!nueva.some((x) => x.rol === 'Gerente General')) return 'Debe quedar al menos un Gerente General'
      set({ usuarios: nueva }); log('Usuario eliminado', `${u?.nombre}`)
      return null
    },
    respaldo: () => { const s = get(); return { empresa: s.empresa, sucursales: s.sucursales, proveedores: s.proveedores, productos: s.productos, movimientos: s.movimientos, ordenes: s.ordenes, auditoria: s.auditoria, usuarios: s.usuarios } },
    restaurar: (d) => { set({ ...d }); log('Respaldo restaurado', `${d.productos.length} productos`) },
  }
}, {
  name: 'nexora-app', version: 4,
  storage: createJSONStorage(() => almacen),
  partialize: (s) => ({ ...s, presentacion: false }),
  migrate: (old, v) => {
    const o = (old ?? {}) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    if (v < 3) return { tema: o.tema ?? 'oscuro' } as unknown as AppState // v3: sin datos de demostración
    if (v < 4) return { // v4: empresa global y sucursales ilimitadas
      ...o,
      empresa: { ...EMPRESA_BASE, nombre: o.empresa?.nombre ?? '', idFiscal: o.empresa?.ruc ?? '', telefono: o.empresa?.telefono ?? '' },
      sucursales: (o.sucursales ?? []).map((x: Sucursal, i: number) => ({ ...x, tipo: i === 0 ? 'Matriz' : 'Sucursal', pais: 'EC', activa: true })),
    } as unknown as AppState
    return o as unknown as AppState
  },
}))

/** ¿Ya se cargaron los datos guardados? (IndexedDB es asíncrono) */
export const hidratado = () => useApp.persist.hasHydrated()
