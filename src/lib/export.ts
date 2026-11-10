/** Exportación a Excel (con fórmulas reales) y PDF con membrete corporativo. */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as F from './finance'
import type { Params } from './finance'
import { money, num, pct } from './format'
import { useApp } from '../store/useApp'

type Celda = string | number | { f: string } | null
const hoja = (filas: Celda[][], anchos?: number[]) => {
  const ws = XLSX.utils.aoa_to_sheet(filas.map((r) => r.map((c) => (c && typeof c === 'object' ? null : c))))
  filas.forEach((r, ri) => r.forEach((c, ci) => { if (c && typeof c === 'object') ws[XLSX.utils.encode_cell({ r: ri, c: ci })] = { t: 'n', f: c.f } }))
  if (anchos) ws['!cols'] = anchos.map((w) => ({ wch: w }))
  return ws
}
const f = (s: string) => ({ f: s })
// Celdas de la hoja Parametros
const I = 'Parametros!$B$2', P = 'Parametros!$B$6', S = 'Parametros!$B$7', N = 'Parametros!$B$8', T = 'Parametros!$B$9'
const AP = (i: string, n: string) => `(${i}*(1+${i})^${n}/((1+${i})^${n}-1))`
const AF = (i: string, n: string) => `(${i}/((1+${i})^${n}-1))`

export function exportarAnalisisExcel(p: Params) {
  const wb = XLSX.utils.book_new()
  const add = (nombre: string, filas: Celda[][], anchos?: number[]) => XLSX.utils.book_append_sheet(wb, hoja(filas, anchos), nombre)

  add('Parametros', [
    ['Parámetro', 'Valor'], ['TMAR (i)', p.i], ['Licencia', p.licencia], ['Implementación', p.implementacion], ['Capacitación', p.capacitacion],
    ['Inversión P', f('SUM(B3:B5)')], ['Valor residual S', p.S], ['Vida fiscal n', p.n], ['Impuesto', p.impuesto], ['VM defensor hoy', p.defensor.vm0],
    ['Costo original defensor (hundido)', p.defensor.costoOriginal], ['Inflación', p.inflacion], ['TMAR ajustada', f('B2+B12+B2*B12')],
  ], [34, 14])

  const nc = p.conceptos.length
  add('Comparacion', [
    ['Concepto', 'Actual', 'NEXORA', 'Ahorro', '% reducción'],
    ...p.conceptos.map((c, k) => [c.nombre, c.actual, c.nuevo, f(`B${k + 2}-C${k + 2}`), f(`IF(B${k + 2}=0,0,D${k + 2}/B${k + 2})`)]),
    ['TOTAL', f(`SUM(B2:B${nc + 1})`), f(`SUM(C2:C${nc + 1})`), f(`SUM(D2:D${nc + 1})`), f(`D${nc + 2}/B${nc + 2}`)],
    [], ['Recuperación simple (años)', f(`${P}/D${nc + 2}`)],
  ], [48, 12, 12, 12, 12])

  const tablaCAUE = (inv: string, vm: number[], coa: number[]) => [
    ['n', 'VM_n', 'COA_n', '(P/F,i,n)', 'COA·(P/F)', 'Σ VP COA', '(A/P,i,n)', '(A/F,i,n)', 'RC', 'COA eq', 'CAUE'],
    ...vm.map((v, k) => { const r = k + 2; return [k + 1, v, coa[k], f(`1/(1+${I})^A${r}`), f(`C${r}*D${r}`), f(`SUM($E$2:E${r})`), f(AP(I, `A${r}`)), f(AF(I, `A${r}`)), f(`${inv}*G${r}-B${r}*H${r}`), f(`F${r}*G${r}`), f(`I${r}+J${r}`)] }),
    [], ['CAUE mínimo', f(`MIN(K2:K${vm.length + 1})`), 'Vida económica', f(`MATCH(B${vm.length + 3},K2:K${vm.length + 1},0)`)],
  ]
  add('VidaUtil_Retador', tablaCAUE(P, p.retador.vm, p.retador.coa))
  const d = p.defensor
  add('Reemplazo_Defensor', tablaCAUE(`Parametros!$B$10`, d.vm.slice(0, d.vidaRestante), d.coa.slice(0, d.vidaRestante)))
  add('CostoMarginal', [
    ['Año', 'VM inicio', 'VM fin', 'Pérdida valor', 'Interés i·VM', 'COA', 'Costo marginal', 'CAUE mín. retador', '¿Conservar?'],
    ...d.vm.slice(0, d.vidaRestante).map((v, k) => { const r = k + 2; return [k + 1, k === 0 ? f('Parametros!B10') : f(`C${r - 1}`), v, f(`B${r}-C${r}`), f(`${I}*B${r}`), d.coa[k], f(`D${r}+E${r}+F${r}`), f(`VidaUtil_Retador!B${p.retador.vm.length + 3}`), f(`IF(G${r}<H${r},"Sí","No")`)] }),
  ])

  const n = p.n
  add('Depreciacion', [
    ['Año', 'LR', 'VL LR', 'SDD', 'VL SDD', 'SDA', 'VL SDA', 'MACRS %', 'MACRS', 'Ahorro fiscal LR', 'Ahorro fiscal SDD', 'Ahorro fiscal SDA'],
    [0, null, f(P), null, f(P), null, f(P), null, null, null, null, null],
    ...Array.from({ length: n }, (_, k) => { const r = k + 3; return [k + 1, f(`(${P}-${S})/${N}`), f(`C${r - 1}-B${r}`), f(`MAX(0,MIN(2/${N}*E${r - 1},E${r - 1}-${S}))`), f(`E${r - 1}-D${r}`), f(`(${N}-A${r}+1)/(${N}*(${N}+1)/2)*(${P}-${S})`), f(`G${r - 1}-F${r}`), F.MACRS[p.macrsClase][k] ?? 0, f(`H${r}*${P}`), f(`B${r}*${T}`), f(`D${r}*${T}`), f(`F${r}*${T}`)] }),
    [], ['VP ahorro fiscal', null, null, null, null, null, null, null, null, f(`NPV(${I},J3:J${n + 2})`), f(`NPV(${I},K3:K${n + 2})`), f(`NPV(${I},L3:L${n + 2})`)],
  ])

  const dep = F.depreciar(p, p.depMetodo)
  add('FEDI', [
    ['Año', 'Ahorro', `Depreciación (${F.NOMBRE_DEP[p.depMetodo]})`, 'Renta gravable', 'Impuesto', 'Residual', 'FEDI'],
    [0, 0, 0, 0, 0, 0, f(`-${P}`)],
    ...Array.from({ length: n }, (_, k) => { const r = k + 3; const last = k === n - 1; return [k + 1, f(`Comparacion!$D$${nc + 2}`), dep[k]?.dep ?? 0, f(`B${r}-C${r}`), last ? f(`D${r}*${T}+(${S}-(${P}-SUM(C3:C${r})))*${T}`) : f(`D${r}*${T}`), last ? f(S) : 0, f(`B${r}-E${r}+F${r}`)] }),
    [], ['VP después de impuestos', f(`G2+NPV(${I},G3:G${n + 2})`)], ['VA después de impuestos', f(`B${n + 4}*${AP(I, N)}`)], ['TIR después de impuestos', f(`IRR(G2:G${n + 2})`)],
  ])

  add('Indicadores', [
    ['Año', 'Flujo'], [0, f(`-${P}`)],
    ...Array.from({ length: n }, (_, k) => [k + 1, f(`Comparacion!$D$${nc + 2}${k === n - 1 ? `+${S}` : ''}`)]),
    [], ['VPN', f(`B2+NPV(${I},B3:B${n + 2})`)], ['VAE', f(`B${n + 4}*${AP(I, N)}`)], ['TIR', f(`IRR(B2:B${n + 2})`)],
    ['B/C', f(`NPV(${I},B3:B${n + 2})/${P}`)], ['Ahorro mínimo', f(`(${P}-${S}/(1+${I})^${N})/((1-(1+${I})^-${N})/${I})`)],
  ])

  const e = F.periodoEstudio(p, p.horizonte)
  add('PeriodoEstudio', [['Opción', 'VP costos', 'VA costos'], ...e.opciones.map((o) => [o.etiqueta, o.vp, o.va]), [], ['Mejor', e.mejor.etiqueta]], [30, 14, 14])
  const t = F.tornado(p)
  add('Sensibilidad', [['Variable', 'VPN −20 %', 'VPN +20 %', 'Rango'], ...t.filas.map((x) => [x.variable, x.bajo, x.alto, x.rango]), [], ['Valor de equilibrio defensor', F.equilibrioDefensor(p)]], [30, 14, 14, 14])
  XLSX.writeFile(wb, 'NEXORA_Analisis_Economico.xlsx')
}

// ───────────── PDF ─────────────
export function pdfBase(titulo: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(8, 7, 5); doc.rect(0, 0, w, 64, 'F')
  doc.setFillColor(212, 175, 55); doc.rect(0, 64, w, 3, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('NEXORA', 40, 32)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Intelligent Operations Suite · ${useApp.getState().empresa.nombre}`, 40, 48)
  doc.text(new Date().toLocaleString('es-EC'), w - 40, 32, { align: 'right' })
  doc.setTextColor(20, 20, 30); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(titulo, 40, 96)
  return { doc, y: 110 }
}
export function pdfTabla(doc: jsPDF, y: number, titulo: string, head: string[], body: (string | number)[][]) {
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(titulo, 40, y + 14)
  autoTable(doc, { startY: y + 20, head: [head], body: body.map((r) => r.map(String)), styles: { fontSize: 8 }, headStyles: { fillColor: [176, 125, 38], textColor: [255, 255, 255] }, margin: { left: 40, right: 40 } })
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
}

export function exportarAnalisisPDF(p: Params) {
  const { doc } = pdfBase('Análisis económico de reemplazo — NEXORA')
  let y = 110
  const R = F.reemplazo(p), K = F.indicadores(p)
  y = pdfTabla(doc, y, 'Resumen', ['Indicador', 'Valor'], [
    ['Veredicto', R.veredicto], ['CAUE mín. defensor', `${money(R.def.caueMin)} (n=${R.def.nOpt})`], ['CAUE mín. retador', `${money(R.ret.caueMin)} (n=${R.ret.nOpt})`],
    ['Ahorro anual', money(K.A)], ['VPN', money(K.VPN)], ['TIR', pct(K.TIR)], ['B/C', num(K.BC, 4)], ['Recuperación simple / descontada', `${num(K.recSimple)} / ${num(K.recDesc)} años`],
  ])
  y = pdfTabla(doc, y, 'Comparación de costos anuales', ['Concepto', 'Actual', 'NEXORA', 'Ahorro'], [...p.conceptos.map((c) => [c.nombre, money(c.actual), money(c.nuevo), money(c.actual - c.nuevo)]), ['TOTAL', money(F.totalActual(p)), money(F.totalNuevo(p)), money(K.A)]])
  y = pdfTabla(doc, y, 'Vida útil económica del retador', ['n', 'VM', 'COA', 'RC', 'COA eq', 'CAUE'], R.ret.filas.map((r) => [r.n, money(r.vm), money(r.coa), money(r.rc), money(r.coaEq), money(r.caue)]))
  y = pdfTabla(doc, y, 'CAUE del defensor y costo marginal', ['n', 'CAUE', 'Costo marginal'], R.def.filas.map((r, k) => [r.n, money(r.caue), money(R.marg[k].cm)]))
  const ms: F.MetodoDep[] = ['LR', 'SD', 'SDD_LR', 'SDA', 'MACRS', 'UP']
  y = pdfTabla(doc, y, 'Depreciación — VP del ahorro fiscal', ['Método', 'Año 1', 'VL final', 'VP ahorro fiscal'], ms.map((m) => { const t = F.depreciar(p, m); return [F.NOMBRE_DEP[m], money(t[0].dep), money(t[t.length - 1].vl), money(F.ahorroFiscal(t, p.impuesto, p.i).vp)] }))
  const fe = F.fedi(p, p.depMetodo)
  pdfTabla(doc, y, `FEDI (${F.NOMBRE_DEP[p.depMetodo]}) — VP ${money(fe.VP)}`, ['Año', 'Ahorro', 'Dep.', 'Impuesto', 'FEDI'], fe.filas.map((r) => [r.anio, money(r.ahorro), money(r.dep), money(r.impuesto), money(r.fedi)]))
  doc.save('NEXORA_Analisis_Economico.pdf')
}

/** Exportación genérica de una tabla a Excel o PDF (inventario, kardex, compras). */
export function exportarTabla(nombre: string, head: string[], body: (string | number)[][], formato: 'xlsx' | 'pdf') {
  if (formato === 'xlsx') {
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([head, ...body]), nombre.slice(0, 30)); XLSX.writeFile(wb, `NEXORA_${nombre}.xlsx`)
  } else {
    const { doc, y } = pdfBase(nombre); pdfTabla(doc, y - 20, '', head, body); doc.save(`NEXORA_${nombre}.pdf`)
  }
}

/** PDF del reporte ejecutivo inteligente (resumen, indicadores, hallazgos con acciones, red de sucursales y top de ventas). */
export function exportarReporteEjecutivo(a: ReturnType<typeof import('./reporteInteligente').analizarNegocio>) {
  const { doc } = pdfBase('Reporte ejecutivo inteligente')
  const w = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  const lineas = doc.splitTextToSize(a.resumen, w - 80)
  doc.text(lineas, 40, 118)
  let y = 118 + lineas.length * 13
  y = pdfTabla(doc, y, 'Indicadores clave', ['Indicador', 'Valor'], a.kpis.map(([k, v]) => [k, v]))
  const etiqueta = { critico: 'CRÍTICO', alerta: 'Alerta', oportunidad: 'Oportunidad', ok: 'OK' }
  y = pdfTabla(doc, y, 'Hallazgos y acciones recomendadas', ['Nivel', 'Hallazgo', 'Detalle', 'Acción recomendada'], a.hallazgos.map((h) => [etiqueta[h.nivel], h.titulo, h.detalle, h.accion]))
  y = pdfTabla(doc, y, 'Red de sucursales', ['Código', 'Sucursal', 'País', 'Inventario', 'Ventas 30 d', 'Quiebres'], a.porSucursal.map((r) => [r.s.id, r.s.nombre, r.s.pais, money(r.valor, 0), money(r.ventas30, 0), r.quiebres]))
  if (a.top.length) pdfTabla(doc, y, 'Productos más vendidos (30 días)', ['#', 'Producto', 'Unidades'], a.top.map((t, k) => [k + 1, t.p?.nombre ?? '—', t.u]))
  doc.save(`NEXORA_Reporte_ejecutivo_${new Date().toISOString().slice(0, 10)}.pdf`)
}
