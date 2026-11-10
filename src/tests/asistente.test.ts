import { describe, it, expect } from 'vitest'
import { asistente } from '../lib/asistente'
import { PROYECTO } from '../data/proyecto'
import { EMPRESA_BASE, type Producto, type Sucursal } from '../data/base'

const suc = (id: string, ciudad: string, pais: string): Sucursal => ({ id, nombre: 'Sucursal ' + ciudad, tipo: 'Sucursal', pais, ciudad, direccion: '', lat: 0, lng: 0, activa: true })
const SUCURSALES = [suc('GYE', 'Guayaquil', 'EC'), suc('BOG', 'Bogotá', 'CO'), suc('MAD', 'Madrid', 'ES')]

const arroz: Producto = { id: 'P1', sku: 'ALI-001', nombre: 'Arroz Premium 2 kg', categoria: 'Alimentos', costo: 1.85, precio: 2.4, stock: { GYE: 120, BOG: 2, MAD: 80 }, min: 30, max: 200, lote: 'L1', vence: '2030-01-01', proveedorId: '' }
const ctx = { productos: [arroz], movimientos: [], ordenes: [], proveedores: [], sucursales: SUCURSALES, empresa: EMPRESA_BASE, rol: 'Gerente General' as const, nombre: 'Eduardo Lara', p: PROYECTO }
const r = (q: string) => asistente(q, ctx)

describe('Asistente NEXORA', () => {
  it('explica cómo usar el sistema', () => {
    expect(r('¿Cómo agrego un producto?').ir?.pagina).toBe('productos')
    expect(r('como registro una venta').texto).toContain('Registrar movimiento')
    expect(r('¿Cómo agrego a un ayudante?').ir?.pagina).toBe('configuracion')
    expect(r('quiero cargar mis datos desde excel').texto).toContain('Plantilla')
  })
  it('consulta datos reales', () => {
    expect(r('¿cuánto stock hay de arroz?').texto).toContain('202 u')
    expect(r('¿qué productos están en quiebre?').texto).toContain('Arroz')
    expect(r('valor del inventario').texto).toContain('373,70')
    expect(r('¿en qué países estamos?').texto).toContain('3 sucursal(es) en 3 país(es)')
    expect(r('¿qué productos están en quiebre?').texto).toContain('BOG 2 u')
  })
  it('responde preguntas económicas con el motor del Modo Defensa', () => {
    const x = r('¿Conviene reemplazar el sistema?')
    expect(x.ir?.pagina).toBe('economico')
    expect(x.texto).toContain('REEMPLAZAR AHORA')
  })
})
