/** Plantilla Excel para que la empresa cargue SUS productos (una columna de stock por sucursal) y lector que la valida. */
import * as XLSX from 'xlsx'
import type { FilaImport } from '../store/useApp'
import type { Sucursal } from '../data/base'

const FIJAS = ['SKU', 'Nombre', 'Categoría', 'Costo', 'Precio', 'Mínimo', 'Máximo', 'Lote', 'Vence (AAAA-MM-DD)']

export function descargarPlantilla(sucursales: Sucursal[]) {
  const cols = [...FIJAS.slice(0, 5), ...sucursales.map((s) => `Stock ${s.id}`), ...FIJAS.slice(5)]
  const ej = (sku: string, nom: string, cat: string, c: number, p: number, mi: number, ma: number) => [sku, nom, cat, c, p, ...sucursales.map((_, k) => (k === 0 ? ma / 2 : 0)), mi, ma, 'L2026-01', '2027-12-31']
  const ws = XLSX.utils.aoa_to_sheet([cols, ej('ALI-001', 'Arroz Premium 2 kg', 'Alimentos y bebidas', 1.85, 2.4, 30, 200), ej('TEC-001', 'Mouse inalámbrico', 'Tecnología', 8.5, 12.9, 5, 40)])
  ws['!cols'] = cols.map((c) => ({ wch: Math.max(12, c.length + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Instrucciones'], ['1. Llene una fila por producto en la hoja "Productos" (borre los 2 ejemplos).'],
    ['2. Costo y Precio en la moneda de la empresa, con punto o coma decimal.'], ['3. "Stock CÓDIGO": unidades actuales en cada sucursal (deje 0 si no lo maneja).'],
    ['4. Mínimo y Máximo son por sucursal.'], ['5. Si el SKU ya existe en NEXORA, el producto se ACTUALIZA; si no, se crea.'],
    ['Sucursales:'], ...sucursales.map((s) => [`${s.id} = ${s.nombre} (${s.ciudad}, ${s.pais})`]),
  ]), 'Instrucciones')
  XLSX.writeFile(wb, 'NEXORA_Plantilla_Productos.xlsx')
}

const n = (v: unknown) => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'))) || 0
const norm = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
const fecha = (v: unknown) => {
  if (typeof v === 'number') { const d = XLSX.SSF.parse_date_code(v); return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` }
  const s = String(v ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10)
}

/** Lee .xlsx / .xls / .csv por NOMBRE de columna (el orden no importa) y devuelve filas válidas + errores. */
export async function leerArchivo(file: File, sucursales: Sucursal[]): Promise<{ filas: FilaImport[]; errores: string[] }> {
  const wb = XLSX.read(await file.arrayBuffer())
  const ws = wb.Sheets['Productos'] ?? wb.Sheets[wb.SheetNames[0]]
  const [cab = [], ...datos] = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false })
  const h = cab.map(norm)
  const col = (...nombres: string[]) => h.findIndex((x) => nombres.some((k) => x.startsWith(k)))
  const c = { sku: col('sku', 'codigo'), nombre: col('nombre', 'producto', 'descripcion'), cat: col('categoria'), costo: col('costo'), precio: col('precio'), min: col('minimo', 'min'), max: col('maximo', 'max'), lote: col('lote'), vence: col('vence', 'vencimiento') }
  // "Stock XXX": XXX puede ser el código, la ciudad o el nombre de la sucursal
  const stockCols = h.map((x, k) => ({ x, k })).filter(({ x }) => x.startsWith('stock')).map(({ x, k }) => {
    const ref = x.replace(/^stock\s*/, '')
    return { k, suc: sucursales.find((s) => [s.id, s.ciudad, s.nombre].map(norm).includes(ref)), ref }
  })
  const errores: string[] = stockCols.filter((s) => !s.suc).map((s) => `Columna "Stock ${s.ref}": no existe esa sucursal (se ignora)`)
  if (c.sku < 0 || c.nombre < 0) return { filas: [], errores: ['Faltan las columnas SKU y Nombre. Use la plantilla de NEXORA.'] }
  const filas: FilaImport[] = []
  datos.forEach((r, i) => {
    const v = (k: number) => (k >= 0 ? r[k] : undefined)
    if (!v(c.sku) || !v(c.nombre)) { errores.push(`Fila ${i + 2}: falta SKU o Nombre`); return }
    if (n(v(c.costo)) < 0 || n(v(c.precio)) < 0) { errores.push(`Fila ${i + 2}: costo o precio negativo`); return }
    const stock: Record<string, number> = {}
    for (const s of stockCols) if (s.suc) stock[s.suc.id] = Math.max(0, Math.round(n(r[s.k])))
    filas.push({ sku: String(v(c.sku)).trim(), nombre: String(v(c.nombre)).trim(), categoria: String(v(c.cat) || 'General').trim(), costo: n(v(c.costo)), precio: n(v(c.precio)),
      stock, min: n(v(c.min)), max: n(v(c.max)) || Math.max(1, n(v(c.min)) * 4), lote: String(v(c.lote) ?? ''), vence: fecha(v(c.vence)) })
  })
  return { filas, errores }
}
