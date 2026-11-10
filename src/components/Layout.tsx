import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Bell, Boxes, Brain, ChevronsLeft, FileDown, LayoutDashboard, LogOut, Settings, Globe2, Maximize2, Minimize2, Moon, Search, ShieldCheck, ShoppingCart, Sun, Menu } from 'lucide-react'
import { useApp, PERMISOS, type Pagina } from '../store/useApp'
import { useEcon } from '../store/useEcon'
import { Logo } from './Logo'
import { Asistente } from './Asistente'
import { cx } from './ui'
import { plural } from '../lib/format'
import { enQuiebre } from '../lib/inventario'
import { normalizar } from '../lib/preguntas'

export const MENU: { id: Pagina; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'red', label: 'Red global', icon: <Globe2 size={18} /> },
  { id: 'productos', label: 'Inventario', icon: <Boxes size={18} /> },
  { id: 'compras', label: 'Compras', icon: <ShoppingCart size={18} /> },
  { id: 'auditoria', label: 'Trazabilidad', icon: <ShieldCheck size={18} /> },
  { id: 'reportes', label: 'Reportes', icon: <FileDown size={18} /> },
  { id: 'economico', label: 'Análisis económico', icon: <BarChart3 size={18} /> },
  { id: 'ia', label: 'IA NEXORA', icon: <Brain size={18} /> },
  { id: 'configuracion', label: 'Configuración', icon: <Settings size={18} /> },
]

/** Fondo "obsidiana": resplandor dorado cenital, haces de luz diagonales y textura de grano. */
export function Fondo() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute left-1/2 top-[-38rem] h-[70rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,175,55,.16),rgba(176,125,38,.05)_55%,transparent)]" />
      <div className="haz absolute -left-48 -top-40 h-[150%] w-[30rem] rotate-[24deg] animate-destello" />
      <div className="haz absolute left-[16%] -top-40 h-[150%] w-[9rem] rotate-[24deg] animate-destello [animation-delay:-2s]" />
      <div className="haz absolute right-[8%] -top-40 h-[150%] w-[14rem] -rotate-[18deg] animate-destello [animation-delay:-1s] opacity-60" />
      <div className="absolute -bottom-72 -right-48 h-[42rem] w-[42rem] animate-orbe rounded-full bg-violeta/10 blur-[150px]" />
      <div className="ruido absolute inset-0" />
    </div>
  )
}

function Paleta({ abierta, cerrar }: { abierta: boolean; cerrar: () => void }) {
  const { usuario, ir, productos } = useApp()
  const setTab = useEcon((s) => s.setTab)
  const [q, setQ] = useState('')
  const permitidas = usuario ? PERMISOS[usuario.rol] : []
  const res = useMemo(() => {
    const n = normalizar(q)
    const items: { tipo: string; label: string; go: () => void }[] = [
      ...MENU.filter((m) => permitidas.includes(m.id)).map((m) => ({ tipo: 'Página', label: m.label, go: () => ir(m.id) })),
      ...(permitidas.includes('productos') ? productos.map((p) => ({ tipo: 'Producto', label: `${p.sku} · ${p.nombre}`, go: () => { sessionStorage.setItem('nx-p', p.id); ir('productos') } })) : []),
      ...(permitidas.includes('economico') ? ['comparacion', 'reemplazo', 'vida', 'depreciacion', 'indicadores', 'sensibilidad'].map((t) => ({ tipo: 'Análisis', label: `Pestaña ${t}`, go: () => { setTab(t); ir('economico') } })) : []),
    ]
    return (n.trim() ? items.filter((i) => normalizar(i.label).includes(n.trim())) : items.slice(0, 8)).slice(0, 12)
  }, [q, productos, permitidas, ir, setTab])
  useEffect(() => { if (abierta) setQ('') }, [abierta])
  return (
    <AnimatePresence>
      {abierta && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && cerrar()}>
          <motion.div initial={{ y: -10, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="glass w-full max-w-xl overflow-hidden" style={{ background: 'color-mix(in srgb, var(--bg2) 90%, transparent)' }}>
            <div className="flex items-center gap-2 border-b border-fg/10 px-4"><Search size={16} className="text-muted" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && res[0]) { res[0].go(); cerrar() } }} placeholder="Buscar páginas, productos, preguntas de la defensa…" className="w-full bg-transparent py-3.5 text-sm outline-none" />
              <kbd className="rounded border border-fg/20 px-1.5 text-[10px] text-muted">ESC</kbd></div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {res.map((r, k) => <li key={k}><button onClick={() => { r.go(); cerrar() }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-fg/10"><span className="truncate">{r.label}</span><span className="shrink-0 text-[10px] uppercase text-muted">{r.tipo}</span></button></li>)}
              {!res.length && <li className="p-4 text-center text-sm text-muted">Sin resultados</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, pagina, ir, logout, tema, setTema, presentacion, setPresentacion, sucursal, setSucursal, productos, ordenes, empresa, sucursales: SUCURSALES, menuColapsado: colapsado, setMenuColapsado: setColapsado } = useApp()
  const [movil, setMovil] = useState(false)
  const [paleta, setPaleta] = useState(false)
  const [notif, setNotif] = useState(false)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaleta((v) => !v) } if (e.key === 'Escape') { setPaleta(false); if (presentacion) togglePres(false) } }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  })
  const togglePres = (v: boolean) => { setPresentacion(v); try { if (v) document.documentElement.requestFullscreen?.(); else if (document.fullscreenElement) document.exitFullscreen() } catch { /* sin pantalla completa */ } }
  if (!usuario) return null
  const permitidas = PERMISOS[usuario.rol]
  const alertas = [
    ...productos.filter((p) => enQuiebre(p)).slice(0, 6).map((p) => ({ t: 'rojo', m: `Quiebre de stock: ${p.nombre}` })),
    ...ordenes.filter((o) => o.estado === 'Borrador').map((o) => ({ t: 'ambar', m: `${o.id} pendiente de aprobación` })),
  ]
  const item = (m: (typeof MENU)[number]) => (
    <button key={m.id} onClick={() => { ir(m.id); setMovil(false) }} aria-label={m.label} className={cx('group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', colapsado && 'lg:justify-center lg:px-0', pagina === m.id ? 'text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg')}>
      {pagina === m.id && <motion.span layoutId="nav" className="absolute inset-0 rounded-xl border border-primario/30 bg-gradient-to-r from-primario/25 to-violeta/10" />}
      <span className={cx('relative shrink-0', pagina === m.id && 'text-primario')}>{m.icon}</span>
      <span className={cx('relative truncate whitespace-nowrap', colapsado && 'lg:hidden')}>{m.label}</span>
      {m.id === 'ia' && <span className={cx('relative ml-auto rounded-full bg-violeta/20 px-1.5 text-[9px] font-bold text-cian', colapsado && 'lg:hidden')}>IA</span>}
      {colapsado && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-fg/10 px-2.5 py-1.5 text-xs font-medium text-fg opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-visible:opacity-100 lg:block" style={{ background: 'var(--bg2)' }}>{m.label}</span>}
    </button>
  )
  const visibles = MENU.filter((m) => permitidas.includes(m.id))
  if (presentacion) return (
    <div className="presentacion min-h-full p-6"><Fondo />
      <button onClick={() => togglePres(false)} className="no-print fixed right-4 top-4 z-40 flex items-center gap-2 rounded-xl bg-fg/10 px-3 py-2 text-xs backdrop-blur hover:bg-fg/20"><Minimize2 size={14} />Salir (Esc)</button>
      <div className="mx-auto max-w-[1500px]">{children}</div>
    </div>
  )
  return (
    <div className="flex min-h-full"><Fondo />
      <Paleta abierta={paleta} cerrar={() => setPaleta(false)} />
      <Asistente />
      {movil && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMovil(false)} />}
      <aside className={cx('glass fixed inset-y-3 left-3 z-40 flex flex-col p-3 transition-[width,transform] duration-300 lg:sticky lg:left-auto lg:top-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)] lg:shrink-0 lg:translate-x-0', colapsado ? 'w-64 lg:w-[76px]' : 'w-64', movil ? 'translate-x-0' : '-translate-x-[120%]')}>
        <div className={cx('flex h-11 shrink-0 items-center px-1', colapsado && 'lg:justify-center lg:px-0')}>
          <span className={cx(colapsado && 'lg:hidden')}><Logo size={34} /></span>
          {colapsado && <span className="hidden lg:block"><Logo size={36} texto={false} /></span>}
          <button aria-label="Cerrar menú" onClick={() => setMovil(false)} className="ml-auto rounded-lg p-1.5 text-muted hover:bg-fg/10 lg:hidden"><ChevronsLeft size={18} /></button>
        </div>
        <div className="my-3 h-px shrink-0 bg-fg/10" />
        <nav className={cx('-mx-1 flex min-h-0 flex-1 flex-col gap-1 px-1', !colapsado && 'overflow-y-auto')}>{visibles.filter((m) => m.id !== 'configuracion').map(item)}</nav>
        <div className="mt-3 shrink-0 space-y-1 border-t border-fg/10 pt-3">
          {visibles.filter((m) => m.id === 'configuracion').map(item)}
          <div className={cx('rounded-xl bg-fg/5 px-3 py-2 text-xs', colapsado && 'lg:hidden')}><div className="truncate font-semibold">{empresa.nombre || 'Mi empresa'}</div><div className="truncate text-muted">{plural(SUCURSALES.length, 'sucursal', 'sucursales')} · {plural(new Set(SUCURSALES.map((s) => s.pais)).size, 'país', 'países')}</div></div>
          <button onClick={() => setColapsado(!colapsado)} aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'} className={cx('group relative hidden w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted transition hover:bg-fg/5 hover:text-fg lg:flex', colapsado && 'justify-center px-0')}>
            <ChevronsLeft size={18} className={cx('shrink-0 transition-transform duration-300', colapsado && 'rotate-180')} />{!colapsado && <span className="whitespace-nowrap">Contraer menú</span>}
            {colapsado && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-fg/10 px-2.5 py-1.5 text-xs text-fg opacity-0 shadow-xl transition group-hover:opacity-100" style={{ background: 'var(--bg2)' }}>Expandir menú</span>}
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-3">
        <header className="glass no-print sticky top-3 z-20 mx-3 mt-3 flex items-center gap-2 px-3 py-2 lg:ml-0">
          <button aria-label="Abrir menú" className="rounded-lg p-2 hover:bg-fg/10 lg:hidden" onClick={() => setMovil(true)}><Menu size={18} /></button>
          <button onClick={() => setPaleta(true)} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-fg/5 px-3 py-2 text-left text-sm text-muted hover:bg-fg/10 sm:max-w-md"><Search size={15} /><span className="truncate">Buscar en NEXORA…</span><kbd className="ml-auto hidden rounded border border-fg/20 px-1.5 text-[10px] sm:block">Ctrl K</kbd></button>
          <select aria-label="Sucursal" value={sucursal} onChange={(e) => setSucursal(e.target.value as typeof sucursal)} className="inp hidden !w-auto shrink-0 md:block"><option value="TODAS">Todas las sucursales</option>{SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}</select>
          <button title="Modo presentación" onClick={() => togglePres(true)} aria-label="Modo presentación" className="hidden shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium hover:bg-fg/10 sm:flex"><Maximize2 size={15} /><span className="hidden 2xl:inline">Presentación</span></button>
          <button aria-label="Cambiar tema" onClick={() => setTema(tema === 'oscuro' ? 'claro' : 'oscuro')} className="rounded-xl p-2 hover:bg-fg/10">{tema === 'oscuro' ? <Sun size={17} /> : <Moon size={17} />}</button>
          <div className="relative">
            <button aria-label="Notificaciones" onClick={() => setNotif(!notif)} className="relative rounded-xl p-2 hover:bg-fg/10"><Bell size={17} />{alertas.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-peligro" />}</button>
            {notif && <div className="glass absolute right-0 top-11 w-72 p-2" style={{ background: 'color-mix(in srgb, var(--bg2) 92%, transparent)' }}>{alertas.length ? alertas.map((a, k) => <div key={k} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-fg/5"><span className={cx('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', a.t === 'rojo' ? 'bg-peligro' : 'bg-alerta')} />{a.m}</div>) : <div className="p-2 text-xs text-muted">Sin alertas</div>}</div>}
          </div>
          <div className="flex items-center gap-2 border-l border-fg/10 pl-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primario to-violeta text-xs font-bold text-black">{usuario.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
            <div className="hidden leading-tight xl:block"><div className="text-xs font-semibold">{usuario.nombre}</div><div className="text-[10px] text-muted">{usuario.rol}</div></div>
            <button aria-label="Cerrar sesión" onClick={logout} className="rounded-lg p-2 text-muted hover:bg-fg/10 hover:text-peligro"><LogOut size={16} /></button>
          </div>
        </header>
        <main className="mx-3 mt-5 mb-10 min-w-0 lg:ml-0"><motion.div key={pagina} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>{children}</motion.div></main>
      </div>
    </div>
  )
}
