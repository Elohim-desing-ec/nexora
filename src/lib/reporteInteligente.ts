/**
 * Reporte ejecutivo inteligente: analiza automáticamente los datos de la empresa y genera
 * hallazgos con acciones recomendadas (reducir pérdidas, automatizar compras, liberar capital).
 */
import type { Movimiento, Orden, Producto, Proveedor, Sucursal } from '../data/base'
import type { Params } from './finance'
import * as F from './finance'
import { anomalias, reorden } from './ai'
import { enQuiebre, stockTotal, valorInventario } from './inventario'
import { money, num, pct } from './format'

export type Nivel = 'critico' | 'alerta' | 'oportunidad' | 'ok'
export interface Hallazgo { nivel: Nivel; titulo: string; detalle: string; accion: string }
export interface Datos { productos: Producto[]; movimientos: Movimiento[]; ordenes: Orden[]; sucursales: Sucursal[]; proveedores: Proveedor[]; p: Params; empresa: string }

const dias = (iso: string) => (Date.now() - new Date(iso).getTime()) / 864e5

export function analizarNegocio(d: Datos) {
  const { productos: ps, movimientos: ms } = d
  const valor = valorInventario(ps), precio = new Map(ps.map((p) => [p.id, p.precio]))
  const ventas30 = ms.filter((m) => m.tipo === 'Venta' && dias(m.fecha) <= 30)
  const ingresos30 = ventas30.reduce((a, m) => a - m.cantidad * (precio.get(m.productoId) ?? 0), 0)
  const cmv30 = ventas30.reduce((a, m) => a - m.cantidad * m.costoUnit, 0)
  const mermas90 = ms.filter((m) => m.tipo === 'Merma' && dias(m.fecha) <= 90).reduce((a, m) => a - m.cantidad * m.costoUnit, 0)
  const cmv90 = ms.filter((m) => m.tipo === 'Venta' && dias(m.fecha) <= 90).reduce((a, m) => a - m.cantidad * m.costoUnit, 0)
  const quiebres = ps.filter((p) => enQuiebre(p))
  const sugerencias = ps.map((p) => ({ p, r: reorden(p, ms) })).filter((x) => x.r.sugerido > 0)
  const costoCompra = sugerencias.reduce((a, x) => a + x.r.sugerido * x.p.costo, 0)
  const sobrestock = ps.map((p) => ({ p, exceso: stockTotal(p) - p.max * Math.max(1, Object.keys(p.stock).length) })).filter((x) => x.exceso > 0)
  const capitalExceso = sobrestock.reduce((a, x) => a + x.exceso * x.p.costo, 0)
  const vendidos90 = new Set(ms.filter((m) => m.tipo === 'Venta' && dias(m.fecha) <= 90).map((m) => m.productoId))
  const sinMov = ps.filter((p) => stockTotal(p) > 0 && !vendidos90.has(p.id) && ms.some((m) => m.productoId === p.id && dias(m.fecha) > 30))
  const porVencer = ps.filter((p) => stockTotal(p) > 0 && -dias(p.vence) < 60)
  const anom = anomalias(ms).filter((a) => dias(a.m.fecha) <= 30 && a.z > 2.5)
  const pendientes = d.ordenes.filter((o) => o.estado !== 'Recibida')
  const provBajos = d.proveedores.filter((p) => p.cumplimiento < 80)
  const K = F.indicadores(d.p), R = F.reemplazo(d.p)

  const porSucursal = d.sucursales.map((s) => {
    const v = ms.filter((m) => m.sucursal === s.id && m.tipo === 'Venta' && dias(m.fecha) <= 30).reduce((a, m) => a - m.cantidad * (precio.get(m.productoId) ?? 0), 0)
    return { s, valor: valorInventario(ps, s.id), ventas30: v, quiebres: ps.filter((p) => s.id in p.stock && enQuiebre(p, s.id)).length }
  }).sort((a, b) => b.ventas30 - a.ventas30 || b.valor - a.valor)
  const vend = new Map<string, number>()
  ventas30.forEach((m) => vend.set(m.productoId, (vend.get(m.productoId) ?? 0) - m.cantidad))
  const top = [...vend.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, u]) => ({ p: ps.find((x) => x.id === id), u }))

  const H: Hallazgo[] = []
  if (quiebres.length) H.push({ nivel: 'critico', titulo: `${quiebres.length} producto(s) en quiebre de stock`, detalle: quiebres.slice(0, 5).map((p) => p.nombre).join(', ') + (quiebres.length > 5 ? '…' : ''), accion: 'Generar órdenes de compra desde IA NEXORA para evitar ventas perdidas.' })
  if (sugerencias.length) H.push({ nivel: 'alerta', titulo: `${sugerencias.length} producto(s) alcanzaron su punto de reorden`, detalle: `Compra sugerida por la IA: ${money(costoCompra, 0)}.`, accion: 'Aprobar las órdenes sugeridas (Compras) para mantener el nivel de servicio.' })
  if (mermas90 > 0) H.push({ nivel: mermas90 > cmv90 * 0.02 ? 'critico' : 'alerta', titulo: `Mermas de ${money(mermas90, 0)} en 90 días`, detalle: `Equivalen al ${pct(cmv90 ? mermas90 / cmv90 : 0, 1)} del costo de ventas.`, accion: 'Revisar las causas en Trazabilidad (daños, vencimientos, robos) y reforzar controles.' })
  if (anom.length) H.push({ nivel: 'alerta', titulo: `${anom.length} movimiento(s) atípico(s) en 30 días`, detalle: 'Detectados con z-score > 2,5 respecto al historial de cada producto.', accion: 'Auditar estos movimientos: pueden ser errores de registro o pérdidas.' })
  if (capitalExceso > 0) H.push({ nivel: 'oportunidad', titulo: `${money(capitalExceso, 0)} de capital inmovilizado en sobrestock`, detalle: `${sobrestock.length} producto(s) superan su stock máximo.`, accion: 'Transferir excedentes a sucursales con quiebre o pausar compras de estos productos.' })
  if (sinMov.length) H.push({ nivel: 'oportunidad', titulo: `${sinMov.length} producto(s) sin ventas en 90 días`, detalle: `Valor detenido: ${money(sinMov.reduce((a, p) => a + stockTotal(p) * p.costo, 0), 0)}.`, accion: 'Evaluar promociones, devolución al proveedor o liquidación.' })
  if (porVencer.length) H.push({ nivel: 'alerta', titulo: `${porVencer.length} producto(s) vencen en menos de 60 días`, detalle: porVencer.slice(0, 5).map((p) => p.nombre).join(', '), accion: 'Priorizar su venta (FEFO: primero en vencer, primero en salir).' })
  if (pendientes.length) H.push({ nivel: 'alerta', titulo: `${pendientes.length} orden(es) de compra pendientes`, detalle: pendientes.map((o) => `${o.id} (${o.estado})`).join(', '), accion: 'Aprobar o recibir para que el stock se actualice.' })
  if (provBajos.length) H.push({ nivel: 'alerta', titulo: `${provBajos.length} proveedor(es) con cumplimiento menor al 80 %`, detalle: provBajos.map((p) => p.nombre).join(', '), accion: 'Negociar plazos o buscar proveedores alternativos.' })
  H.push({ nivel: R.reemplazarAhora && K.VPN > 0 ? 'ok' : 'alerta', titulo: `Impacto de NEXORA: ahorro de ${money(K.A, 0)} por año`, detalle: `VPN ${money(K.VPN, 0)} · TIR ${pct(K.TIR, 1)} · recuperación ${num(K.recSimple)} años · veredicto: ${R.veredicto}.`, accion: 'Mantener el seguimiento del ahorro real frente al estimado.' })
  if (H.length === 1 && ps.length) H.unshift({ nivel: 'ok', titulo: 'Operación saludable', detalle: 'No se detectaron quiebres, mermas relevantes ni anomalías.', accion: 'Continuar con el registro diario de movimientos.' })

  const criticos = H.filter((h) => h.nivel === 'critico').length
  const resumen = ps.length
    ? `${d.empresa || 'La empresa'} opera ${d.sucursales.length} sucursal(es) en ${new Set(d.sucursales.map((s) => s.pais)).size} país(es) con un inventario de ${money(valor, 0)} en ${ps.length} productos. En los últimos 30 días vendió ${money(ingresos30, 0)} con un margen bruto de ${money(ingresos30 - cmv30, 0)} (${pct(ingresos30 ? (ingresos30 - cmv30) / ingresos30 : 0, 1)}) y una rotación anualizada de ${num((cmv30 * 12) / Math.max(1, valor), 1)} veces. ${criticos ? `Hay ${criticos} situación(es) crítica(s) que requieren acción inmediata.` : 'No hay situaciones críticas.'} ${sugerencias.length ? `La IA recomienda reponer ${sugerencias.length} producto(s) por ${money(costoCompra, 0)}.` : ''}`
    : 'Aún no hay productos registrados: el reporte se completará automáticamente a medida que se registren inventario y ventas.'
  const kpis = [['Inventario', money(valor, 0)], ['Ventas 30 días', money(ingresos30, 0)], ['Margen bruto 30 días', money(ingresos30 - cmv30, 0)], ['Rotación anual', `${num((cmv30 * 12) / Math.max(1, valor), 1)}×`], ['Quiebres', String(quiebres.length)], ['Mermas 90 días', money(mermas90, 0)], ['Compra sugerida', money(costoCompra, 0)], ['Ahorro NEXORA / año', money(K.A, 0)]] as const
  return { resumen, kpis, hallazgos: H, porSucursal, top }
}
