import { useRef, type ReactNode } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Bot, Brain, FileBarChart2, Globe2, LineChart, ScanBarcode, ShieldCheck, Sparkles, TrendingDown, Workflow } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Horizonte } from '../components/Horizonte'
import { Fondo } from '../components/Layout'
import { Contador, cx } from '../components/ui'
import { useEcon } from '../store/useEcon'
import * as F from '../lib/finance'
import { money, num } from '../lib/format'

const suave = [0.16, 1, 0.3, 1] as const
const ingresar = () => { location.hash = '#/login' }

/** Aparece al entrar en pantalla (scroll reveal). */
function Revelar({ children, retraso = 0, className }: { children: ReactNode; retraso?: number; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8, delay: retraso, ease: suave }}>{children}</motion.div>
}
function Cifra({ valor, formato, titulo }: { valor: number; formato: (v: number) => string; titulo: string }) {
  const ref = useRef(null), visto = useInView(ref, { once: true })
  return <div ref={ref} className="text-center"><div className="texto-oro font-display text-4xl font-bold sm:text-5xl">{visto ? <Contador valor={valor} formato={formato} /> : formato(0)}</div><div className="mt-2 text-xs uppercase tracking-[.2em] text-muted">{titulo}</div></div>
}

/** Maqueta del panel de NEXORA (ilustración en HTML, no una captura). */
function Maqueta({ K, caue, nOpt }: { K: ReturnType<typeof F.indicadores>; caue: number[]; nOpt: number }) {
  const max = Math.max(...caue), min = Math.min(...caue)
  return (
    <div className="overflow-hidden rounded-2xl border border-primario/25 bg-[#070604]/95 shadow-[0_40px_120px_-30px_rgba(212,175,55,.45)]">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3"><Logo size={22} /><div className="ml-6 hidden gap-5 text-[11px] text-stone-400 sm:flex">{['Dashboard', 'Red global', 'Inventario', 'Compras', 'Reportes'].map((t, k) => <span key={t} className={k === 0 ? 'text-amber-200' : ''}>{t}</span>)}</div><div className="ml-auto h-6 w-6 rounded-full bg-gradient-to-br from-amber-200 to-amber-700" /></div>
      <div className="grid gap-3 p-4 sm:grid-cols-4">
        {[['Ahorro anual', money(K.A, 0)], ['VPN (5 años)', money(K.VPN, 0)], ['TIR', `${num(K.TIR * 100, 1)} %`], ['Recuperación', `${num(K.recSimple)} años`]].map(([t, v]) => <div key={t} className="rounded-xl border border-white/5 bg-white/[.03] p-3"><div className="text-[10px] text-stone-400">{t}</div><div className="mt-1 font-display text-lg font-semibold text-amber-100">{v}</div></div>)}
        <div className="rounded-xl border border-white/5 bg-white/[.03] p-3 sm:col-span-3"><div className="mb-3 flex justify-between text-[10px] text-stone-400"><span>CAUE de NEXORA según años de uso</span><span className="text-amber-200">Mínimo en n = {nOpt} → vida útil económica</span></div>
          <div className="flex h-28 items-end gap-1.5">{caue.map((v, k) => <motion.div key={k} title={money(v)} className={cx('flex-1 rounded-t bg-gradient-to-t', k + 1 === nOpt ? 'from-amber-600 via-amber-200 to-white shadow-[0_0_20px_rgba(255,214,120,.8)]' : 'from-amber-900 via-violeta to-primario')} initial={{ height: 0 }} whileInView={{ height: `${25 + ((v - min) / (max - min || 1)) * 75}%` }} viewport={{ once: true }} transition={{ delay: 0.3 + k * 0.05, duration: 0.8, ease: suave }} />)}</div></div>
        <div className="rounded-xl border border-white/5 bg-white/[.03] p-3"><div className="text-[10px] text-stone-400">Red global</div><GloboDibujo className="mx-auto mt-1 h-28 w-28" /></div>
      </div>
    </div>
  )
}

/** Globo dibujado en SVG con meridianos que giran (ilusión de rotación) y una ruta entre sucursales. */
function GloboDibujo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <defs><radialGradient id="gl" cx=".35" cy=".3"><stop offset="0" stopColor="#3a2a08" /><stop offset="1" stopColor="#050403" /></radialGradient></defs>
      <circle cx="60" cy="60" r="52" fill="url(#gl)" stroke="#D4AF37" strokeOpacity=".6" />
      {[-30, 0, 30].map((y) => <ellipse key={y} cx="60" cy={60 + y} rx={Math.sqrt(52 * 52 - y * y)} ry={5} fill="none" stroke="#D4AF37" strokeOpacity=".25" />)}
      {[0, 1, 2, 3].map((k) => <ellipse key={k} cx="60" cy="60" rx="52" ry="52" fill="none" stroke="#F3D58A" strokeOpacity=".35" className="meridiano" style={{ animationDelay: `${-k * 2}s` }} />)}
      <motion.path d="M38 70 Q60 20 86 46" fill="none" stroke="#FFF0C2" strokeWidth="1.6" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.5 }} />
      {[[38, 70], [86, 46], [70, 84]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.2" fill="#F3D58A" className="animate-destello" />)}
    </svg>
  )
}

function Bento({ icono, titulo, texto, children, className }: { icono: ReactNode; titulo: string; texto: string; children?: ReactNode; className?: string }) {
  return (
    <motion.div className={cx('glass glass-hover group relative overflow-hidden p-6', className)} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: suave }}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primario/10 blur-3xl transition group-hover:bg-primario/25" />
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-primario/30 bg-primario/10 text-cian">{icono}</div>
      <h3 className="font-display text-lg font-semibold">{titulo}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{texto}</p>
      {children && <div className="mt-5">{children}</div>}
    </motion.div>
  )
}

export default function Landing() {
  const p = useEcon((s) => s.p)
  const K = F.indicadores(p), R = F.reemplazo(p)
  const hero = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const panelY = useTransform(scrollYProgress, [0, 0.5], [0, -440])
  const panelRot = useTransform(scrollYProgress, [0, 0.55], [26, 0])
  const panelEsc = useTransform(scrollYProgress, [0, 0.55], [0.86, 1])
  const textoOp = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const textoY = useTransform(scrollYProgress, [0, 0.4], [0, -60])
  const arcoY = useTransform(scrollYProgress, [0, 0.5], [0, 120])
  const tarjeta = useRef<HTMLDivElement>(null)
  const { scrollYProgress: pt } = useScroll({ target: tarjeta, offset: ['start end', 'end start'] })
  const tarjetaRot = useTransform(pt, [0, 1], [-18, 18]), tarjetaRotX = useTransform(pt, [0, 1], [14, -10])
  const maxCaue = Math.max(R.def.caueMin, R.ret.caueMin)

  return (
    <div className="relative min-h-full overflow-x-clip"><Fondo />
      {/* Navegación */}
      <motion.nav className="fixed inset-x-0 top-0 z-40 border-b border-primario/10 bg-black/40 backdrop-blur-xl" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: suave }}>
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6"><Logo size={30} />
          <div className="ml-6 hidden gap-6 text-sm text-muted md:flex">{[['Funciones', '#funciones'], ['Objetivos', '#objetivos'], ['Economía', '#economia'], ['Cómo empezar', '#empezar']].map(([t, h]) => <a key={t} href={h} onClick={(e) => { e.preventDefault(); document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' }) }} className="transition hover:text-fg">{t}</a>)}</div>
          <button onClick={ingresar} className="ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-200 via-primario to-violeta px-5 py-2 text-sm font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,.6)] transition hover:brightness-110">Ingresar <ArrowRight size={15} /></button>
        </div>
      </motion.nav>

      {/* Hero con horizonte y panel que emerge al hacer scroll */}
      <section ref={hero} className="relative h-[200vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div className="absolute inset-x-0 h-[120vh]" style={{ y: arcoY, top: 'max(70vh, 660px)' }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2, ease: suave }}><Horizonte tamano={1800} className="top-0" /></motion.div>
          <motion.div style={{ opacity: textoOp, y: textoY }} className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pt-32 text-center sm:pt-36">
            <motion.button onClick={() => document.querySelector('#funciones')?.scrollIntoView({ behavior: 'smooth' })} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: suave }} className="flex items-center gap-2 rounded-full border border-primario/30 bg-black/40 p-1 pr-3 text-xs backdrop-blur">
              <span className="rounded-full bg-gradient-to-r from-amber-200 to-primario px-2.5 py-1 font-semibold text-black">Nuevo</span>Red global 3D y reportes inteligentes <ArrowRight size={13} /></motion.button>
            <h1 className="mt-7 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {['Inventario inteligente', 'para empresas', 'sin fronteras.'].map((l, k) => <motion.span key={l} className={cx('block', k === 2 && 'texto-oro')} initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.7 + k * 0.15, duration: 0.9, ease: suave }}>{l}</motion.span>)}
            </h1>
            <motion.p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 1 }}>NEXORA conecta todas sus sucursales, en cualquier país, en una sola plataforma: reduce pérdidas, automatiza las compras con IA y entrega reportes que dicen qué hacer.</motion.p>
            <motion.div className="mt-8 flex flex-wrap justify-center gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.8, ease: suave }}>
              <button onClick={ingresar} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-200 via-primario to-violeta px-6 py-3 text-sm font-semibold text-black shadow-[0_10px_40px_-8px_rgba(212,175,55,.7)] transition hover:brightness-110">Ingresar a NEXORA <ArrowRight size={16} /></button>
              <button onClick={() => document.querySelector('#funciones')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border border-fg/15 bg-fg/5 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-fg/10">Ver cómo funciona</button>
            </motion.div>
          </motion.div>
          <motion.div style={{ y: panelY, rotateX: panelRot, scale: panelEsc, transformPerspective: 1400, top: 'max(80vh, 760px)' }} className="absolute inset-x-0 z-20 mx-auto max-w-5xl origin-top px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1.2 }}><Maqueta K={K} caue={R.ret.filas.map((f) => f.caue)} nOpt={R.ret.nOpt} /></motion.div>
        </div>
      </section>

      {/* Cifras */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Revelar><p className="mb-10 text-center text-xs uppercase tracking-[.3em] text-muted">Resultados del caso base del análisis económico</p></Revelar>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <Cifra valor={(K.A / F.totalActual(p)) * 100} formato={(v) => `−${num(v, 0)} %`} titulo="Costos operativos" />
          <Cifra valor={K.recSimple} formato={(v) => `${num(v, 2)} años`} titulo="Recuperación" />
          <Cifra valor={K.TIR * 100} formato={(v) => `${num(v, 1)} %`} titulo="Tasa interna de retorno" />
          <Cifra valor={47} formato={(v) => num(v, 0)} titulo="Países soportados" />
        </div>
      </section>

      {/* Funciones (bento) */}
      <section id="funciones" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-20">
        <Revelar className="mx-auto mb-12 max-w-2xl text-center"><h2 className="font-display text-3xl font-bold sm:text-5xl">Todo su negocio, <span className="texto-oro">en un solo lugar</span></h2><p className="mt-4 text-muted">Diseñado para una tienda o para una red multinacional.</p></Revelar>
        <div className="grid gap-4 md:grid-cols-3">
          <Bento className="md:col-span-2" icono={<Globe2 size={20} />} titulo="Red global en 3D" texto="Todas sus sucursales sobre un globo terráqueo real: gírelo, acérquese hasta la calle y vea las transferencias entre países con tipos de cambio del día.">
            <div className="flex items-center gap-6"><GloboDibujo className="h-36 w-36 shrink-0" /><ul className="space-y-2 text-sm text-muted">{['Sucursales ilimitadas en cualquier país', 'Direcciones reales de OpenStreetMap', 'Vista oscura, clara y satélite'].map((t) => <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primario" />{t}</li>)}</ul></div>
          </Bento>
          <Bento icono={<Brain size={20} />} titulo="IA predictiva" texto="Pronóstico de demanda a 30 días, punto de reorden y compras sugeridas en un clic.">
            <svg viewBox="0 0 200 60" className="w-full"><motion.path d="M0 50 C30 45 40 20 70 28 S110 50 130 30 S170 8 200 12" fill="none" stroke="#D4AF37" strokeWidth="2.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.8 }} /><path d="M130 30 S170 8 200 12" fill="none" stroke="#F3D58A" strokeWidth="2.5" strokeDasharray="4 5" /></svg>
          </Bento>
          <Bento icono={<FileBarChart2 size={20} />} titulo="Reportes inteligentes" texto="El sistema analiza sus datos y le dice qué hacer: quiebres, mermas, sobrestock y productos por vencer.">
            <div className="space-y-1.5 text-xs">{[['Crítico', 'bg-peligro'], ['Alerta', 'bg-alerta'], ['Oportunidad', 'bg-primario']].map(([t, c], k) => <motion.div key={t} className="flex items-center gap-2 rounded-lg bg-fg/5 px-2.5 py-1.5" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + k * 0.15 }}><span className={cx('h-2 w-2 rounded-full', c)} />{t}</motion.div>)}</div>
          </Bento>
          <Bento icono={<ScanBarcode size={20} />} titulo="Inventario y kardex" texto="Stock por sucursal, costo promedio ponderado, lotes, vencimientos, códigos de barras y QR." />
          <Bento icono={<Bot size={20} />} titulo="Asistente NEXORA" texto="Pregunte en lenguaje natural: «¿cuánto stock hay de café?», «¿cómo registro una venta?»." />
        </div>
      </section>

      {/* Objetivos + tarjeta dorada 3D */}
      <section id="objetivos" className="relative mx-auto grid max-w-7xl scroll-mt-24 items-center gap-12 px-4 py-24 lg:grid-cols-2">
        <div>
          <Revelar><h2 className="font-display text-3xl font-bold sm:text-5xl">Tres objetivos.<br /><span className="texto-oro">Un sistema.</span></h2></Revelar>
          <div className="mt-8 space-y-4">{([[<TrendingDown key="a" size={18} />, 'Reducir las pérdidas', 'Kardex, control de mermas y vencimientos, y detección de anomalías con IA.'], [<Workflow key="b" size={18} />, 'Automatizar los procesos', 'Reorden automático, órdenes con aprobación y carga masiva desde Excel.'], [<LineChart key="c" size={18} />, 'Generar reportes inteligentes', 'Hallazgos con acciones recomendadas, en PDF y Excel con fórmulas reales.']] as const).map(([i, t, d], k) => (
            <Revelar key={t} retraso={k * 0.12}><div className="flex gap-4 rounded-2xl border border-primario/15 bg-fg/[.03] p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-200 to-violeta text-black">{i}</div><div><div className="font-semibold">{t}</div><p className="text-sm text-muted">{d}</p></div></div></Revelar>))}</div>
        </div>
        <div ref={tarjeta} className="relative flex justify-center [perspective:1200px]">
          <motion.div style={{ rotateY: tarjetaRot, rotateX: tarjetaRotX }} className="relative aspect-[1.6] w-full max-w-md rounded-3xl bg-gradient-to-br from-amber-100 via-primario to-violeta p-[1px] shadow-[0_50px_120px_-30px_rgba(212,175,55,.6)]">
            <div className="flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-[#2b1f07] via-[#120d04] to-black p-7">
              <div className="flex items-center justify-between"><Logo size={26} /><Sparkles className="text-cian" size={20} /></div>
              <div><div className="text-xs uppercase tracking-[.25em] text-amber-100/60">Ahorro anual con NEXORA</div><div className="texto-oro mt-1 font-display text-5xl font-bold">{money(K.A, 0)}</div></div>
              <div className="flex justify-between text-xs text-amber-100/70"><span>VPN {money(K.VPN, 0)}</span><span>TIR {num(K.TIR * 100, 1)} %</span><span>{num(K.recSimple)} años</span></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Economía: veredicto */}
      <section id="economia" className="relative mx-auto max-w-5xl scroll-mt-24 px-4 py-20">
        <Revelar className="text-center"><h2 className="font-display text-3xl font-bold sm:text-5xl">La decisión, <span className="texto-oro">con números</span></h2><p className="mx-auto mt-4 max-w-2xl text-muted">Costo anual uniforme equivalente (CAUE) del software antiguo frente a NEXORA, con TMAR del {num(p.i * 100, 0)} %.</p></Revelar>
        <Revelar retraso={0.15}><div className="glass mt-10 space-y-6 p-6 sm:p-8">
          {[['Software actual (defensor)', R.def.caueMin, 'from-stone-600 to-stone-400'], ['NEXORA (retador)', R.ret.caueMin, 'from-violeta via-primario to-amber-100']].map(([t, v, c]) => <div key={t as string}>
            <div className="mb-2 flex justify-between text-sm"><span>{t}</span><span className="font-semibold tnum">{money(v as number)} / año</span></div>
            <div className="h-4 overflow-hidden rounded-full bg-fg/5"><motion.div className={cx('h-full rounded-full bg-gradient-to-r', c as string)} initial={{ width: 0 }} whileInView={{ width: `${((v as number) / maxCaue) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.4, ease: suave }} /></div></div>)}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-fg/10 pt-6"><div><div className="text-xs uppercase tracking-[.25em] text-muted">Veredicto</div><div className="texto-oro font-display text-3xl font-bold">{R.veredicto}</div></div><div className="text-right text-sm text-muted">Ahorro equivalente<div className="font-display text-2xl font-bold text-fg">{money(R.def.caueMin - R.ret.caueMin)}</div></div></div>
        </div></Revelar>
      </section>

      {/* Cómo empezar */}
      <section id="empezar" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
        <Revelar className="text-center"><h2 className="font-display text-3xl font-bold sm:text-5xl">Empiece <span className="texto-oro">hoy</span></h2></Revelar>
        <div className="mt-10 grid gap-4 md:grid-cols-3">{[['01', 'Configure su empresa', 'País, moneda, identificación fiscal y sucursales ubicadas en el mapa.'], ['02', 'Cargue sus datos', 'Productos con la plantilla de Excel, proveedores y su equipo con roles.'], ['03', 'Opere y decida', 'Registre ventas y compras; la IA y los reportes hacen el resto.']].map(([n, t, d], k) => (
          <Revelar key={n} retraso={k * 0.12}><div className="glass glass-hover h-full p-6"><div className="texto-oro font-display text-4xl font-bold">{n}</div><div className="mt-3 font-semibold">{t}</div><p className="mt-1 text-sm text-muted">{d}</p></div></Revelar>))}</div>
      </section>

      {/* Llamado final con horizonte */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        <Horizonte tamano={1600} className="top-[48%]" />
        <Revelar className="relative z-10 mx-auto max-w-3xl px-4 pt-20 text-center">
          <ShieldCheck className="mx-auto mb-4 text-cian" size={30} />
          <h2 className="font-display text-4xl font-bold sm:text-6xl">Su operación, <span className="texto-oro">iluminada.</span></h2>
          <button onClick={ingresar} className="mx-auto mt-8 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-200 via-primario to-violeta px-7 py-3 text-sm font-semibold text-black shadow-[0_10px_40px_-8px_rgba(212,175,55,.7)] transition hover:brightness-110">Ingresar a NEXORA <ArrowRight size={16} /></button>
        </Revelar>
      </section>
      <footer className="relative border-t border-primario/10 bg-black/60 px-4 py-10 text-sm text-muted backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-6"><div><Logo size={26} /><p className="mt-3 max-w-xs text-xs">Proyecto de Ingeniería Económica · Análisis de reemplazo y depreciación · 2026</p></div>
          <div className="text-xs"><div className="mb-2 font-semibold text-fg">Equipo</div><ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">{['Kattia Arreaga Castro', 'Emilio Espinoza Escobar', 'Holger Ferruzola Lucas', 'Emily Hidalgo Castro', 'Eduardo Lara Pincay', 'Christopher Martínez Bastidas'].map((n) => <li key={n}>{n}</li>)}</ul></div></div>
      </footer>
    </div>
  )
}
