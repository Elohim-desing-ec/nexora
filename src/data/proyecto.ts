import type { Params } from '../lib/finance'

/** Caso base del análisis económico: empresa con un software de inventario de 7 años (valores editables en Parámetros). */
export const PROYECTO: Params = {
  i: 0.12,
  licencia: 14000, implementacion: 7000, capacitacion: 3500,
  S: 4500, n: 5, impuesto: 0.25,
  conceptos: [
    { nombre: 'Mantenimiento', actual: 5100, nuevo: 1100 },
    { nombre: 'Pérdidas por errores de inventario y devoluciones', actual: 8400, nuevo: 1900 },
    { nombre: 'Licencia y soporte', actual: 1500, nuevo: 3200 },
    { nombre: 'Horas extra', actual: 3000, nuevo: 700 },
    { nombre: 'Caídas del sistema', actual: 1800, nuevo: 300 },
  ],
  defensor: { vm0: 2000, costoOriginal: 15000, edad: 7, vidaRestante: 4, vm: [1200, 700, 300, 0], coa: [19800, 21500, 23600, 26000] },
  retador: {
    vm: [16000, 12000, 8800, 6400, 4500, 3000, 1900, 1000],
    coa: [7200, 7600, 8200, 9000, 10100, 13200, 15800, 18900],
  },
  depMetodo: 'SDD_LR', factorSD: 2, macrsClase: 5,
  unidades: [12000, 11000, 10000, 9000, 8000, 7000, 6000, 5000],
  inflacion: 0.03,
  horizonte: 5,
}
