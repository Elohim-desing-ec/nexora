/**
 * Modo Defensa: banco de preguntas + motor de coincidencia por palabras clave y sinónimos.
 * Cada respuesta se CALCULA con los parámetros actuales (no es texto fijo).
 */
import * as F from './finance'
import type { Params } from './finance'
import { money, num, pct } from './format'
import * as PR from './procedimientos'
import type { Proc } from './procedimientos'

export interface Respuesta { texto: string; proc?: Proc; tab?: string }
export interface Pregunta { id: string; cat: string; pregunta: string; claves: string[]; responder: (p: Params, nums: number[]) => Respuesta }

// ───────────── Normalización ─────────────
const FRASES: [RegExp, string][] = [
  [/valor (presente|actual) neto|\bvan\b/g, 'vpn'], [/tasa interna( de (retorno|rendimiento))?/g, 'tir'], [/beneficio ?\/? ?costo|\bb ?\/ ?c\b/g, 'bc'],
  [/costo anual (uniforme )?equivalente|\bcae\b|\bvae\b|valor anual equivalente/g, 'caue'], [/costos? hundidos?/g, 'hundido'],
  [/vida util economica|vida economica/g, 'vidaeconomica'], [/vida (util )?fisica/g, 'vidafisica'], [/vida (util )?(fiscal|contable|tributaria)/g, 'vidafiscal'], [/vida util/g, 'vidautil'],
  [/valor (en|de) libros/g, 'libros'], [/valor (de )?mercado/g, 'mercado'], [/valor (residual|de salvamento|de rescate)/g, 'residual'],
  [/linea recta/g, 'lineart'], [/saldo(s)? decreciente(s)?/g, 'saldodec'], [/(suma de (los )?digitos)|\bsyd\b/g, 'sumadigitos'],
  [/costo marginal/g, 'marginal'], [/costo de oportunidad/g, 'oportunidad'], [/periodo de estudio|horizonte de (planeacion|analisis)/g, 'horizonte'],
  [/(periodo|tiempo) de (recuperacion|repago)|payback/g, 'recuperacion'], [/recuperacion (del|de) capital/g, 'rc'], [/despues de impuestos?|fedi/g, 'fedi'],
  [/punto de equilibrio/g, 'equilibrio'], [/sistema (actual|viejo|antiguo|existente|de escritorio)/g, 'defensor'], [/sistema nuevo|nuevo sistema/g, 'retador'],
  [/(propio|mi|su) dinero|de mi bolsillo/g, 'propiodinero'], [/(forma|curva) (de |en |una )?u\b|\bu\b/g, 'curvau'], [/sin internet|se cae (el )?internet|fuera de linea|offline/g, 'offline'],
  [/costo original|precio original|lo que costo/g, 'original'], [/tasa minima( atractiva)?( de rendimiento)?/g, 'tmar'], [/la mitad|50 ?%/g, 'mitad'],
]
const SINONIMOS: Record<string, string> = {
  actual: 'defensor', viejo: 'defensor', antiguo: 'defensor', existente: 'defensor', legado: 'defensor',
  nuevo: 'retador', nexora: 'retador', propuesto: 'retador', reemplazante: 'retador',
  deprecia: 'depreciacion', depreciar: 'depreciacion', depreciado: 'depreciacion', depreciacione: 'depreciacion',
  reemplazar: 'reemplazo', reemplazamo: 'reemplazo', cambiar: 'reemplazo', sustituir: 'reemplazo', renovar: 'reemplazo', reemplaza: 'reemplazo',
  vende: 'vender', venta: 'vender', vendemo: 'vender', vendiera: 'vender', vendo: 'vender', vale: 'vender', valiera: 'vender',
  sube: 'subir', aumenta: 'subir', incrementa: 'subir', subiera: 'subir', aumentan: 'subir', suben: 'subir', crece: 'subir', alza: 'subir',
  baja: 'bajar', disminuye: 'bajar', reduce: 'bajar', cae: 'bajar',
  pasa: 'pasa', pasaria: 'pasa', ocurre: 'pasa', sucede: 'pasa', ocurriria: 'pasa', cambia: 'pasa',
  impuesto: 'impuesto', tributario: 'impuesto', fiscal: 'impuesto', renta: 'impuesto',
  invertir: 'inversion', inversione: 'inversion', cuesta: 'inversion', costara: 'inversion',
  conviene: 'convenir', conveniente: 'convenir', mejor: 'convenir', recomienda: 'convenir', recomendable: 'convenir',
  anio: 'ano', anos: 'ano', año: 'ano', años: 'ano', periodo: 'ano',
  plazo: 'horizonte', interes: 'tmar', descuento: 'tmar', rentabilidad: 'tir', rentable: 'convenir',
  riesgo: 'riesgo', peligro: 'riesgo', amenaza: 'riesgo', competencia: 'erp', sap: 'erp', odoo: 'erp', oracle: 'erp',
  seguridad: 'dato', protege: 'dato', protegen: 'dato', respaldo: 'dato', cobra: 'cobro', precio: 'cobro', suscripcion: 'cobro', licencia: 'cobro',
  cliente: 'cliente', mercado_objetivo: 'cliente', sri: 'sri', ecuador: 'sri', ley: 'ley', permite: 'ley', permitido: 'ley', acepta: 'ley', autoriza: 'ley', normativa: 'ley', legal: 'ley', norma: 'ley',
  pronostico: 'ia', inteligencia: 'ia', artificial: 'ia', prediccion: 'ia', vencer: 'vencer',
}
const STOP = new Set('que es el la los las de del un una unos y o a en por para con se si lo le al mi me nos su sus cual cuales como cuando cuanto cuanta este esta ese esa hay ser son fue muy mas tan ya no sí si nuestro tiene tener debe deberia hace hacer seria eso esto entre sobre solo'.split(' '))

export function normalizar(s: string) {
  let t = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!,;:()"']/g, ' ')
  for (const [re, rep] of FRASES) t = t.replace(re, ` ${rep} `)
  return t
}
const raiz = (w: string) => (w.length > 5 && w.endsWith('es') ? w.slice(0, -2) : w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w)
export function tokens(s: string): string[] {
  return normalizar(s).split(/[^a-z0-9%]+/).filter((w) => w && !STOP.has(w) && !/^\d/.test(w)).map((w) => SINONIMOS[w] ?? SINONIMOS[raiz(w)] ?? raiz(w))
}
/** Extrae números en formato es: "35.000", "$ 5.000", "20 %", "1,5". */
export function numeros(s: string): number[] {
  return [...s.matchAll(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?/g)].map((m) => parseFloat(m[1].replace(/\./g, '') + (m[2] ? '.' + m[2] : '')))
}

// ───────────── Utilidades de respuesta ─────────────
const ctx = (p: Params) => ({ R: F.reemplazo(p), K: F.indicadores(p), P: F.inversion(p) })
const sim = (p: Params, mod: (q: Params) => void) => { const q = structuredClone(p); mod(q); return { q, ...ctx(q) } }
const tasa = (v: number | undefined, def: number) => (v === undefined ? def : v > 1 ? v / 100 : v)
const resumen = (R: ReturnType<typeof F.reemplazo>, K: ReturnType<typeof F.indicadores>) =>
  `• CAUE mínimo defensor: ${money(R.def.caueMin)} (n = ${R.def.nOpt})\n• CAUE mínimo retador: ${money(R.ret.caueMin)} (n = ${R.ret.nOpt})\n• VPN: ${money(K.VPN)} · TIR: ${pct(K.TIR)}\n• Veredicto: ${R.veredicto}`

const Q = (id: string, cat: string, pregunta: string, claves: string, responder: Pregunta['responder']): Pregunta => ({ id, cat, pregunta, claves: claves.split(' '), responder })

export const PREGUNTAS: Pregunta[] = [
  // ───────── CONCEPTOS ─────────
  Q('def-ret', 'Conceptos', '¿Qué es defensor y qué es retador?', 'defensor retador', (p) => { const { R, P } = ctx(p); return { tab: 'reemplazo', texto: `El DEFENSOR es el activo que la empresa ya tiene (su software de inventario de ${p.defensor.edad} años). El RETADOR es la alternativa que lo reemplazaría (NEXORA).\nEn nuestro caso: defensor vale hoy ${money(p.defensor.vm0)} y su CAUE mínimo es ${money(R.def.caueMin)}; el retador cuesta ${money(P)} y su CAUE mínimo es ${money(R.ret.caueMin)}.`, proc: PR.procCAUE(P, p.retador.vm, p.retador.coa, p.i, R.ret.nOpt, 'retador') } }),
  Q('hundido', 'Conceptos', '¿Qué es un costo hundido?', 'hundido', (p) => ({ tab: 'enfoques', texto: `Es un costo que ya ocurrió y no se puede recuperar, sin importar la decisión que tomemos. Los ${money(p.defensor.costoOriginal)} que costó el sistema actual hace ${p.defensor.edad} años son costo hundido: NO entran al análisis. Solo importa lo que vale HOY en el mercado (${money(p.defensor.vm0)}), porque eso es lo que sacrificamos si lo conservamos.` })),
  Q('vida-tipos', 'Conceptos', '¿Qué es la vida útil económica y en qué se diferencia de la vida física y fiscal?', 'vidaeconomica vidafisica vidafiscal vidautil', (p) => { const { R } = ctx(p); return { tab: 'vida', texto: `• Vida útil ECONÓMICA: número de años que minimiza el CAUE (para NEXORA = ${R.ret.nOpt} años, CAUE ${money(R.ret.caueMin)}).\n• Vida FÍSICA: tiempo que el activo puede seguir funcionando (el retador puede operar 8 años o más).\n• Vida FISCAL: plazo que permite la ley para depreciar (aquí ${p.n} años).\nLa decisión de reemplazo se toma con la vida económica.` } }),
  Q('vm-libros', 'Conceptos', '¿Qué diferencia hay entre valor de mercado y valor en libros?', 'mercado libros', (p) => { const lr = F.lineaRecta(p.defensor.costoOriginal, 0, 10); return { tab: 'enfoques', texto: `• Valor de MERCADO: lo que alguien pagaría hoy por el activo (defensor: ${money(p.defensor.vm0)}).\n• Valor en LIBROS: costo original menos depreciación acumulada; es un dato contable (ej.: ${money(p.defensor.costoOriginal)} depreciado en 10 años por línea recta tendría hoy ${money(lr[p.defensor.edad - 1].vl)}).\nPara reemplazo se usa el valor de mercado; el de libros solo importa para impuestos.` } }),
  Q('caue', 'Conceptos', '¿Qué es el CAUE?', 'caue', (p) => { const { R, P } = ctx(p); return { tab: 'vida', texto: `Costo Anual Uniforme Equivalente: convierte todos los costos (inversión, operación y valor residual) en una cuota anual constante equivalente a la TMAR. Permite comparar activos con vidas distintas.\nNEXORA: ${money(R.ret.caueMin)}/año a ${R.ret.nOpt} años; sistema actual: ${money(R.def.caueMin)}/año.`, proc: PR.procCAUE(P, p.retador.vm, p.retador.coa, p.i, R.ret.nOpt, 'retador') } }),
  Q('rc', 'Conceptos', '¿Qué es la recuperación de capital (RC)?', 'rc', (p) => { const { R, P } = ctx(p); const f = R.ret.filas[R.ret.nOpt - 1]; return { tab: 'vida', texto: `Es el costo anual equivalente de poseer el activo: recupera la inversión y el rendimiento exigido descontando el valor residual. RC = P(A/P,i,n) − S(A/F,i,n).\nNEXORA a ${f.n} años: RC = ${money(f.rc)}/año.`, proc: PR.procCAUE(P, p.retador.vm, p.retador.coa, p.i, f.n, 'retador') } }),
  Q('tmar', 'Conceptos', '¿Qué es la TMAR y por qué 12 %?', 'tmar', (p) => ({ tab: 'sensibilidad', texto: `TMAR = Tasa Mínima Atractiva de Rendimiento: lo mínimo que la empresa exige ganar por invertir su dinero (su costo de oportunidad). Usamos ${pct(p.i, 0)} porque cubre el costo de financiamiento de la empresa (préstamos productivos en Ecuador ~9-11 %), la inflación (~${pct(p.inflacion, 0)}) y una prima por riesgo de un proyecto tecnológico. En la pestaña Sensibilidad se ve que el proyecto sigue siendo rentable hasta una TMAR del ${pct(F.indicadores(p).TIR)} (la TIR).` })),
  Q('depreciacion', 'Conceptos', '¿Qué es la depreciación y por qué un software se deprecia?', 'depreciacion', (p) => ({ tab: 'depreciacion', texto: `Es la distribución del costo de un activo a lo largo de su vida útil, reconociendo la pérdida de valor por uso, desgaste u obsolescencia. Un software (activo intangible) pierde valor por obsolescencia tecnológica, nuevas versiones y fin de soporte; contablemente se amortiza. NEXORA: ${money(F.inversion(p))} en ${p.n} años hasta ${money(p.S)}.`, proc: PR.procDep(p, 'LR') })),
  Q('residual', 'Conceptos', '¿Qué es el valor residual?', 'residual', (p) => ({ tab: 'depreciacion', texto: `Es el valor estimado que tendrá el activo al final de su vida útil (venta, reventa de licencias, reutilización). NEXORA: ${money(p.S)} al año ${p.n}. Reduce el costo: resta en la recuperación de capital −S(A/F,i,n).` })),
  Q('dep-flujo', 'Conceptos', '¿La depreciación es un flujo de efectivo?', 'depreciacion flujo', (p) => { const af = F.ahorroFiscal(F.depreciar(p, p.depMetodo), p.impuesto, p.i); return { tab: 'impuestos', texto: `NO. La depreciación es un gasto contable que no implica salida de dinero. Pero SÍ afecta el flujo indirectamente: al reducir la utilidad gravable, reduce el impuesto pagado (escudo fiscal = D × T). Con ${F.NOMBRE_DEP[p.depMetodo]} el ahorro fiscal vale ${money(af.vp)} en valor presente.`, proc: PR.procFEDI(p) } }),
  Q('marginal', 'Conceptos', '¿Qué es el costo marginal?', 'marginal', (p) => ({ tab: 'reemplazo', texto: `Es el costo de conservar el activo UN año adicional: pérdida de valor de mercado de ese año + interés sobre el valor al inicio del año + costo de operación. Año 1 del defensor: ${money(F.reemplazo(p).marg[0].cm)}.`, proc: PR.procMarginal(p, 1) })),
  Q('oportunidad', 'Conceptos', '¿Qué es el costo de oportunidad?', 'oportunidad', (p) => ({ tab: 'enfoques', texto: `Es el beneficio que se deja de recibir por elegir una alternativa. Si conservamos el sistema actual, renunciamos a venderlo en ${money(p.defensor.vm0)}: ese valor se trata como la "inversión" del defensor. También la TMAR (${pct(p.i, 0)}) es un costo de oportunidad del dinero.` })),
  Q('consultor', 'Conceptos', '¿Qué es el enfoque del consultor o externo?', 'consultor externo enfoque', (p) => ({ tab: 'enfoques', texto: `Se analiza como si un tercero sin activos tuviera que elegir entre COMPRAR el defensor usado a su valor de mercado (${money(p.defensor.vm0)}) o comprar el retador nuevo (${money(F.inversion(p))}). Así se evita sumar costos hundidos y se tratan ambos con la misma lógica.` })),
  Q('factores', 'Conceptos', '¿Qué significan los factores (A/P), (P/F) y (A/F)?', 'factor', (p) => ({ tab: 'indicadores', texto: `Con i = ${pct(p.i, 0)} y n = ${p.n}:\n• (P/F) = 1/(1+i)^n = ${num(F.PF(p.i, p.n), 4)} → trae un valor futuro al presente.\n• (A/P) = i(1+i)^n/((1+i)^n−1) = ${num(F.AP(p.i, p.n), 4)} → reparte un presente en cuotas anuales.\n• (A/F) = i/((1+i)^n−1) = ${num(F.AF(p.i, p.n), 4)} → cuota anual para acumular un futuro.\n• (P/A) = ${num(F.PA(p.i, p.n), 4)}, (F/P) = ${num(F.FP(p.i, p.n), 4)}, (F/A) = ${num(F.FA(p.i, p.n), 4)}.` })),

  // ───────── REEMPLAZO ─────────
  Q('ahora', 'Reemplazo', '¿Por qué reemplazar ahora y no en 2 años?', 'reemplazo ahora ano esperar', (p) => { const { R } = ctx(p); return { tab: 'reemplazo', texto: `Porque el costo marginal de conservar el sistema actual ya en el año 1 (${money(R.marg[0].cm)}) supera el CAUE mínimo de NEXORA (${money(R.ret.caueMin)}), y sigue creciendo: año 2 = ${money(R.marg[1]?.cm ?? NaN)}. Esperar 2 años cuesta de más ≈ ${money(R.marg.slice(0, 2).reduce((s, m) => s + m.cm - R.ret.caueMin, 0))} (sin descontar).`, proc: PR.procMarginal(p, 1) } }),
  Q('vende-0', 'Reemplazo', '¿Qué pasa si el sistema actual se vende en $0?', 'pasa defensor vender', (p, n) => { const v = n[0] ?? 0; const s = sim(p, (q) => { q.defensor.vm0 = v }); return { tab: 'reemplazo', texto: `Con el defensor valorado en ${money(v)}:\n${resumen(s.R, s.K)}\n${v < p.defensor.vm0 ? 'Al bajar su valor de mercado, conservarlo parece "más barato" (menor costo de oportunidad), pero aun así' : 'Al subir su valor, conservarlo es aún más caro porque renunciamos a más dinero; por eso'} el veredicto es ${s.R.veredicto}. Valor de equilibrio: ${money(F.equilibrioDefensor(p))}.`, proc: PR.procCAUE(v, s.q.defensor.vm, s.q.defensor.coa, p.i, s.R.def.nOpt, 'defensor') } }),
  Q('vende-5000', 'Reemplazo', '¿Qué pasa si el sistema actual se vende en $5.000?', 'pasa defensor vender 5000', (p, n) => porId('vende-0').responder(p, n.length ? n : [5000])),
  Q('tmar-20', 'Reemplazo', '¿Qué pasa si la TMAR sube a 20 %?', 'pasa tmar subir', (p, n) => { const i = tasa(n[0], 0.2); const s = sim(p, (q) => { q.i = i }); return { tab: 'sensibilidad', texto: `Con TMAR = ${pct(i, 0)} (antes ${pct(p.i, 0)}):\n${resumen(s.R, s.K)}\nUna TMAR mayor castiga más la inversión inicial, por eso el CAUE del retador sube; ${s.K.VPN > 0 ? 'aun así el proyecto sigue siendo rentable porque la TIR (' + pct(s.K.TIR) + ') es mayor.' : 'el proyecto deja de ser rentable.'}`, proc: PR.procVPN(s.q) } }),
  Q('costos-30', 'Reemplazo', '¿Qué pasa si los costos del nuevo sistema suben 30 %?', 'pasa retador subir coa', (p, n) => { const f = 1 + tasa(n[0], 0.3); const s = sim(p, (q) => { q.retador.coa = q.retador.coa.map((c) => c * f); q.conceptos.forEach((c) => (c.nuevo *= f)) }); return { tab: 'sensibilidad', texto: `Si los costos de operación de NEXORA suben ${pct(f - 1, 0)}:\n• Ahorro anual: ${money(s.K.A)}\n${resumen(s.R, s.K)}`, proc: PR.procCAUE(s.P, s.q.retador.vm, s.q.retador.coa, p.i, s.R.ret.nOpt, 'retador') } }),
  Q('hasta-anio', 'Reemplazo', '¿Hasta qué año conviene mantener el sistema actual?', 'ano mantener defensor conservar hasta', (p) => { const { R } = ctx(p); return { tab: 'reemplazo', texto: R.anioReemplazo === 0 ? `Ninguno: ya en el año 1 el costo marginal (${money(R.marg[0].cm)}) supera el CAUE mínimo del retador (${money(R.ret.caueMin)}). Se debe reemplazar AHORA.` : `Conviene mantenerlo hasta el año ${R.anioReemplazo}, mientras su costo marginal sea menor que ${money(R.ret.caueMin)}.`, proc: PR.procMarginal(p, Math.max(1, R.anioReemplazo)) } }),
  Q('horizonte-3', 'Reemplazo', '¿Qué pasa si el horizonte es de solo 3 años?', 'pasa horizonte ano', (p, n) => { const H = Math.min(8, Math.max(1, Math.round(n[0] ?? 3))); const e = F.periodoEstudio(p, H); return { tab: 'estudio', texto: `Con un período de estudio de ${H} años se evalúan ${e.opciones.length} combinaciones. La mejor: "${e.mejor.etiqueta}" con VP = ${money(e.mejor.vp)} (VA ${money(e.mejor.va)}).`, proc: PR.procEstudio(p, H) } }),
  Q('inversion-35000', 'Reemplazo', '¿Qué pasa si la inversión es $35.000?', 'pasa inversion', (p, n) => { const v = n[0] ?? 35000; const f = v / F.inversion(p); const s = sim(p, (q) => { q.licencia *= f; q.implementacion *= f; q.capacitacion *= f }); return { tab: 'indicadores', texto: `Con inversión P = ${money(v)}:\n${resumen(s.R, s.K)}\n• Recuperación simple: ${num(s.K.recSimple)} años`, proc: PR.procVPN(s.q) } }),
  Q('ahorro-min', 'Reemplazo', '¿Cuál es el ahorro mínimo para que convenga?', 'ahorro minimo', (p) => ({ tab: 'sensibilidad', texto: `El ahorro anual mínimo para VPN = 0 es ${money(F.indicadores(p).ahorroMinimo)}; el estimado es ${money(F.ahorroAnual(p))}.`, proc: PR.procAhorroMin(p) })),
  Q('veredicto', 'Reemplazo', '¿Conviene reemplazar el sistema? ¿Cuál es el veredicto?', 'convenir reemplazo veredicto decision', (p) => { const { R, K } = ctx(p); return { tab: 'reemplazo', texto: `${R.veredicto}.\n${resumen(R, K)}\nRegla: si CAUE mín. defensor > CAUE mín. retador, se reemplaza.` } }),
  Q('caue-def', 'Reemplazo', '¿Cuánto es el CAUE del defensor?', 'caue defensor', (p) => { const { R } = ctx(p); return { tab: 'reemplazo', texto: `CAUE del defensor por años: ${R.def.filas.map((f) => `n=${f.n}: ${money(f.caue)}`).join(' · ')}. Mínimo ${money(R.def.caueMin)} en n = ${R.def.nOpt}.`, proc: PR.procCAUE(p.defensor.vm0, p.defensor.vm, p.defensor.coa, p.i, R.def.nOpt, 'defensor') } }),
  Q('caue-ret', 'Reemplazo', '¿Cuánto es el CAUE del retador (NEXORA)?', 'caue retador', (p) => { const { R, P } = ctx(p); return { tab: 'vida', texto: `CAUE mínimo de NEXORA: ${money(R.ret.caueMin)} a n = ${R.ret.nOpt} años.`, proc: PR.procCAUE(P, p.retador.vm, p.retador.coa, p.i, R.ret.nOpt, 'retador') } }),
  Q('equilibrio', 'Reemplazo', '¿Cuál es el valor de equilibrio del defensor?', 'equilibrio defensor mercado igual', (p) => ({ tab: 'sensibilidad', texto: `Es el valor de mercado que haría indiferente conservar o reemplazar: ${money(F.equilibrioDefensor(p))}.`, proc: PR.procEquilibrio(p) })),
  Q('original', 'Reemplazo', '¿Por qué no se consideran los $15.000 que costó el sistema actual?', 'original hundido defensor considerar', (p) => porId('hundido').responder(p, [])),

  // ───────── VIDA ÚTIL ─────────
  Q('por-que-5', 'Vida útil económica', '¿Por qué la vida útil económica es 5 años?', 'vidaeconomica ano', (p) => { const { R, P } = ctx(p); const f = R.ret.filas; const k = R.ret.nOpt - 1; return { tab: 'vida', texto: `Porque en n = ${R.ret.nOpt} el CAUE es mínimo (${money(f[k].caue)}). Antes, la RC es alta (la inversión se reparte en pocos años); después, el COA equivalente crece más rápido de lo que baja la RC${f[k + 1] ? ` (n=${k + 2}: ${money(f[k + 1].caue)})` : ''}.`, proc: PR.procCAUE(P, p.retador.vm, p.retador.coa, p.i, R.ret.nOpt, 'retador') } }),
  Q('anio-6', 'Vida útil económica', '¿Qué pasa en el año 6?', 'pasa ano 6 sexto', (p, n) => { const { R, P } = ctx(p); const t = Math.min(8, Math.round(n[0] ?? 6)); const f = R.ret.filas[t - 1]; return { tab: 'vida', texto: `En el año ${t} el COA salta a ${money(f.coa)} y el CAUE es ${money(f.caue)}, ${f.caue > R.ret.caueMin ? `${money(f.caue - R.ret.caueMin)} más que el mínimo: ya pasó la vida económica.` : 'es el mínimo.'}`, proc: PR.procCAUE(P, p.retador.vm, p.retador.coa, p.i, t, 'retador') } }),
  Q('curva-u', 'Vida útil económica', '¿Por qué la curva del CAUE tiene forma de U?', 'curvau', (p) => { const { R } = ctx(p); return { tab: 'vida', texto: `Suma de dos curvas opuestas: la RC (decreciente, de ${money(R.ret.filas[0].rc)} a ${money(R.ret.filas[R.ret.filas.length - 1].rc)}) y el COA equivalente (creciente, de ${money(R.ret.filas[0].coaEq)} a ${money(R.ret.filas[R.ret.filas.length - 1].coaEq)}). Su suma baja, toca un mínimo (n = ${R.ret.nOpt}) y sube: forma de U.` } }),
  Q('vida-def', 'Vida útil económica', '¿Cuál es la vida útil económica del sistema actual?', 'vidaeconomica defensor', (p) => { const { R } = ctx(p); return { tab: 'reemplazo', texto: `${R.def.nOpt} año(s), con CAUE ${money(R.def.caueMin)}. Un activo viejo con costos crecientes suele tener vida económica de 1 año.`, proc: PR.procCAUE(p.defensor.vm0, p.defensor.vm, p.defensor.coa, p.i, R.def.nOpt, 'defensor') } }),
  Q('vida-coincide', 'Vida útil económica', '¿La vida útil económica coincide con la fiscal?', 'vidaeconomica vidafiscal coincide', (p) => ({ tab: 'vida', texto: `En este caso la vida económica (${F.reemplazo(p).ret.nOpt} años) ${F.reemplazo(p).ret.nOpt === p.n ? 'coincide' : 'no coincide'} con la fiscal (${p.n} años), pero son conceptos distintos: la fiscal la fija la ley y la económica sale de minimizar el CAUE.` })),

  // ───────── DEPRECIACIÓN ─────────
  Q('mejor-metodo', 'Depreciación', '¿Qué método de depreciación conviene más y por qué?', 'depreciacion metodo convenir', (p) => { const ms: F.MetodoDep[] = ['LR', 'SD', 'SDD_LR', 'SDA', 'MACRS']; const v = ms.map((m) => ({ m, vp: F.ahorroFiscal(F.depreciar(p, m), p.impuesto, p.i).vp })).sort((a, b) => b.vp - a.vp); return { tab: 'depreciacion', texto: `Fiscalmente conviene el que da el MAYOR VP del ahorro en impuestos:\n${v.map((x) => `• ${F.NOMBRE_DEP[x.m]}: ${money(x.vp)}`).join('\n')}\nGana ${F.NOMBRE_DEP[v[0].m]}, porque deprecia más en los primeros años y el dinero ahorrado antes vale más.`, proc: PR.procDep(p, v[0].m) } }),
  Q('sd-residual', 'Depreciación', '¿Por qué el saldo decreciente no llega exactamente al valor residual?', 'saldodec residual llega', (p) => { const t = F.saldoDecreciente(F.inversion(p), 0, p.n, p.factorSD); return { tab: 'depreciacion', texto: `Porque aplica un porcentaje fijo sobre un saldo que va bajando: matemáticamente nunca llega a cero ni a un valor exacto. Sin tope, el VL final sería ${money(t[p.n - 1].vl)}. Por eso (1) se limita para no bajar del residual ${money(p.S)} o (2) se cambia a línea recta.`, proc: PR.procDep(p, 'SD') } }),
  Q('cambio-lr', 'Depreciación', '¿Cuándo conviene cambiar de saldo decreciente a línea recta?', 'reemplazo lineart saldodec', (p) => { const r = F.sddConCambio(F.inversion(p), p.S, p.n); return { tab: 'depreciacion', texto: `Se cambia el primer año en que la línea recta sobre el saldo restante, (VL − S)/(años restantes), es mayor que la depreciación por SDD. ${r.anioCambio ? `Aquí ocurre en el año ${r.anioCambio}.` : `Con S = ${money(p.S)} el cambio NO ocurre: el SDD llega al residual antes (tope en el año 4).`}`, proc: PR.procDep(p, 'SDD_LR') } }),
  Q('mas-impuestos', 'Depreciación', '¿Qué método permite deducir más impuestos al inicio?', 'depreciacion impuesto inicio deducir', (p) => { const P = F.inversion(p); const m = [['SDD', F.saldoDecreciente(P, p.S, p.n, 2)[0].dep], ['SDA', F.sumaDigitos(P, p.S, p.n)[0].dep], ['MACRS', F.macrs(P, p.macrsClase)[0].dep], ['LR', F.lineaRecta(P, p.S, p.n)[0].dep]] as const; return { tab: 'depreciacion', texto: `Depreciación del año 1: ${m.map(([k, v]) => `${k} ${money(v)}`).join(' · ')}. El Saldo Decreciente Doble deduce más al inicio (ahorro fiscal año 1 = ${money(m[0][1] * p.impuesto)}). MACRS arranca menor por la convención de medio año.` } }),
  Q('vida-3', 'Depreciación', '¿Cómo cambia todo si la vida útil es 3 años?', 'pasa vidautil vidafiscal ano depreciacion', (p, n) => { const v = Math.max(1, Math.min(8, Math.round(n[0] ?? 3))); const s = sim(p, (q) => { q.n = v }); return { tab: 'depreciacion', texto: `Con n = ${v} años: LR = ${money((s.P - p.S) / v)}/año; SDD año 1 = ${money(F.saldoDecreciente(s.P, p.S, v)[0].dep)}.\n• VPN (${v} años): ${money(s.K.VPN)} · TIR ${pct(s.K.TIR)}\n• Recuperación descontada: ${num(s.K.recDesc)} años\n• VP después de impuestos: ${money(F.fedi(s.q, p.depMetodo).VP)}`, proc: PR.procVPN(s.q) } }),
  Q('sri', 'Depreciación', '¿Qué método permite el SRI en Ecuador para software?', 'sri ley', () => ({ tab: 'depreciacion', texto: `NOTA INFORMATIVA: en Ecuador el método usual para efectos tributarios es LÍNEA RECTA (Reglamento a la LORTI, art. 28: equipos de cómputo y software 33 % anual). Los métodos acelerados (SDD, SDA, MACRS) se usan aquí para análisis gerencial y comparación; MACRS es la norma de EE. UU. Verifique la norma vigente con un asesor tributario.` })),
  Q('macrs', 'Depreciación', '¿Qué es MACRS y por qué dura un año más?', 'macrs', (p) => ({ tab: 'depreciacion', texto: `Sistema Modificado de Recuperación Acelerada de Costos (EE. UU.). Usa porcentajes fijos, ignora el valor residual y aplica convención de MEDIO AÑO: el primer y último año solo se deprecia medio año, por eso la clase de ${p.macrsClase} años se reparte en ${p.macrsClase + 1} años.`, proc: PR.procDep(p, 'MACRS') })),
  Q('lr', 'Depreciación', '¿Cuánto se deprecia por año en línea recta?', 'lineart depreciacion', (p) => ({ tab: 'depreciacion', texto: `D = (P − S)/n = ${money((F.inversion(p) - p.S) / p.n)} cada año.`, proc: PR.procDep(p, 'LR') })),
  Q('sda', 'Depreciación', '¿Cómo funciona la suma de los dígitos de los años?', 'sumadigitos', (p) => ({ tab: 'depreciacion', texto: `Se suma 1+2+…+n = ${(p.n * (p.n + 1)) / 2}; cada año se deprecia (años restantes)/${(p.n * (p.n + 1)) / 2} de (P − S). Es acelerado pero termina exactamente en el valor residual.`, proc: PR.procDep(p, 'SDA') })),
  Q('escudo', 'Depreciación', '¿Qué es el ahorro o escudo fiscal por depreciación?', 'escudo ahorro impuesto depreciacion', (p) => ({ tab: 'depreciacion', texto: `Es el impuesto que se deja de pagar gracias a la depreciación: D × T. Con ${F.NOMBRE_DEP[p.depMetodo]} y T = ${pct(p.impuesto, 0)}, su VP es ${money(F.ahorroFiscal(F.depreciar(p, p.depMetodo), p.impuesto, p.i).vp)}.`, proc: PR.procDep(p, p.depMetodo) })),

  // ───────── FINANCIERAS ─────────
  Q('vpn', 'Financieras', '¿Cuál es el VPN del proyecto?', 'vpn', (p) => ({ tab: 'indicadores', texto: `VPN = ${money(F.indicadores(p).VPN)}.`, proc: PR.procVPN(p) })),
  Q('tir', 'Financieras', '¿Cuál es la TIR y cómo se calcula?', 'tir', (p) => ({ tab: 'indicadores', texto: `TIR = ${pct(F.indicadores(p).TIR)} frente a TMAR ${pct(p.i, 0)}.`, proc: PR.procTIR(p) })),
  Q('bc', 'Financieras', '¿Cuál es la relación beneficio/costo?', 'bc', (p) => ({ tab: 'indicadores', texto: `B/C = ${num(F.indicadores(p).BC, 4)}.`, proc: PR.procBC(p) })),
  Q('recuperacion', 'Financieras', '¿En cuánto tiempo se recupera la inversión?', 'recuperacion inversion tiempo', (p) => { const k = F.indicadores(p); return { tab: 'comparacion', texto: `Simple: ${num(k.recSimple)} años. Descontado al ${pct(p.i, 0)}: ${num(k.recDesc)} años.`, proc: PR.procAhorro(p) } }),
  Q('rec-desc', 'Financieras', '¿Qué es el periodo de recuperación descontado?', 'recuperacion descontado', (p) => ({ tab: 'indicadores', texto: `Es el tiempo para recuperar la inversión sumando los ahorros traídos a valor presente. Aquí: ${num(F.indicadores(p).recDesc)} años.`, proc: PR.procRecDesc(p) })),
  Q('riesgos', 'Financieras', '¿Qué riesgos tiene el proyecto?', 'riesgo', (p) => { const t = F.tornado(p); return { tab: 'sensibilidad', texto: `1) Que el ahorro real sea menor al estimado (variable más sensible: ${t.filas[0].variable}). 2) Sobrecostos de implementación. 3) Resistencia al cambio del personal. 4) Dependencia de internet (mitigado con modo offline). 5) Subida de la TMAR.\nColchón: el ahorro puede caer hasta ${money(F.indicadores(p).ahorroMinimo)} (−${pct(1 - F.indicadores(p).ahorroMinimo / F.ahorroAnual(p), 0)}) y aún ser rentable.` } }),
  Q('ahorro-mitad', 'Financieras', '¿Qué pasa si el ahorro es solo la mitad?', 'pasa ahorro mitad', (p) => { const s = sim(p, (q) => { q.conceptos.forEach((c) => (c.nuevo = c.nuevo + (c.actual - c.nuevo) / 2)) }); return { tab: 'sensibilidad', texto: `Con ahorro de ${money(s.K.A)}/año: VPN ${money(s.K.VPN)}, TIR ${pct(s.K.TIR)}, recuperación ${num(s.K.recSimple)} años. ${s.K.VPN > 0 ? 'Sigue siendo rentable.' : 'Ya no es rentable.'}`, proc: PR.procVPN(s.q) } }),
  Q('vae', 'Financieras', '¿Qué es el VAE del proyecto?', 'vae anual equivalente', (p) => ({ tab: 'indicadores', texto: `Valor Anual Equivalente = VPN × (A/P,i,n) = ${money(F.indicadores(p).VAE)} por año.` })),
  Q('fedi', 'Financieras', '¿Cómo queda el análisis después de impuestos?', 'fedi impuesto', (p) => ({ tab: 'impuestos', texto: `VP después de impuestos = ${money(F.fedi(p, p.depMetodo).VP)}.`, proc: PR.procFEDI(p) })),
  Q('inflacion', 'Financieras', '¿Cómo afecta la inflación?', 'inflacion', (p) => ({ tab: 'inflacion', texto: `TMAR ajustada = ${pct(F.tmarInflacion(p.i, p.inflacion))}.`, proc: PR.procInflacion(p) })),
  Q('sensible', 'Financieras', '¿Qué variable es la más sensible?', 'sensibilidad variable sensible tornado', (p) => { const t = F.tornado(p); return { tab: 'sensibilidad', texto: `Con ±20 %: ${t.filas.map((f) => `${f.variable} (rango ${money(f.rango)})`).join(' > ')}. La más crítica es ${t.filas[0].variable}.` } }),

  // ───────── COMERCIALES ─────────
  Q('erp', 'Comerciales', '¿Por qué NEXORA es mejor que SAP, Odoo u otro ERP?', 'erp convenir', () => ({ texto: 'SAP Business One cuesta USD 50.000-150.000 en implementación y meses de consultoría; Odoo exige módulos pagados e integrador. NEXORA está enfocado en inventario multi-sucursal con IA (pronóstico, reorden, anomalías), se implementa en semanas, funciona en navegador y tablet, y su costo total cabe en el presupuesto de una pyme ($24.500).' })),
  Q('clientes', 'Comerciales', '¿Quiénes son sus clientes?', 'cliente', () => ({ texto: 'Cualquier empresa que maneje inventario, en cualquier país y de cualquier tamaño: distribuidoras, cadenas de retail, farmacias, ferreterías, industrias y operadores logísticos, desde una sola tienda hasta redes multinacionales. NEXORA maneja sucursales ilimitadas, varias monedas de referencia y datos reales de ubicación.' })),
  Q('cobro', 'Comerciales', '¿Cómo se cobra: licencia o suscripción?', 'cobro', (p) => ({ texto: `Modelo híbrido: licencia perpetua (${money(p.licencia)}) + implementación + soporte anual (${money(p.conceptos[2].nuevo)}), que es lo analizado. Alternativa SaaS: suscripción mensual por sucursal, que convierte la inversión en gasto operativo.` })),
  Q('offline', 'Comerciales', '¿Qué pasa si se cae el internet?', 'offline', () => ({ texto: 'NEXORA guarda los datos localmente (modo offline) y sigue registrando ventas y movimientos; al volver la conexión sincroniza. Esto explica la reducción del costo por "caídas del sistema".' })),
  Q('datos', 'Comerciales', '¿Cómo se protegen los datos?', 'dato', () => ({ texto: 'Acceso por roles (Gerente, Bodega, Finanzas, Auditor), bitácora de auditoría de cada acción (quién, cuándo, dónde), cifrado TLS en tránsito, respaldos diarios automáticos y cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador.' })),
  Q('ia', 'Comerciales', '¿Cómo funciona la inteligencia artificial de NEXORA?', 'ia', () => ({ texto: 'Pronóstico de demanda a 30 días (regresión lineal + índice estacional + promedio móvil), punto de reorden con stock de seguridad (z = 1,65) y detección de anomalías con z-score sobre movimientos (mermas o ventas atípicas).' })),
  Q('propio', 'Comerciales', '¿Lo compraría con su propio dinero?', 'propiodinero comprar', (p) => { const { R, K } = ctx(p); return { tab: 'recomendacion', texto: `${K.VPN > 0 && R.reemplazarAhora ? 'SÍ.' : 'Con estos datos, NO.'} ${resumen(R, K)}\n• Recuperación en ${num(K.recDesc)} años descontados, B/C = ${num(K.BC, 2)}.` } }),
  Q('que-es', 'Comerciales', '¿Qué es NEXORA?', 'retador plataforma sistema', () => ({ texto: 'NEXORA — Intelligent Operations Suite: plataforma web de gestión de operaciones e inventario multi-sucursal con IA, compras, trazabilidad, reportes y un módulo de análisis económico.' })),
]

// ───────────── Motor de búsqueda ─────────────
export const porId = (id: string) => PREGUNTAS.find((q) => q.id === id)!

export interface Coincidencia { pregunta: Pregunta; score: number }

const DF = new Map<string, number>()
const peso_ = (c: string) => 1 + Math.log(PREGUNTAS.length / (DF.get(c) || 1))
function initDF() { if (DF.size) return; PREGUNTAS.forEach((q) => new Set(q.claves).forEach((c) => DF.set(c, (DF.get(c) ?? 0) + 1))) }

export function buscar(q: string, top = 5): Coincidencia[] {
  initDF()
  const tq = new Set(tokens(q))
  if (!tq.size) return []
  const nums = numeros(q)
  // condicional ("y si…", "si fuera…") → pregunta de escenario
  if (/\b(si|fuera|fuese|seria|subiera|bajara)\b/.test(normalizar(q))) tq.add('pasa')
  return PREGUNTAS.map((pregunta) => {
    const claves = pregunta.claves
    const ok = (c: string) => tq.has(c) || (/^\d+$/.test(c) && nums.includes(+c))
    const hit = claves.filter(ok).length
    // claves raras pesan más (IDF): "sri" distingue más que "depreciacion"
    const peso = claves.reduce((s, c) => s + (ok(c) ? peso_(c) : -0.3 * peso_(c)), 0)
    const propias = new Set(tokens(pregunta.pregunta))
    const solape = [...tq].filter((t) => propias.has(t)).length
    const score = peso + solape + (hit === claves.length ? 1 : 0)
    return { pregunta, score }
  }).filter((c) => c.score > 1).sort((a, b) => b.score - a.score).slice(0, top)
}

export function responder(q: string, p: Params) {
  const m = buscar(q)
  if (!m.length) return null
  return { ...m[0], respuesta: m[0].pregunta.responder(p, numeros(q)), alternativas: m.slice(1) }
}
