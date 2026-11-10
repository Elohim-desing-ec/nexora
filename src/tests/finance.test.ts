import { describe, it, expect } from 'vitest'
import * as F from '../lib/finance'
import { PROYECTO as p } from '../data/proyecto'

const cerca = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(0.01)

describe('Factores financieros', () => {
  it('valores de tabla i=12 %, n=5', () => {
    expect(F.PF(0.12, 5)).toBeCloseTo(0.5674, 4)
    expect(F.FP(0.12, 5)).toBeCloseTo(1.7623, 4)
    expect(F.AP(0.12, 5)).toBeCloseTo(0.2774, 4)
    expect(F.PA(0.12, 5)).toBeCloseTo(3.6048, 4)
    expect(F.AF(0.12, 5)).toBeCloseTo(0.1574, 4)
    expect(F.FA(0.12, 5)).toBeCloseTo(6.3528, 4)
  })
  it('relaciones: A/P = A/F + i', () => cerca(F.AP(0.12, 7), F.AF(0.12, 7) + 0.12))
})

describe('Análisis de reemplazo', () => {
  const r = F.reemplazo(p)
  it('CAUE retador n=1..8 y vida útil económica = 5', () => {
    ;[18640.0, 16224.91, 15221.79, 14643.09, 14347.94, 14457.86, 14735.6, 15165.89].forEach((v, k) => cerca(r.ret.filas[k].caue, v))
    expect(r.ret.nOpt).toBe(5)
  })
  it('CAUE defensor n=1..4 y veredicto REEMPLAZAR AHORA', () => {
    ;[20840.0, 21455.09, 22234.17, 23092.41].forEach((v, k) => cerca(r.def.filas[k].caue, v))
    expect(r.def.nOpt).toBe(1)
    cerca(r.def.caueMin, 20840)
    expect(r.veredicto).toBe('REEMPLAZAR AHORA')
    expect(r.anioReemplazo).toBe(0)
  })
  it('Costo marginal del defensor año 1 = 20840', () => cerca(r.marg[0].cm, 20840))
})

describe('Indicadores', () => {
  const k = F.indicadores(p)
  it('ahorro y recuperación simple', () => {
    expect(k.A).toBe(12600)
    expect(k.recSimple).toBeCloseTo(1.94, 2)
  })
  it('VPN = 23473.60 y TIR ≈ 44,59 %', () => {
    cerca(k.VPN, 23473.6)
    expect(k.TIR * 100).toBeCloseTo(44.59, 1)
  })
})

describe('Depreciación', () => {
  const P = 24500, S = 4500, n = 5
  it('Línea recta = 4000', () => F.lineaRecta(P, S, n).forEach((f) => cerca(f.dep, 4000)))
  it('Saldo decreciente doble', () => {
    const t = F.saldoDecreciente(P, S, n, 2)
    ;[9800, 5880, 3528, 792, 0].forEach((v, k) => cerca(t[k].dep, v))
    ;[14700, 8820, 5292, 4500, 4500].forEach((v, k) => cerca(t[k].vl, v))
  })
  it('Saldo decreciente 150 %', () => {
    const t = F.saldoDecreciente(P, S, n, 1.5)
    ;[7350, 5145, 3601.5, 2521.05, 1382.45].forEach((v, k) => cerca(t[k].dep, v))
    cerca(t[4].vl, 4500)
  })
  it('Suma de dígitos', () => {
    const t = F.sumaDigitos(P, S, n)
    ;[6666.67, 5333.33, 4000, 2666.67, 1333.33].forEach((v, k) => cerca(t[k].dep, v))
    cerca(t[4].vl, 4500)
  })
  it('MACRS 5 años', () => {
    const t = F.macrs(P, 5)
    ;[4900, 7840, 4704, 2822.4, 2822.4, 1411.2].forEach((v, k) => cerca(t[k].dep, v))
  })
})

describe('Otros', () => {
  it('período de estudio elige la menor VP', () => {
    const e = F.periodoEstudio(p, 5)
    expect(e.mejor.vp).toBe(Math.min(...e.opciones.map((o) => o.vp)))
  })
  it('valor de equilibrio del defensor iguala CAUE', () => {
    const x = F.equilibrioDefensor(p)
    const q = F.conCambios(p, {}); q.defensor.vm0 = x
    cerca(F.reemplazo(q).def.caueMin, F.reemplazo(p).ret.caueMin)
  })
})
