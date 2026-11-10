import type { Movimiento, Producto, SucursalId } from '../data/base'

/** Unidades de un producto en una sucursal (0 si no la maneja). */
export const st = (p: Producto, s: SucursalId) => p.stock[s] ?? 0
export const stockTotal = (p: Producto, s: SucursalId | 'TODAS' = 'TODAS') => (s === 'TODAS' ? Object.values(p.stock).reduce((a, b) => a + (b || 0), 0) : st(p, s))
/** Quiebre: stock por debajo de 1/3 del mínimo (en la sucursal elegida o en cualquiera que maneje el producto). */
export const enQuiebre = (p: Producto, s: SucursalId | 'TODAS' = 'TODAS') => (s === 'TODAS' ? Object.values(p.stock).some((v) => v < p.min / 3) : st(p, s) < p.min / 3)
/** Valor del inventario a costo promedio, total o por sucursal. */
export const valorInventario = (ps: Producto[], s: SucursalId | 'TODAS' = 'TODAS') => ps.reduce((a, p) => a + stockTotal(p, s) * p.costo, 0)

export interface FilaKardex { fecha: string; tipo: string; sucursal: string; entrada: number; salida: number; costoUnit: number; saldo: number; cpp: number; valor: number; usuario: string }

/** Kardex por método de promedio ponderado: el costo promedio se recalcula en cada entrada. */
export function kardex(productoId: string, movs: Movimiento[], s: SucursalId | 'TODAS' = 'TODAS'): FilaKardex[] {
  let saldo = 0, cpp = 0
  const filas: FilaKardex[] = []
  for (const m of movs) {
    if (m.productoId !== productoId || (s !== 'TODAS' && m.sucursal !== s)) continue
    if (s === 'TODAS' && m.tipo === 'Transferencia') continue // neutra en el consolidado
    if (m.cantidad > 0) { cpp = (saldo * cpp + m.cantidad * m.costoUnit) / (saldo + m.cantidad); saldo += m.cantidad }
    else saldo += m.cantidad
    filas.push({ fecha: m.fecha, tipo: m.tipo, sucursal: m.sucursal, entrada: Math.max(0, m.cantidad), salida: Math.max(0, -m.cantidad), costoUnit: m.cantidad > 0 ? m.costoUnit : cpp, saldo, cpp, valor: saldo * cpp, usuario: m.usuario })
  }
  return filas
}

/** Ventas por semana (últimas 26) de un producto o de todos. */
export function ventasSemanales(movs: Movimiento[], productoId?: string, s: SucursalId | 'TODAS' = 'TODAS', semanas = 26) {
  const fin = Date.now(), ms = 7 * 86400000
  const serie = Array(semanas).fill(0) as number[]
  for (const m of movs) {
    if (m.tipo !== 'Venta' || (productoId && m.productoId !== productoId) || (s !== 'TODAS' && m.sucursal !== s)) continue
    const k = semanas - 1 - Math.floor((fin - new Date(m.fecha).getTime()) / ms)
    if (k >= 0 && k < semanas) serie[k] += -m.cantidad
  }
  return serie
}

/** Ventas valorizadas por mes (últimos 6) para las sucursales indicadas. */
export function ventasMensuales(movs: Movimiento[], productos: Producto[], sucursales: SucursalId[]) {
  const precio = new Map(productos.map((p) => [p.id, p.precio]))
  const meses = new Map<string, Record<string, number>>()
  for (const m of movs) {
    if (m.tipo !== 'Venta') continue
    const k = m.fecha.slice(0, 7)
    const r = meses.get(k) ?? Object.fromEntries(sucursales.map((s) => [s, 0]))
    if (m.sucursal in r) r[m.sucursal] += -m.cantidad * (precio.get(m.productoId) ?? 0)
    meses.set(k, r)
  }
  return [...meses.entries()].sort().slice(-6).map(([mes, r]) => ({ mes: new Date(mes + '-15').toLocaleDateString('es-EC', { month: 'short' }), ...r }) as { mes: string } & Record<string, number>)
}

/** Ventas de los últimos n días por sucursal (unidades valorizadas a precio). */
export function ventasRecientes(movs: Movimiento[], productos: Producto[], dias = 30) {
  const desde = Date.now() - dias * 864e5, precio = new Map(productos.map((p) => [p.id, p.precio]))
  const r: Record<string, number> = {}
  for (const m of movs) if (m.tipo === 'Venta' && new Date(m.fecha).getTime() > desde) r[m.sucursal] = (r[m.sucursal] ?? 0) - m.cantidad * (precio.get(m.productoId) ?? 0)
  return r
}
