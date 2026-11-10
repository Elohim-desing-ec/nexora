/** Tipos de datos de NEXORA. El sistema arranca SIN datos de demostración: cada empresa registra los suyos. */
/** Código libre de sucursal (ej. "GYE-01", "BOG", "MAD-CD"). Sucursales ilimitadas, en cualquier país. */
export type SucursalId = string
export type TipoSucursal = 'Matriz' | 'Sucursal' | 'Bodega' | 'Centro de distribución' | 'Tienda'
export const TIPOS_SUCURSAL: TipoSucursal[] = ['Matriz', 'Sucursal', 'Bodega', 'Centro de distribución', 'Tienda']
export interface Sucursal { id: SucursalId; nombre: string; tipo: TipoSucursal; pais: string; ciudad: string; direccion: string; lat: number; lng: number; activa: boolean }
export interface Proveedor { id: string; nombre: string; ruc: string; ciudad: string; contacto: string; telefono: string; email: string; cumplimiento: number; indicePrecio: number }
/** pais = código ISO 3166 (EC, CO, US…); moneda = ISO 4217 (USD, COP, EUR…) usada para costos y reportes. */
export interface Empresa { nombre: string; idFiscal: string; pais: string; moneda: string; sector: string; telefono: string; configurada: boolean }
export interface Producto {
  id: string; sku: string; nombre: string; categoria: string; costo: number; precio: number
  /** unidades por sucursal: { [códigoSucursal]: unidades } */
  stock: Record<SucursalId, number>; min: number; max: number; lote: string; vence: string; proveedorId: string
}
export type TipoMov = 'Saldo inicial' | 'Compra' | 'Venta' | 'Transferencia' | 'Ajuste' | 'Merma'
/** cantidad con signo: + entra a la sucursal, − sale. */
export interface Movimiento { id: string; fecha: string; productoId: string; sucursal: SucursalId; tipo: TipoMov; cantidad: number; costoUnit: number; usuario: string; nota?: string }
export type EstadoOC = 'Borrador' | 'Aprobada' | 'Recibida'
export interface Orden { id: string; proveedorId: string; sucursal: SucursalId; fecha: string; estado: EstadoOC; items: { productoId: string; cantidad: number; costo: number }[]; creadaPor: string }
export interface Evento { id: string; fecha: string; usuario: string; accion: string; detalle: string; sucursal: SucursalId | '—' }

export const EMPRESA_BASE: Empresa = { nombre: '', idFiscal: '', pais: 'EC', moneda: 'USD', sector: '', telefono: '', configurada: false }
export const SECTORES = ['Comercio / distribución', 'Retail / supermercados', 'Industria / manufactura', 'Farmacéutico', 'Tecnología', 'Construcción / ferretería', 'Alimentos y bebidas', 'Logística', 'Servicios', 'Otro']
/** Categorías sugeridas (se pueden escribir otras). */
export const CATEGORIAS = ['Alimentos y bebidas', 'Limpieza y hogar', 'Cuidado personal', 'Tecnología', 'Papelería y oficina', 'Ferretería', 'Repuestos', 'Farmacia', 'Textil', 'Materia prima']
