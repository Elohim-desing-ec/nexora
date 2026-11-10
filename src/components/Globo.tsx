import { useEffect, useRef, useState } from 'react'
import { Map as MlMap, Popup, NavigationControl, FullscreenControl, LngLatBounds, setWorkerUrl, type GeoJSONSource, type MapLayerMouseEvent, type MapMouseEvent } from 'maplibre-gl'
// El worker del mapa se empaqueta con Vite (funciona igual en desarrollo y en producción)
import urlWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { StyleSpecification, SkySpecification } from '@maplibre/maplibre-gl-style-spec'
import type { FeatureCollection, Point } from 'geojson'
import { WifiOff } from 'lucide-react'
import { cx } from './ui'

/**
 * Globo terráqueo 3D (MapLibre GL, proyección "globe"): se gira con el mouse, se acerca hasta nivel de calle.
 * Mapas reales: CARTO / OpenFreeMap (OpenStreetMap) e imágenes satelitales de Esri.
 */
export type EstiloGlobo = 'oscuro' | 'claro' | 'satelite'
const ESTILOS: Record<EstiloGlobo, string | StyleSpecification> = {
  oscuro: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  claro: 'https://tiles.openfreemap.org/styles/liberty',
  satelite: {
    version: 8,
    sources: { sat: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics' } },
    layers: [{ id: 'sat', type: 'raster', source: 'sat' }],
  },
}
export interface PuntoGlobo { id: string; nombre: string; lat: number; lng: number; valor?: number; detalle?: string }
/** Arco entre dos puntos [lng, lat]; peso = intensidad (ej. unidades transferidas). */
export interface ArcoGlobo { de: [number, number]; a: [number, number]; peso: number }
export interface Vuelo { lng: number; lat: number; zoom?: number; t: number }

interface Props {
  puntos: PuntoGlobo[]; arcos?: ArcoGlobo[]; seleccion?: string | null; estilo?: EstiloGlobo; autoRotar?: boolean
  onSeleccion?: (id: string) => void; onClickMapa?: (lng: number, lat: number) => void; volarA?: Vuelo | null; className?: string
}

setWorkerUrl(urlWorker)

const rad = Math.PI / 180
/** Ruta por el círculo máximo (la distancia más corta sobre la esfera), como las rutas aéreas. */
function circuloMaximo([lng1, lat1]: [number, number], [lng2, lat2]: [number, number], n = 64): [number, number][] {
  const v = (lng: number, lat: number) => [Math.cos(lat * rad) * Math.cos(lng * rad), Math.cos(lat * rad) * Math.sin(lng * rad), Math.sin(lat * rad)]
  const A = v(lng1, lat1), B = v(lng2, lat2)
  const d = Math.acos(Math.min(1, Math.max(-1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])))
  if (d < 1e-6) return [[lng1, lat1], [lng2, lat2]]
  const pts: [number, number][] = []
  for (let k = 0; k <= n; k++) {
    const t = k / n, s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d)
    const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2]
    let lng = Math.atan2(y, x) / rad
    if (pts.length) { const prev = pts[pts.length - 1][0]; while (lng - prev > 180) lng -= 360; while (prev - lng > 180) lng += 360 } // cruce del antimeridiano
    pts.push([lng, Math.atan2(z, Math.hypot(x, y)) / rad])
  }
  return pts
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export default function Globo({ puntos, arcos = [], seleccion, estilo = 'oscuro', autoRotar = true, onSeleccion, onClickMapa, volarA, className }: Props) {
  const div = useRef<HTMLDivElement>(null), mapa = useRef<MlMap | null>(null)
  const [error, setError] = useState(false)
  const datos = useRef({ puntos, arcos, seleccion }), cb = useRef({ onSeleccion, onClickMapa }), rotar = useRef(autoRotar), tocado = useRef(0)
  datos.current = { puntos, arcos, seleccion }; cb.current = { onSeleccion, onClickMapa }; rotar.current = autoRotar

  const geoPuntos = (): FeatureCollection => {
    const max = Math.max(1, ...datos.current.puntos.map((p) => p.valor ?? 0))
    return { type: 'FeatureCollection', features: datos.current.puntos.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map((p) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { id: p.id, nombre: p.nombre, detalle: p.detalle ?? '', r: 6 + 12 * Math.sqrt((p.valor ?? 0) / max), sel: p.id === datos.current.seleccion },
    })) }
  }
  const geoArcos = (): FeatureCollection => {
    const max = Math.max(1, ...datos.current.arcos.map((a) => a.peso))
    return { type: 'FeatureCollection', features: datos.current.arcos.map((a) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: circuloMaximo(a.de, a.a) }, properties: { w: 1.5 + 4 * (a.peso / max) } })) }
  }

  useEffect(() => {
    const map = new MlMap({ container: div.current!, style: ESTILOS[estilo], center: [-60, 5], zoom: 1.6, attributionControl: { compact: true }, maxPitch: 75 })
    mapa.current = map
    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new FullscreenControl(), 'top-right')
    let primera = true
    const capas = () => {
      map.setProjection({ type: 'globe' })
      map.setSky({ 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] } as SkySpecification)
      map.addSource('arcos', { type: 'geojson', data: geoArcos() })
      map.addLayer({ id: 'arcos', type: 'line', source: 'arcos', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#F3D58A', 'line-width': ['get', 'w'], 'line-opacity': 0.75, 'line-blur': 0.6 } })
      map.addSource('puntos', { type: 'geojson', data: geoPuntos() })
      map.addLayer({ id: 'puntos-halo', type: 'circle', source: 'puntos', paint: { 'circle-radius': ['*', ['get', 'r'], 2.4], 'circle-color': ['case', ['get', 'sel'], '#10B981', '#D4AF37'], 'circle-opacity': 0.22, 'circle-blur': 0.7, 'circle-pitch-alignment': 'map' } })
      map.addLayer({ id: 'puntos', type: 'circle', source: 'puntos', paint: { 'circle-radius': ['get', 'r'], 'circle-color': ['case', ['get', 'sel'], '#10B981', '#F3D58A'], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5, 'circle-pitch-alignment': 'map' } })
      if (primera && datos.current.puntos.length) { // encuadra todas las sucursales
        primera = false
        const b = new LngLatBounds()
        datos.current.puntos.forEach((p) => b.extend([p.lng, p.lat]))
        map.fitBounds(b, { padding: 90, maxZoom: 4, duration: 0 })
      }
    }
    map.on('style.load', capas)
    map.on('error', (e) => { if (/style|Failed to fetch|NetworkError/i.test(String(e.error?.message))) setError(true) })
    const popup = new Popup({ closeButton: false, offset: 14, className: 'nx-popup' })
    map.on('click', 'puntos', (e: MapLayerMouseEvent) => {
      const f = e.features?.[0]; if (!f) return
      const p = f.properties as { id: string; nombre: string; detalle: string }
      popup.setLngLat((f.geometry as Point).coordinates as [number, number]).setHTML(`<b>${esc(p.nombre)}</b>${p.detalle ? `<br/>${esc(p.detalle).replace(/\n/g, '<br/>')}` : ''}`).addTo(map)
      cb.current.onSeleccion?.(p.id)
    })
    map.on('click', (e: MapMouseEvent) => { if (!map.queryRenderedFeatures(e.point, { layers: ['puntos'] }).length) cb.current.onClickMapa?.(e.lngLat.lng, e.lngLat.lat) })
    map.on('mouseenter', 'puntos', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'puntos', () => { map.getCanvas().style.cursor = '' })
    const tocar = () => { tocado.current = Date.now() }
    ;['mousedown', 'touchstart', 'wheel', 'dragstart'].forEach((ev) => map.on(ev as 'mousedown', tocar))
    // rotación automática: se pausa 8 s después de cada interacción
    let raf = 0
    const girar = () => {
      if (rotar.current && Date.now() - tocado.current > 8000 && map.getZoom() < 3.2 && !map.isMoving()) { const c = map.getCenter(); map.setCenter([c.lng - 0.05, c.lat]) }
      raf = requestAnimationFrame(girar)
    }
    raf = requestAnimationFrame(girar)
    return () => { cancelAnimationFrame(raf); popup.remove(); map.remove(); mapa.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const m = mapa.current; if (m?.isStyleLoaded()) { (m.getSource('puntos') as GeoJSONSource | undefined)?.setData(geoPuntos()); (m.getSource('arcos') as GeoJSONSource | undefined)?.setData(geoArcos()) } }, [puntos, arcos, seleccion]) // eslint-disable-line react-hooks/exhaustive-deps
  const primerEstilo = useRef(true)
  useEffect(() => { if (primerEstilo.current) { primerEstilo.current = false; return } setError(false); mapa.current?.setStyle(ESTILOS[estilo]) }, [estilo])
  useEffect(() => { if (volarA && mapa.current) { tocado.current = Date.now(); mapa.current.flyTo({ center: [volarA.lng, volarA.lat], zoom: volarA.zoom ?? 12, duration: 2600, essential: true }) } }, [volarA])

  return (
    <div className={cx('espacio relative overflow-hidden rounded-xl', className)}>
      <div ref={div} className="absolute inset-0" />
      {error && <div className="absolute inset-0 grid place-items-center bg-black/60 p-6 text-center text-sm text-white"><div><WifiOff className="mx-auto mb-2" />El globo 3D necesita conexión a internet para descargar el mapa del mundo.</div></div>}
    </div>
  )
}
