/**
 * Datos reales de internet:
 *  - Geocodificación con OpenStreetMap Nominatim (dirección → coordenadas reales). Política de uso: 1 consulta/segundo.
 *  - Tipos de cambio diarios con open.er-api.com (sin clave). Se guardan 12 h en caché.
 */
export interface Lugar { nombre: string; lat: number; lng: number; ciudad: string; pais: string }

export async function buscarDireccion(texto: string): Promise<Lugar[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=es&q=${encodeURIComponent(texto)}`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('Servicio de mapas no disponible')
  const d = (await r.json()) as { display_name: string; lat: string; lon: string; address?: Record<string, string> }[]
  return d.map((x) => ({
    nombre: x.display_name, lat: +x.lat, lng: +x.lon,
    ciudad: x.address?.city ?? x.address?.town ?? x.address?.village ?? x.address?.county ?? x.address?.state ?? '',
    pais: (x.address?.country_code ?? '').toUpperCase(),
  }))
}

export interface Tasas { base: string; fecha: string; tasas: Record<string, number> }
export async function tiposDeCambio(base: string): Promise<Tasas | null> {
  const clave = `nx-fx-${base}`
  try {
    const c = JSON.parse(localStorage.getItem(clave) ?? 'null') as (Tasas & { t: number }) | null
    if (c && Date.now() - c.t < 12 * 3600e3) return c
  } catch { /* caché dañada */ }
  try {
    const r = await fetch(`https://open.er-api.com/v6/latest/${base}`)
    const d = await r.json()
    if (d.result !== 'success') return null
    const t: Tasas = { base, fecha: d.time_last_update_utc, tasas: d.rates }
    try { localStorage.setItem(clave, JSON.stringify({ ...t, t: Date.now() })) } catch { /* sin espacio */ }
    return t
  } catch { return null }
}
