/** Construye el "Ver procedimiento" de cada resultado: fórmula general, sustituida (LaTeX), factores e interpretación. */
import * as F from './finance'
import type { Params, MetodoDep } from './finance'
import { L, Lp, money, num, pct } from './format'

export interface Proc {
  titulo: string
  general: string[]
  sustituida: string[]
  factores: { nombre: string; valor: number }[]
  resultado: string
  interpretacion: string
}

const fx = (f: string, i: number, n: number) => `(${f},${L(i * 100, 0)}\\%,${n})`
const fac = (f: F.Factor, i: number, n: number) => ({ nombre: `(${f[0]}/${f[1]}, ${num(i * 100, 0)} %, ${n})`, valor: F.FACTORES[f](i, n) })

export function procCAUE(P: number, vm: number[], coa: number[], i: number, n: number, quien: string): Proc {
  const r = F.caue(P, vm, coa, i, n)
  const terms = coa.slice(0, n).map((c, k) => `${L(c, 0)}(${L(F.PF(i, k + 1), 4)})`)
  const vpCoa = coa.slice(0, n).reduce((s, c, k) => s + c * F.PF(i, k + 1), 0)
  return {
    titulo: `CAUE del ${quien} conservándolo ${n} año(s)`,
    general: ['RC = P\\,(A/P,i,n) - S_n\\,(A/F,i,n)', 'COA_{eq} = \\Big[\\sum_{t=1}^{n} COA_t\\,(P/F,i,t)\\Big](A/P,i,n)', 'CAUE = RC + COA_{eq}'],
    sustituida: [
      `RC = ${L(P)}\\,${fx('A/P', i, n)} - ${L(r.vm)}\\,${fx('A/F', i, n)} = ${L(P)}(${L(F.AP(i, n), 4)}) - ${L(r.vm)}(${L(F.AF(i, n), 4)}) = ${L(r.rc)}`,
      `COA_{eq} = [${terms.join(' + ')}](${L(F.AP(i, n), 4)}) = ${L(vpCoa)}(${L(F.AP(i, n), 4)}) = ${L(r.coaEq)}`,
      `CAUE = ${L(r.rc)} + ${L(r.coaEq)} = \\mathbf{${L(r.caue)}}`,
    ],
    factores: [fac('AP', i, n), fac('AF', i, n), ...coa.slice(0, n).map((_, k) => fac('PF', i, k + 1))],
    resultado: money(r.caue),
    interpretacion: `Conservar el ${quien} ${n} año(s) equivale a pagar ${money(r.caue)} cada año: ${money(r.rc)} por recuperar el capital (pérdida de valor + rendimiento exigido del ${pct(i, 0)}) y ${money(r.coaEq)} de costos de operación equivalentes.`,
  }
}

export function procMarginal(p: Params, t: number): Proc {
  const m = F.costoMarginal(p.defensor.vm0, p.defensor.vm, p.defensor.coa, p.i)[t - 1]
  const prev = t === 1 ? p.defensor.vm0 : p.defensor.vm[t - 2]
  const ret = F.reemplazo(p).ret
  return {
    titulo: `Costo marginal del defensor en el año ${t}`,
    general: ['CM_t = (VM_{t-1} - VM_t) + i\\cdot VM_{t-1} + COA_t'],
    sustituida: [`CM_${t} = (${L(prev, 0)} - ${L(p.defensor.vm[t - 1], 0)}) + ${L(p.i, 2)}(${L(prev, 0)}) + ${L(m.coa, 0)} = \\mathbf{${L(m.cm)}}`],
    factores: [],
    resultado: money(m.cm),
    interpretacion: `Mantener el sistema actual un año más (el año ${t}) cuesta ${money(m.cm)}. Como el CAUE mínimo del retador es ${money(ret.caueMin)}, ${m.cm < ret.caueMin ? 'todavía conviene conservarlo ese año.' : 'ya NO conviene conservarlo: el retador es más barato.'}`,
  }
}

export function procAhorro(p: Params): Proc {
  const a = F.totalActual(p), n = F.totalNuevo(p), P = F.inversion(p)
  return {
    titulo: 'Ahorro anual y recuperación simple',
    general: ['Ahorro = \\sum COA_{actual} - \\sum COA_{NEXORA}', 'PR_{simple} = \\dfrac{P}{Ahorro}'],
    sustituida: [`Ahorro = ${L(a)} - ${L(n)} = ${L(a - n)}`, `PR = \\dfrac{${L(P)}}{${L(a - n)}} = \\mathbf{${L(P / (a - n))}\\text{ años}}`],
    factores: [],
    resultado: `${money(a - n)} / año`,
    interpretacion: `NEXORA reduce los costos anuales un ${pct((a - n) / a, 1)}. Sin considerar el valor del dinero en el tiempo, la inversión se recupera en ${num(P / (a - n))} años.`,
  }
}

export function procVPN(p: Params): Proc {
  const k = F.indicadores(p)
  return {
    titulo: 'Valor presente neto (VPN)',
    general: ['VPN = -P + A\\,(P/A,i,n) + S\\,(P/F,i,n)'],
    sustituida: [`VPN = -${L(k.P)} + ${L(k.A)}(${L(F.PA(p.i, p.n), 4)}) + ${L(p.S)}(${L(F.PF(p.i, p.n), 4)}) = \\mathbf{${L(k.VPN)}}`],
    factores: [fac('PA', p.i, p.n), fac('PF', p.i, p.n)],
    resultado: money(k.VPN),
    interpretacion: k.VPN > 0 ? `El VPN es positivo: además de recuperar la inversión y ganar el ${pct(p.i, 0)} exigido, el proyecto genera ${money(k.VPN)} de riqueza adicional hoy. Se ACEPTA.` : `El VPN es negativo: el proyecto no alcanza la TMAR del ${pct(p.i, 0)}. Se RECHAZA.`,
  }
}

export function procTIR(p: Params): Proc {
  const k = F.indicadores(p)
  return {
    titulo: 'Tasa interna de retorno (TIR) — bisección',
    general: ['0 = -P + A\\,(P/A,TIR,n) + S\\,(P/F,TIR,n)'],
    sustituida: [`0 = -${L(k.P)} + ${L(k.A)}(P/A,TIR,${p.n}) + ${L(p.S)}(P/F,TIR,${p.n}) \\Rightarrow TIR = \\mathbf{${Lp(k.TIR)}}`],
    factores: [{ nombre: `(P/A, TIR, ${p.n})`, valor: F.PA(k.TIR, p.n) }, { nombre: `(P/F, TIR, ${p.n})`, valor: F.PF(k.TIR, p.n) }],
    resultado: pct(k.TIR),
    interpretacion: `Se busca la tasa que hace VPN = 0 partiendo el intervalo a la mitad hasta converger. TIR = ${pct(k.TIR)} ${k.TIR > p.i ? '>' : '<'} TMAR ${pct(p.i, 0)} → el proyecto ${k.TIR > p.i ? 'es rentable' : 'no es rentable'}.`,
  }
}

export function procBC(p: Params): Proc {
  const k = F.indicadores(p)
  return {
    titulo: 'Relación beneficio/costo',
    general: ['B/C = \\dfrac{A\\,(P/A,i,n) + S\\,(P/F,i,n)}{P}'],
    sustituida: [`B/C = \\dfrac{${L(k.A)}(${L(F.PA(p.i, p.n), 4)}) + ${L(p.S)}(${L(F.PF(p.i, p.n), 4)})}{${L(k.P)}} = \\mathbf{${L(k.BC, 4)}}`],
    factores: [fac('PA', p.i, p.n), fac('PF', p.i, p.n)],
    resultado: num(k.BC, 4),
    interpretacion: `Por cada dólar invertido se recuperan ${money(k.BC)} en valor presente. ${k.BC > 1 ? 'B/C > 1 → conviene.' : 'B/C < 1 → no conviene.'}`,
  }
}

export function procRecDesc(p: Params): Proc {
  const k = F.indicadores(p)
  let acum = -k.P
  const pasos = Array.from({ length: p.n }, (_, t) => { const d = k.A * F.PF(p.i, t + 1); acum += d; return `t=${t + 1}: ${L(k.A, 0)}(${L(F.PF(p.i, t + 1), 4)}) = ${L(d)} \\Rightarrow acum = ${L(acum)}` })
  return {
    titulo: 'Periodo de recuperación descontado',
    general: ['\\sum_{t=1}^{PR} A\\,(P/F,i,t) \\ge P'],
    sustituida: [...pasos, `PR_{desc} = \\mathbf{${L(k.recDesc)}\\text{ años}}`],
    factores: Array.from({ length: p.n }, (_, t) => fac('PF', p.i, t + 1)),
    resultado: `${num(k.recDesc)} años`,
    interpretacion: `Considerando el valor del dinero en el tiempo al ${pct(p.i, 0)}, la inversión se recupera en ${num(k.recDesc)} años (vs ${num(k.recSimple)} años sin descontar).`,
  }
}

export function procAhorroMin(p: Params): Proc {
  const k = F.indicadores(p)
  return {
    titulo: 'Ahorro mínimo para que el proyecto sea rentable (VPN = 0)',
    general: ['A_{min} = \\dfrac{P - S\\,(P/F,i,n)}{(P/A,i,n)}'],
    sustituida: [`A_{min} = \\dfrac{${L(k.P)} - ${L(p.S)}(${L(F.PF(p.i, p.n), 4)})}{${L(F.PA(p.i, p.n), 4)}} = \\mathbf{${L(k.ahorroMinimo)}}`],
    factores: [fac('PF', p.i, p.n), fac('PA', p.i, p.n)],
    resultado: money(k.ahorroMinimo),
    interpretacion: `NEXORA debe ahorrar al menos ${money(k.ahorroMinimo)} al año. El ahorro estimado es ${money(k.A)}, es decir, un margen de seguridad del ${pct(1 - k.ahorroMinimo / k.A, 1)}.`,
  }
}

export function procEquilibrio(p: Params): Proc {
  const x = F.equilibrioDefensor(p), ret = F.reemplazo(p).ret
  return {
    titulo: 'Valor de equilibrio del defensor',
    general: ['\\min_n CAUE_{def}(VM_0 = X) = CAUE_{ret}^{min}'],
    sustituida: [`X(A/P,i,n^*) - S_{n^*}(A/F,i,n^*) + COA_{eq} = ${L(ret.caueMin)} \\Rightarrow X = \\mathbf{${L(x)}}`],
    factores: [],
    resultado: money(x),
    interpretacion: x < 0 ? `Aun regalando el sistema actual (VM = $0) es más caro que NEXORA. Solo daría igual si alguien nos PAGARA ${money(-x)} por quedarnos con él: conservarlo no tiene sentido económico.` : `Si el sistema actual valiera ${money(x)} en el mercado, daría igual conservarlo o reemplazarlo. Hoy vale ${money(p.defensor.vm0)}.`,
  }
}

export function procDep(p: Params, m: MetodoDep): Proc {
  const P = F.inversion(p), filas = F.depreciar(p, m), f1 = filas[0]
  const G: Record<MetodoDep, [string, string]> = {
    LR: ['D_t = \\dfrac{P - S}{n}', `D = \\dfrac{${L(P)} - ${L(p.S)}}{${p.n}} = ${L(f1.dep)}`],
    SD: ['D_t = d\\cdot VL_{t-1},\\; d = \\dfrac{f}{n},\\; VL_t \\ge S', `d = \\dfrac{${L(p.factorSD, 2)}}{${p.n}} = ${L(f1.tasa, 4)};\\; D_1 = ${L(f1.tasa, 4)}(${L(P)}) = ${L(f1.dep)}`],
    SDD_LR: ['D_t = \\max\\Big(\\tfrac{2}{n}VL_{t-1},\\; \\dfrac{VL_{t-1}-S}{n-t+1}\\Big)', `D_1 = \\max(${L(2 / p.n, 4)}\\cdot ${L(P)},\\; \\tfrac{${L(P)}-${L(p.S)}}{${p.n}}) = ${L(f1.dep)}`],
    SDA: ['D_t = \\dfrac{n-t+1}{n(n+1)/2}(P-S)', `D_1 = \\dfrac{${p.n}}{${(p.n * (p.n + 1)) / 2}}(${L(P - p.S)}) = ${L(f1.dep)}`],
    MACRS: ['D_t = r_t \\cdot P\\quad(\\text{ignora } S)', `D_1 = ${L(f1.tasa, 4)}(${L(P)}) = ${L(f1.dep)}`],
    UP: ['D_t = \\dfrac{u_t}{\\sum u}(P - S)', `D_1 = \\dfrac{${L(p.unidades[0], 0)}}{${L(p.unidades.slice(0, p.n).reduce((a, b) => a + b, 0), 0)}}(${L(P - p.S)}) = ${L(f1.dep)}`],
  }
  const af = F.ahorroFiscal(filas, p.impuesto, p.i)
  return {
    titulo: `Depreciación — ${F.NOMBRE_DEP[m]}`,
    general: [G[m][0], 'VL_t = P - \\sum_{k=1}^{t} D_k', '\\text{Ahorro fiscal}_t = D_t \\cdot T'],
    sustituida: [G[m][1], ...filas.map((f) => `t=${f.anio}: D=${L(f.dep)},\\; VL=${L(f.vl)},\\; D\\cdot T=${L(f.dep * p.impuesto)}`)],
    factores: filas.map((f) => fac('PF', p.i, f.anio)),
    resultado: `VP ahorro fiscal = ${money(af.vp)}`,
    interpretacion: `Con ${F.NOMBRE_DEP[m]} el valor en libros final es ${money(filas[filas.length - 1].vl)} y el valor presente del ahorro en impuestos es ${money(af.vp)}. Mientras más depreciación se registre al inicio, mayor es este VP.`,
  }
}

export function procFEDI(p: Params): Proc {
  const r = F.fedi(p, p.depMetodo), f1 = r.filas[1]
  return {
    titulo: `Flujo de efectivo después de impuestos (${F.NOMBRE_DEP[p.depMetodo]})`,
    general: ['FEDI_t = A - T(A - D_t)', 'FEDI_n \\mathrel{+}= S - T(S - VL_n)', 'VP = \\sum FEDI_t (P/F,i,t)'],
    sustituida: [`FEDI_1 = ${L(f1.ahorro)} - ${L(p.impuesto, 2)}(${L(f1.ahorro)} - ${L(f1.dep)}) = ${L(f1.fedi)}`, `VP = \\mathbf{${L(r.VP)}},\\quad VA = ${L(r.VP)}(${L(F.AP(p.i, p.n), 4)}) = ${L(r.VA)}`],
    factores: r.filas.slice(1).map((f) => fac('PF', p.i, f.anio)),
    resultado: money(r.VP),
    interpretacion: `Después de pagar el ${pct(p.impuesto, 0)} de impuesto a la renta, el proyecto sigue generando un VP de ${money(r.VP)} (TIR después de impuestos ${pct(r.TIR)}). La depreciación no es salida de dinero, pero reduce el impuesto.`,
  }
}

export function procInflacion(p: Params): Proc {
  const f = F.tmarInflacion(p.i, p.inflacion)
  return {
    titulo: 'TMAR ajustada por inflación',
    general: ['i_f = i + f + i\\cdot f'],
    sustituida: [`i_f = ${L(p.i, 2)} + ${L(p.inflacion, 3)} + ${L(p.i, 2)}(${L(p.inflacion, 3)}) = \\mathbf{${Lp(f)}}`],
    factores: [],
    resultado: pct(f),
    interpretacion: `Si los flujos se expresan en dólares corrientes (con inflación del ${pct(p.inflacion, 1)}), hay que descontarlos al ${pct(f)} en lugar del ${pct(p.i, 0)}.`,
  }
}

export function procEstudio(p: Params, H: number): Proc {
  const e = F.periodoEstudio(p, H)
  return {
    titulo: `Reemplazo en un período de estudio de ${H} años`,
    general: ['VP_k = VM_0 + \\sum_{t=1}^{k} COA^{d}_t(P/F) - VM^d_k(P/F,i,k) + \\big[P + \\sum COA^r_t(P/F) - VM^r_{H-k}(P/F)\\big](P/F,i,k)'],
    sustituida: e.opciones.map((o) => `${o.etiqueta.replace(/ /g, '\\ ')}: VP = ${L(o.vp)}`),
    factores: [fac('AP', p.i, H)],
    resultado: `${e.mejor.etiqueta} · VP ${money(e.mejor.vp)}`,
    interpretacion: `De todas las combinaciones dentro de ${H} años, la de menor costo es "${e.mejor.etiqueta}" con VP = ${money(e.mejor.vp)} (VA = ${money(e.mejor.va)}).`,
  }
}
