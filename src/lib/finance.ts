/**
 * NEXORA · Motor financiero (Ingeniería Económica, Unidad 4).
 * Todas las funciones son PURAS: reciben datos y devuelven resultados, sin efectos.
 * Convención: i en decimal (0.12 = 12 %), n en años, flujos[0] ocurre en t = 0.
 */

// ───────────────────────── Factores de interés compuesto ─────────────────────────
/** (P/F,i,n) = 1/(1+i)^n — trae un valor futuro al presente. */
export const PF = (i: number, n: number) => 1 / Math.pow(1 + i, n)
/** (F/P,i,n) = (1+i)^n — lleva un valor presente al futuro. */
export const FP = (i: number, n: number) => Math.pow(1 + i, n)
/** (A/P,i,n) = i(1+i)^n / ((1+i)^n − 1) — recuperación de capital. */
export const AP = (i: number, n: number) => (i === 0 ? 1 / n : (i * FP(i, n)) / (FP(i, n) - 1))
/** (P/A,i,n) = ((1+i)^n − 1) / (i(1+i)^n) — valor presente de una serie uniforme. */
export const PA = (i: number, n: number) => 1 / AP(i, n)
/** (A/F,i,n) = i / ((1+i)^n − 1) — fondo de amortización. */
export const AF = (i: number, n: number) => (i === 0 ? 1 / n : i / (FP(i, n) - 1))
/** (F/A,i,n) = ((1+i)^n − 1) / i — valor futuro de una serie uniforme. */
export const FA = (i: number, n: number) => 1 / AF(i, n)

export const FACTORES = { PF, FP, AP, PA, AF, FA } as const
export type Factor = keyof typeof FACTORES

// ───────────────────────── Tipos del proyecto ─────────────────────────
export interface Concepto { nombre: string; actual: number; nuevo: number }
export type MetodoDep = 'LR' | 'SD' | 'SDD_LR' | 'SDA' | 'MACRS' | 'UP'

export interface Params {
  i: number
  licencia: number
  implementacion: number
  capacitacion: number
  S: number
  n: number
  impuesto: number
  conceptos: Concepto[]
  defensor: { vm0: number; costoOriginal: number; edad: number; vidaRestante: number; vm: number[]; coa: number[] }
  retador: { vm: number[]; coa: number[] }
  depMetodo: MetodoDep
  factorSD: number
  macrsClase: 3 | 5 | 7
  unidades: number[]
  inflacion: number
  horizonte: number
}

export const inversion = (p: Params) => p.licencia + p.implementacion + p.capacitacion
export const totalActual = (p: Params) => p.conceptos.reduce((s, c) => s + c.actual, 0)
export const totalNuevo = (p: Params) => p.conceptos.reduce((s, c) => s + c.nuevo, 0)
export const ahorroAnual = (p: Params) => totalActual(p) - totalNuevo(p)

// ───────────────────────── Valor presente, TIR, recuperación ─────────────────────────
/** VP de una serie de flujos: Σ F_t (P/F,i,t). */
export const vp = (flujos: number[], i: number) => flujos.reduce((s, f, t) => s + f * PF(i, t), 0)

/** TIR por bisección: tasa que hace VP = 0. Devuelve NaN si no hay cambio de signo. */
export function tir(flujos: number[], lo = -0.99, hi = 10, tol = 1e-9): number {
  let fLo = vp(flujos, lo)
  if (fLo * vp(flujos, hi) > 0) return NaN
  for (let k = 0; k < 300; k++) {
    const mid = (lo + hi) / 2
    const fMid = vp(flujos, mid)
    if (Math.abs(fMid) < tol) return mid
    if (fLo * fMid < 0) hi = mid
    else { lo = mid; fLo = fMid }
  }
  return (lo + hi) / 2
}

/** Periodo de recuperación simple = P / ahorro anual. */
export const recuperacionSimple = (P: number, ahorro: number) => P / ahorro

/** Recuperación descontada (con interpolación lineal). flujos[0] = −P. */
export function recuperacionDescontada(flujos: number[], i: number): number {
  let acum = flujos[0]
  for (let t = 1; t < flujos.length; t++) {
    const d = flujos[t] * PF(i, t)
    if (acum + d >= 0) return t - 1 + -acum / d
    acum += d
  }
  return NaN
}

// ───────────────────────── CAUE y vida útil económica ─────────────────────────
export interface FilaCAUE { n: number; vm: number; coa: number; rc: number; coaEq: number; caue: number }

/**
 * CAUE de conservar un activo n años:
 * RC = P(A/P,i,n) − S_n(A/F,i,n);  COA_eq = [Σ COA_t (P/F,i,t)](A/P,i,n);  CAUE = RC + COA_eq
 */
export function caue(P: number, vm: number[], coa: number[], i: number, n: number): FilaCAUE {
  const S = vm[n - 1]
  const rc = P * AP(i, n) - S * AF(i, n)
  let vpCoa = 0
  for (let t = 1; t <= n; t++) vpCoa += coa[t - 1] * PF(i, t)
  const coaEq = vpCoa * AP(i, n)
  return { n, vm: S, coa: coa[n - 1], rc, coaEq, caue: rc + coaEq }
}

/** Tabla de CAUE para n = 1..N y la vida útil económica (n de CAUE mínimo). */
export function vidaUtilEconomica(P: number, vm: number[], coa: number[], i: number) {
  const N = Math.min(vm.length, coa.length)
  const filas = Array.from({ length: N }, (_, k) => caue(P, vm, coa, i, k + 1))
  const min = filas.reduce((a, b) => (b.caue < a.caue ? b : a))
  return { filas, nOpt: min.n, caueMin: min.caue }
}

/** Costo marginal del defensor en el año t: (VM_{t−1} − VM_t) + i·VM_{t−1} + COA_t. */
export function costoMarginal(vm0: number, vm: number[], coa: number[], i: number) {
  return vm.map((v, k) => {
    const prev = k === 0 ? vm0 : vm[k - 1]
    const perdidaValor = prev - v
    const interes = i * prev
    return { anio: k + 1, perdidaValor, interes, coa: coa[k], cm: perdidaValor + interes + coa[k] }
  })
}

// ───────────────────────── Depreciación ─────────────────────────
export interface FilaDep { anio: number; tasa: number; dep: number; acum: number; vl: number }

function armar(P: number, deps: number[], tasas: number[]): FilaDep[] {
  let acum = 0
  return deps.map((d, k) => { acum += d; return { anio: k + 1, tasa: tasas[k], dep: d, acum, vl: P - acum } })
}

/** Línea recta: D = (P − S)/n. */
export function lineaRecta(P: number, S: number, n: number): FilaDep[] {
  const d = (P - S) / n
  return armar(P, Array(n).fill(d), Array(n).fill(1 / n))
}

/** Saldo decreciente con tasa d = factor/n; nunca baja del valor residual S. */
export function saldoDecreciente(P: number, S: number, n: number, factor = 2): FilaDep[] {
  const d = factor / n
  let vl = P
  const deps: number[] = []
  for (let t = 1; t <= n; t++) {
    const dep = Math.max(0, Math.min(d * vl, vl - S))
    deps.push(dep); vl -= dep
  }
  return armar(P, deps, Array(n).fill(d))
}

/** Saldo decreciente doble con cambio a línea recta cuando la LR sobre el saldo es mayor. */
export function sddConCambio(P: number, S: number, n: number): { filas: FilaDep[]; anioCambio: number | null } {
  const d = 2 / n
  let vl = P
  let cambio: number | null = null
  const deps: number[] = []
  const tasas: number[] = []
  for (let t = 1; t <= n; t++) {
    const ddb = Math.max(0, Math.min(d * vl, vl - S))
    const lr = (vl - S) / (n - t + 1)
    if (cambio === null && lr > ddb + 1e-9) cambio = t
    const dep = cambio !== null ? lr : ddb
    deps.push(dep); tasas.push(cambio !== null ? 1 / (n - t + 1) : d); vl -= dep
  }
  return { filas: armar(P, deps, tasas), anioCambio: cambio }
}

/** Suma de los dígitos de los años: D_t = (n − t + 1)/SDA · (P − S), SDA = n(n+1)/2. */
export function sumaDigitos(P: number, S: number, n: number): FilaDep[] {
  const sda = (n * (n + 1)) / 2
  const tasas = Array.from({ length: n }, (_, k) => (n - k) / sda)
  return armar(P, tasas.map((f) => f * (P - S)), tasas)
}

/** Porcentajes MACRS (convención de medio año). MACRS ignora el valor residual. */
export const MACRS: Record<3 | 5 | 7, number[]> = {
  3: [0.3333, 0.4445, 0.1481, 0.0741],
  5: [0.2, 0.32, 0.192, 0.1152, 0.1152, 0.0576],
  7: [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446],
}
export const macrs = (P: number, clase: 3 | 5 | 7): FilaDep[] => armar(P, MACRS[clase].map((r) => r * P), MACRS[clase])

/** Unidades de producción: D_t = (P − S)·u_t / Σu. */
export function unidadesProduccion(P: number, S: number, unidades: number[]): FilaDep[] {
  const tot = unidades.reduce((a, b) => a + b, 0)
  const tasas = unidades.map((u) => u / tot)
  return armar(P, tasas.map((f) => f * (P - S)), tasas)
}

export const NOMBRE_DEP: Record<MetodoDep, string> = {
  LR: 'Línea recta', SD: 'Saldo decreciente', SDD_LR: 'SDD con cambio a LR', SDA: 'Suma de dígitos', MACRS: 'MACRS', UP: 'Unidades de producción',
}

export function depreciar(p: Params, m: MetodoDep): FilaDep[] {
  const P = inversion(p)
  switch (m) {
    case 'LR': return lineaRecta(P, p.S, p.n)
    case 'SD': return saldoDecreciente(P, p.S, p.n, p.factorSD)
    case 'SDD_LR': return sddConCambio(P, p.S, p.n).filas
    case 'SDA': return sumaDigitos(P, p.S, p.n)
    case 'MACRS': return macrs(P, p.macrsClase)
    case 'UP': return unidadesProduccion(P, p.S, p.unidades.slice(0, p.n))
  }
}

/** Ahorro fiscal por depreciación: D_t·T, y su VP. */
export function ahorroFiscal(filas: FilaDep[], T: number, i: number) {
  const anual = filas.map((f) => f.dep * T)
  return { anual, vp: anual.reduce((s, a, k) => s + a * PF(i, k + 1), 0) }
}

// ───────────────────────── Después de impuestos ─────────────────────────
export interface FilaFEDI { anio: number; ahorro: number; dep: number; renta: number; impuesto: number; residual: number; fedi: number }

/** FEDI del retador: ahorro − T(ahorro − D); en el año n se suma S − T(S − VL_n). */
export function fedi(p: Params, m: MetodoDep) {
  const P = inversion(p)
  const A = ahorroAnual(p)
  const deps = depreciar(p, m).map((f) => f.dep)
  const filas: FilaFEDI[] = [{ anio: 0, ahorro: 0, dep: 0, renta: 0, impuesto: 0, residual: 0, fedi: -P }]
  let acum = 0
  for (let t = 1; t <= p.n; t++) {
    const dep = deps[t - 1] ?? 0
    acum += dep
    const renta = A - dep
    let impuesto = renta * p.impuesto
    let residual = 0
    if (t === p.n) { residual = p.S; impuesto += (p.S - (P - acum)) * p.impuesto }
    filas.push({ anio: t, ahorro: A, dep, renta, impuesto, residual, fedi: A - impuesto + residual })
  }
  const flujos = filas.map((f) => f.fedi)
  const VP = vp(flujos, p.i)
  return { filas, VP, VA: VP * AP(p.i, p.n), TIR: tir(flujos) }
}

// ───────────────────────── Indicadores del proyecto ─────────────────────────
/** Flujos antes de impuestos: −P, ahorro constante n años, + S en el año n. */
export const flujosProyecto = (P: number, A: number, S: number, n: number) =>
  Array.from({ length: n + 1 }, (_, t) => (t === 0 ? -P : A + (t === n ? S : 0)))

export const vpnProyecto = (P: number, A: number, S: number, i: number, n: number) =>
  -P + A * PA(i, n) + S * PF(i, n)

export function indicadores(p: Params) {
  const P = inversion(p), A = ahorroAnual(p)
  const flujos = flujosProyecto(P, A, p.S, p.n)
  const VPN = vpnProyecto(P, A, p.S, p.i, p.n)
  const vpBeneficios = A * PA(p.i, p.n) + p.S * PF(p.i, p.n)
  return {
    P, A, flujos, VPN,
    VAE: VPN * AP(p.i, p.n),
    TIR: tir(flujos),
    BC: vpBeneficios / P,
    recSimple: recuperacionSimple(P, A),
    recDesc: recuperacionDescontada(flujosProyecto(P, A, 0, p.n), p.i),
    ahorroMinimo: (P - p.S * PF(p.i, p.n)) / PA(p.i, p.n),
  }
}

// ───────────────────────── Período de estudio ─────────────────────────
export interface OpcionEstudio { k: number; m: number; vp: number; va: number; etiqueta: string }

/** Evalúa: conservar el defensor k años y luego el retador m = H − k años. Menor VP gana. */
export function periodoEstudio(p: Params, H: number) {
  const P = inversion(p), d = p.defensor, r = p.retador
  const opciones: OpcionEstudio[] = []
  for (let k = 0; k <= Math.min(d.vidaRestante, H); k++) {
    const m = H - k
    if (m > r.vm.length) continue
    let costo = 0
    if (k > 0) {
      costo += d.vm0
      for (let t = 1; t <= k; t++) costo += d.coa[t - 1] * PF(p.i, t)
      costo -= d.vm[k - 1] * PF(p.i, k)
    }
    if (m > 0) {
      let c = P
      for (let t = 1; t <= m; t++) c += r.coa[t - 1] * PF(p.i, t)
      c -= r.vm[m - 1] * PF(p.i, m)
      costo += c * PF(p.i, k)
    }
    const etiqueta = k === 0 ? `Retador ${m} años` : m === 0 ? `Defensor ${k} años` : `Defensor ${k} + Retador ${m}`
    opciones.push({ k, m, vp: costo, va: costo * AP(p.i, H), etiqueta })
  }
  const mejor = opciones.reduce((a, b) => (b.vp < a.vp ? b : a))
  return { opciones, mejor }
}

// ───────────────────────── Análisis de reemplazo completo ─────────────────────────
export function reemplazo(p: Params) {
  const d = p.defensor
  const def = vidaUtilEconomica(d.vm0, d.vm.slice(0, d.vidaRestante), d.coa.slice(0, d.vidaRestante), p.i)
  const ret = vidaUtilEconomica(inversion(p), p.retador.vm, p.retador.coa, p.i)
  const marg = costoMarginal(d.vm0, d.vm.slice(0, d.vidaRestante), d.coa.slice(0, d.vidaRestante), p.i)
  // Regla del costo marginal: conservar mientras CM_t < CAUE mínimo del retador.
  let anioReemplazo = 0
  for (const f of marg) { if (f.cm < ret.caueMin) anioReemplazo = f.anio; else break }
  const reemplazarAhora = def.caueMin > ret.caueMin
  return { def, ret, marg, anioReemplazo, reemplazarAhora, veredicto: reemplazarAhora ? 'REEMPLAZAR AHORA' : 'CONSERVAR' as const }
}

/** Valor de mercado del defensor que iguala su CAUE mínimo con el del retador (bisección). */
export function equilibrioDefensor(p: Params) {
  const objetivo = reemplazo(p).ret.caueMin
  const d = p.defensor
  const f = (x: number) => vidaUtilEconomica(x, d.vm.slice(0, d.vidaRestante), d.coa.slice(0, d.vidaRestante), p.i).caueMin - objetivo
  let lo = -1e7, hi = 1e7
  for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m }
  return (lo + hi) / 2
}

// ───────────────────────── Sensibilidad e inflación ─────────────────────────
export function tornado(p: Params, delta = 0.2) {
  const P = inversion(p), A = ahorroAnual(p), act = totalActual(p), nue = totalNuevo(p)
  const v = (P_: number, A_: number, S_: number) => vpnProyecto(P_, A_, S_, p.i, p.n)
  const base = v(P, A, p.S)
  const filas = [
    { variable: 'Inversión P', bajo: v(P * (1 - delta), A, p.S), alto: v(P * (1 + delta), A, p.S) },
    { variable: 'Ahorro anual', bajo: v(P, A * (1 - delta), p.S), alto: v(P, A * (1 + delta), p.S) },
    { variable: 'COA NEXORA', bajo: v(P, act - nue * (1 - delta), p.S), alto: v(P, act - nue * (1 + delta), p.S) },
    { variable: 'Valor residual S', bajo: v(P, A, p.S * (1 - delta)), alto: v(P, A, p.S * (1 + delta)) },
  ].map((f) => ({ ...f, rango: Math.abs(f.alto - f.bajo) }))
  return { base, filas: filas.sort((a, b) => b.rango - a.rango) }
}

/** TMAR ajustada por inflación: i_f = i + f + i·f. */
export const tmarInflacion = (i: number, f: number) => i + f + i * f

/** Clona Params aplicando cambios (para escenarios "¿qué pasa si…?"). */
export const conCambios = (p: Params, c: Partial<Params>): Params => ({ ...structuredClone(p), ...c })
