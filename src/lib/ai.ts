/** IA simulada en el cliente: pronóstico, punto de reorden y anomalías (estadística clásica). */
import type { Movimiento, Producto } from '../data/base'
import { stockTotal, ventasSemanales } from './inventario'

const media = (x: number[]) => x.reduce((a, b) => a + b, 0) / (x.length || 1)
const desv = (x: number[]) => { const m = media(x); return Math.sqrt(media(x.map((v) => (v - m) ** 2))) }

/** Regresión lineal por mínimos cuadrados: y = a + b·t */
export function regresion(y: number[]) {
  const n = y.length, t = y.map((_, k) => k), mt = media(t), my = media(y)
  const b = t.reduce((s, ti, k) => s + (ti - mt) * (y[k] - my), 0) / (t.reduce((s, ti) => s + (ti - mt) ** 2, 0) || 1)
  return { a: my - b * mt, b, n }
}

/** Pronóstico: tendencia lineal × índice estacional (ciclo de 4 semanas) + promedio móvil de 4. */
export function pronostico(serie: number[], semanasFuturas = 5) {
  const { a, b } = regresion(serie)
  const ciclo = 4, prom = media(serie) || 1
  const idx = Array.from({ length: ciclo }, (_, c) => media(serie.filter((_, k) => k % ciclo === c)) / prom || 1)
  const pm = serie.map((_, k) => (k >= 3 ? media(serie.slice(k - 3, k + 1)) : NaN))
  const futuro = Array.from({ length: semanasFuturas }, (_, h) => { const t = serie.length + h; return Math.max(0, (a + b * t) * idx[t % ciclo]) })
  const dias30 = futuro.slice(0, 4).reduce((s, v) => s + v, 0) + futuro[4] * (2 / 7)
  return { a, b, idx, pm, futuro, dias30, tendencia: b / (prom || 1) }
}

/** Punto de reorden = demanda diaria × lead time + stock de seguridad (z = 1,65 → 95 %). */
export function reorden(p: Producto, movs: Movimiento[], leadDias = 7) {
  const serie = ventasSemanales(movs, p.id)
  const f = pronostico(serie)
  const diaria = f.dias30 / 30
  const ss = 1.65 * (desv(serie) / Math.sqrt(7)) * Math.sqrt(leadDias)
  const rop = Math.ceil(diaria * leadDias + ss)
  const stock = stockTotal(p)
  const nSuc = Math.max(1, Object.keys(p.stock).length) // el máximo es por sucursal
  const sugerido = stock <= rop ? Math.max(0, Math.ceil(p.max * nSuc * 0.9 + f.dias30 * 0.3 - stock)) : 0
  return { serie, f, diaria, ss, rop, stock, sugerido, cobertura: diaria > 0 ? stock / diaria : Infinity }
}

/** Anomalías: movimientos cuyo |z| > umbral respecto al historial del mismo producto y tipo. */
export function anomalias(movs: Movimiento[], umbral = 2.5) {
  const grupos = new Map<string, Movimiento[]>()
  for (const m of movs) if (m.tipo === 'Venta' || m.tipo === 'Merma' || m.tipo === 'Ajuste') {
    const k = `${m.productoId}|${m.sucursal}`; (grupos.get(k) ?? grupos.set(k, []).get(k)!).push(m)
  }
  const out: { m: Movimiento; z: number }[] = []
  for (const g of grupos.values()) {
    const x = g.map((m) => Math.abs(m.cantidad)), mu = media(x), sd = desv(x)
    g.forEach((m, k) => { const z = sd > 0 ? (x[k] - mu) / sd : 0; if (z > umbral || m.tipo === 'Merma') out.push({ m, z }) })
  }
  return out.sort((a, b) => b.m.fecha.localeCompare(a.m.fecha))
}
