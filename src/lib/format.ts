/** Símbolo de la moneda de la empresa (se configura en Configuración → Empresa). */
let SIMBOLO = '$'
export const setMoneda = (simbolo: string) => { SIMBOLO = simbolo || '$' }
export const simboloMoneda = () => SIMBOLO
const nf = (d: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d })
/** $ 1.234,56 (o el símbolo de la moneda de la empresa) */
export const money = (v: number, d = 2) => (Number.isFinite(v) ? `${v < 0 ? '−' : ''}${SIMBOLO} ${nf(d).format(Math.abs(v))}` : '—')
export const num = (v: number, d = 2) => (Number.isFinite(v) ? nf(d).format(v) : '—')
export const pct = (v: number, d = 2) => (Number.isFinite(v) ? `${nf(d).format(v * 100)} %` : '—')
/** Número para LaTeX con coma decimal: 24.500{,}00 */
export const L = (v: number, d = 2) => num(v, d).replace(',', '{,}')
export const Lp = (v: number, d = 2) => `${L(v * 100, d)}\\,\\%`
/** plural(1,'sucursal','sucursales') → "1 sucursal" */
export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
export const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
export const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
