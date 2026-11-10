/** Catálogo real de países: código ISO 3166, moneda ISO 4217, nombre del identificador fiscal y centro geográfico. */
export interface Pais { codigo: string; nombre: string; moneda: string; idFiscal: string; lat: number; lng: number }
const P = (codigo: string, nombre: string, moneda: string, idFiscal: string, lat: number, lng: number): Pais => ({ codigo, nombre, moneda, idFiscal, lat, lng })

export const PAISES: Pais[] = [
  P('EC', 'Ecuador', 'USD', 'RUC', -1.83, -78.18), P('CO', 'Colombia', 'COP', 'NIT', 4.57, -74.3), P('PE', 'Perú', 'PEN', 'RUC', -9.19, -75.02),
  P('BO', 'Bolivia', 'BOB', 'NIT', -16.29, -63.59), P('CL', 'Chile', 'CLP', 'RUT', -35.68, -71.54), P('AR', 'Argentina', 'ARS', 'CUIT', -38.42, -63.62),
  P('UY', 'Uruguay', 'UYU', 'RUT', -32.52, -55.77), P('PY', 'Paraguay', 'PYG', 'RUC', -23.44, -58.44), P('BR', 'Brasil', 'BRL', 'CNPJ', -14.24, -51.93),
  P('VE', 'Venezuela', 'VES', 'RIF', 6.42, -66.59), P('PA', 'Panamá', 'USD', 'RUC', 8.54, -80.78), P('CR', 'Costa Rica', 'CRC', 'Cédula jurídica', 9.75, -83.75),
  P('NI', 'Nicaragua', 'NIO', 'RUC', 12.87, -85.21), P('HN', 'Honduras', 'HNL', 'RTN', 15.2, -86.24), P('SV', 'El Salvador', 'USD', 'NIT', 13.79, -88.9),
  P('GT', 'Guatemala', 'GTQ', 'NIT', 15.78, -90.23), P('MX', 'México', 'MXN', 'RFC', 23.63, -102.55), P('DO', 'República Dominicana', 'DOP', 'RNC', 18.74, -70.16),
  P('CU', 'Cuba', 'CUP', 'NIT', 21.52, -77.78), P('PR', 'Puerto Rico', 'USD', 'EIN', 18.22, -66.59), P('US', 'Estados Unidos', 'USD', 'EIN', 37.09, -95.71),
  P('CA', 'Canadá', 'CAD', 'BN', 56.13, -106.35), P('ES', 'España', 'EUR', 'NIF', 40.46, -3.75), P('PT', 'Portugal', 'EUR', 'NIF', 39.4, -8.22),
  P('FR', 'Francia', 'EUR', 'SIREN', 46.23, 2.21), P('DE', 'Alemania', 'EUR', 'USt-IdNr', 51.17, 10.45), P('IT', 'Italia', 'EUR', 'Partita IVA', 41.87, 12.57),
  P('NL', 'Países Bajos', 'EUR', 'BTW', 52.13, 5.29), P('GB', 'Reino Unido', 'GBP', 'VAT', 55.38, -3.44), P('CH', 'Suiza', 'CHF', 'UID', 46.82, 8.23),
  P('SE', 'Suecia', 'SEK', 'Org.nr', 60.13, 18.64), P('PL', 'Polonia', 'PLN', 'NIP', 51.92, 19.15), P('TR', 'Turquía', 'TRY', 'VKN', 38.96, 35.24),
  P('RU', 'Rusia', 'RUB', 'INN', 61.52, 105.32), P('CN', 'China', 'CNY', 'USCC', 35.86, 104.2), P('JP', 'Japón', 'JPY', 'Corporate No.', 36.2, 138.25),
  P('KR', 'Corea del Sur', 'KRW', 'BRN', 35.91, 127.77), P('IN', 'India', 'INR', 'GSTIN', 20.59, 78.96), P('SG', 'Singapur', 'SGD', 'UEN', 1.35, 103.82),
  P('AE', 'Emiratos Árabes Unidos', 'AED', 'TRN', 23.42, 53.85), P('SA', 'Arabia Saudita', 'SAR', 'VAT', 23.89, 45.08), P('ZA', 'Sudáfrica', 'ZAR', 'VAT', -30.56, 22.94),
  P('NG', 'Nigeria', 'NGN', 'TIN', 9.08, 8.68), P('EG', 'Egipto', 'EGP', 'TRN', 26.82, 30.8), P('MA', 'Marruecos', 'MAD', 'ICE', 31.79, -7.09),
  P('AU', 'Australia', 'AUD', 'ABN', -25.27, 133.78), P('NZ', 'Nueva Zelanda', 'NZD', 'NZBN', -40.9, 174.89),
].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

/** Símbolos de moneda para mostrar montos. */
export const SIMBOLOS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', COP: 'COL$', PEN: 'S/', BOB: 'Bs', CLP: 'CLP$', ARS: 'AR$', UYU: '$U', PYG: '₲', BRL: 'R$',
  VES: 'Bs.', CRC: '₡', NIO: 'C$', HNL: 'L', GTQ: 'Q', MXN: 'MX$', DOP: 'RD$', CUP: '$MN', CAD: 'CA$', CHF: 'CHF', SEK: 'kr', PLN: 'zł', TRY: '₺',
  RUB: '₽', KRW: '₩', INR: '₹', SGD: 'S$', AED: 'AED', SAR: 'SAR', ZAR: 'R', NGN: '₦', EGP: 'E£', MAD: 'MAD', AUD: 'A$', NZD: 'NZ$',
}
export const MONEDAS = Object.keys(SIMBOLOS).sort()
export const pais = (codigo: string) => PAISES.find((p) => p.codigo === codigo)
/** Bandera emoji a partir del código ISO (🇪🇨). */
export const bandera = (codigo: string) => (codigo?.length === 2 ? String.fromCodePoint(...[...codigo.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🏳️')
