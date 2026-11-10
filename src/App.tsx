import { useEffect, useState, lazy, Suspense, useCallback, useSyncExternalStore } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useApp, PERMISOS, hidratado } from './store/useApp'
import { setMoneda } from './lib/format'
import { SIMBOLOS } from './data/paises'
import { Fondo, Layout } from './components/Layout'
import { Logo } from './components/Logo'
import { Splash } from './components/Splash'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

const Productos = lazy(() => import('./pages/Productos'))
const Compras = lazy(() => import('./pages/Compras'))
const IA = lazy(() => import('./pages/IA'))
const Auditoria = lazy(() => import('./pages/Auditoria'))
const Reportes = lazy(() => import('./pages/Reportes'))
const Economico = lazy(() => import('./pages/Economico'))
const Configuracion = lazy(() => import('./pages/Configuracion'))
const RedGlobal = lazy(() => import('./pages/RedGlobal'))
const Bienvenida = lazy(() => import('./components/Bienvenida').then((m) => ({ default: m.Bienvenida })))
const Defensa = lazy(() => import('./pages/Defensa'))
const Landing = lazy(() => import('./pages/Landing'))
const Cargando = () => <div className="p-10 text-center text-muted">Cargando…</div>

/** Modo Defensa: herramienta independiente del sistema operativo (ruta #/defensa). */
function DefensaAparte() {
  return (
    <div className="min-h-full p-4 sm:p-6"><Fondo />
      <header className="glass mx-auto mb-6 flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3"><Logo size={32} /><span className="hidden border-l border-fg/10 pl-3 text-sm text-muted sm:block">Modo Defensa · práctica de la sustentación</span></div>
        <a href="#" className="flex items-center gap-1.5 rounded-xl bg-fg/5 px-3 py-2 text-xs font-medium hover:bg-fg/10"><ArrowLeft size={14} />Volver al sistema</a>
      </header>
      <div className="mx-auto max-w-[1500px]"><Suspense fallback={<Cargando />}><Defensa /></Suspense></div>
    </div>
  )
}

export default function App() {
  const { usuario, pagina, tema, empresa } = useApp()
  // IndexedDB carga de forma asíncrona: se espera antes de mostrar datos
  const listo = useSyncExternalStore((cb) => useApp.persist.onFinishHydration(cb), hidratado)
  setMoneda(SIMBOLOS[empresa.moneda] ?? empresa.moneda)
  const [hash, setHash] = useState(location.hash)
  const [intro, setIntro] = useState(true)
  const fin = useCallback(() => setIntro(false), [])
  useEffect(() => { document.documentElement.classList.toggle('dark', tema === 'oscuro') }, [tema])
  useEffect(() => { const h = () => setHash(location.hash); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h) }, [])

  let vista
  if (!listo) vista = null
  else if (hash === '#/defensa') vista = <DefensaAparte />
  else if (!usuario) vista = hash === '#/login' ? <Login /> : <Suspense fallback={null}><Landing /></Suspense>
  else {
    const p = PERMISOS[usuario.rol].includes(pagina) ? pagina : 'dashboard'
    const Pag = { dashboard: Dashboard, red: RedGlobal, productos: Productos, compras: Compras, ia: IA, auditoria: Auditoria, reportes: Reportes, economico: Economico, configuracion: Configuracion }[p]
    vista = <Layout><Suspense fallback={<Cargando />}><Pag />{usuario.rol === 'Gerente General' && !empresa.configurada && <Bienvenida />}</Suspense></Layout>
  }
  return <>{vista}<AnimatePresence>{intro && <Splash onFin={fin} />}</AnimatePresence></>
}
