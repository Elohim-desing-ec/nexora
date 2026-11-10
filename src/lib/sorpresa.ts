/** Genera ejercicios aleatorios (reemplazo o depreciación) resueltos paso a paso para practicar la defensa. */
import * as F from './finance'
import { L, money, pct } from './format'

export interface Ejercicio { tipo: string; enunciado: string; pasos: { texto: string; tex?: string }[]; respuesta: string }
const ent = (a: number, b: number, paso = 1) => Math.round((a + Math.random() * (b - a)) / paso) * paso

export function ejercicioReemplazo(): Ejercicio {
  const i = ent(8, 18) / 100
  const d = { vm: ent(1000, 6000, 100), coa: ent(12000, 22000, 100), n: ent(2, 4), s: 0 }
  d.s = ent(0, d.vm * 0.4, 100)
  const r = { P: ent(18000, 40000, 500), coa: ent(5000, 11000, 100), n: ent(4, 8), s: 0 }
  r.s = ent(r.P * 0.05, r.P * 0.25, 100)
  const cd = d.vm * F.AP(i, d.n) - d.s * F.AF(i, d.n) + d.coa
  const cr = r.P * F.AP(i, r.n) - r.s * F.AF(i, r.n) + r.coa
  return {
    tipo: 'Análisis de reemplazo',
    enunciado: `Una empresa evalúa reemplazar su sistema actual. DEFENSOR: valor de mercado hoy ${money(d.vm, 0)}, COA ${money(d.coa, 0)}/año, vida restante ${d.n} años, valor residual ${money(d.s, 0)}. RETADOR: inversión ${money(r.P, 0)}, COA ${money(r.coa, 0)}/año, vida ${r.n} años, valor residual ${money(r.s, 0)}. TMAR = ${pct(i, 0)}. ¿Se debe reemplazar?`,
    pasos: [
      { texto: 'Enfoque del consultor: la inversión del defensor es su valor de mercado actual (el costo original es hundido).' },
      { texto: 'CAUE del defensor:', tex: `CAUE_D = ${L(d.vm, 0)}(A/P,${L(i * 100, 0)}\\%,${d.n}) - ${L(d.s, 0)}(A/F,${L(i * 100, 0)}\\%,${d.n}) + ${L(d.coa, 0)} = ${L(d.vm, 0)}(${L(F.AP(i, d.n), 4)}) - ${L(d.s, 0)}(${L(F.AF(i, d.n), 4)}) + ${L(d.coa, 0)} = ${L(cd)}` },
      { texto: 'CAUE del retador:', tex: `CAUE_R = ${L(r.P, 0)}(${L(F.AP(i, r.n), 4)}) - ${L(r.s, 0)}(${L(F.AF(i, r.n), 4)}) + ${L(r.coa, 0)} = ${L(cr)}` },
      { texto: `Comparación: ${money(cd)} ${cd > cr ? '>' : '<'} ${money(cr)}.` },
    ],
    respuesta: cd > cr ? `REEMPLAZAR: el retador ahorra ${money(cd - cr)} por año equivalente.` : `CONSERVAR: el defensor es ${money(cr - cd)} más barato por año.`,
  }
}

export function ejercicioDepreciacion(): Ejercicio {
  const P = ent(10000, 60000, 500), n = ent(4, 7), S = ent(0, P * 0.2, 100)
  const m = (['LR', 'SDD', 'SDA'] as const)[ent(0, 2)]
  const filas = m === 'LR' ? F.lineaRecta(P, S, n) : m === 'SDD' ? F.saldoDecreciente(P, S, n, 2) : F.sumaDigitos(P, S, n)
  const nombre = { LR: 'línea recta', SDD: 'saldo decreciente doble', SDA: 'suma de los dígitos de los años' }[m]
  const formula = { LR: `D = \\dfrac{${L(P, 0)} - ${L(S, 0)}}{${n}} = ${L(filas[0].dep)}`, SDD: `d = \\dfrac{2}{${n}} = ${L(2 / n, 4)};\; D_t = d\\cdot VL_{t-1},\; VL \\ge ${L(S, 0)}`, SDA: `SDA = \\dfrac{${n}(${n + 1})}{2} = ${(n * (n + 1)) / 2};\; D_t = \\dfrac{${n}-t+1}{${(n * (n + 1)) / 2}}(${L(P - S, 0)})` }[m]
  return {
    tipo: 'Depreciación',
    enunciado: `Un activo cuesta ${money(P, 0)}, tiene vida útil de ${n} años y valor residual de ${money(S, 0)}. Elabore la tabla de depreciación por ${nombre} y calcule el ahorro fiscal del año 1 con impuesto del 25 %.`,
    pasos: [
      { texto: 'Fórmula:', tex: formula },
      ...filas.map((f) => ({ texto: `Año ${f.anio}`, tex: `D_${f.anio} = ${L(f.dep)},\\quad VL_${f.anio} = ${L(f.vl)}` })),
      { texto: 'Ahorro fiscal año 1:', tex: `${L(filas[0].dep)} \\times 0{,}25 = ${L(filas[0].dep * 0.25)}` },
    ],
    respuesta: `Valor en libros final: ${money(filas[filas.length - 1].vl)}. Depreciación total: ${money(P - filas[filas.length - 1].vl)}.`,
  }
}

export const ejercicioAleatorio = () => (Math.random() < 0.5 ? ejercicioReemplazo() : ejercicioDepreciacion())
