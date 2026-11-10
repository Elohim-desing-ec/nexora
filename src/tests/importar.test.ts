import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { leerArchivo } from '../lib/importar'
import type { Sucursal } from '../data/base'

const suc = (id: string, ciudad: string): Sucursal => ({ id, nombre: 'Sucursal ' + ciudad, tipo: 'Sucursal', pais: 'EC', ciudad, direccion: '', lat: 0, lng: 0, activa: true })
const SUCS = [suc('GYE', 'Guayaquil'), suc('BOG', 'Bogotá'), suc('MAD', 'Madrid')]

describe('Importación de productos desde Excel', () => {
  it('lee la plantilla por nombre de columna (sucursales de varios países), convierte comas decimales y reporta filas inválidas', async () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['SKU', 'Nombre', 'Categoría', 'Costo', 'Precio', 'Stock GYE', 'Stock Bogotá', 'Stock MAD', 'Mínimo', 'Máximo', 'Lote', 'Vence'],
      ['A-1', 'Arroz', 'Alimentos', '1,85', 2.4, 10, 5, 0, 3, 50, 'L1', '2027-01-31'],
      ['', 'Sin SKU', 'X', 1, 1, 0, 0, 0, 0, 0, '', ''],
    ]), 'Productos')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    const r = await leerArchivo(new File([buf], 'p.xlsx'), SUCS)
    expect(r.filas).toHaveLength(1)
    expect(r.filas[0]).toMatchObject({ sku: 'A-1', costo: 1.85, stock: { GYE: 10, BOG: 5, MAD: 0 }, vence: '2027-01-31' })
    expect(r.errores[0]).toContain('Fila 3')
  })
})
