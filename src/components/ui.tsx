import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { AnimatePresence, motion, animate } from 'framer-motion'
import katex from 'katex'
import { X } from 'lucide-react'

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ')
export { cx }

export function Card({ children, className, hover, titulo, accion }: { children: ReactNode; className?: string; hover?: boolean; titulo?: ReactNode; accion?: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 26, scale: 0.985 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className={cx('glass min-w-0 p-5', hover && 'glass-hover', className)}>
      {(titulo || accion) && <header className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold tracking-tight">{titulo}</h3>{accion}</header>}
      {children}
    </motion.section>
  )
}

type Variante = 'primario' | 'vidrio' | 'peligro' | 'exito' | 'fantasma'
export function Button({ variante = 'vidrio', className, children, ...r }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  const v: Record<Variante, string> = {
    primario: 'bg-gradient-to-r from-primario to-violeta text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,.55)] hover:brightness-110',
    vidrio: 'bg-fg/5 border border-fg/10 hover:bg-fg/10',
    peligro: 'bg-peligro/15 text-peligro border border-peligro/30 hover:bg-peligro/25',
    exito: 'bg-exito/15 text-exito border border-exito/30 hover:bg-exito/25',
    fantasma: 'hover:bg-fg/10',
  }
  return <button {...r} className={cx('inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition active:scale-[.98] disabled:opacity-40', v[variante], className)}>{children}</button>
}

export function Campo({ label, children, ayuda }: { label: string; children: ReactNode; ayuda?: string }) {
  return <label className="block space-y-1"><span className="text-xs font-medium text-muted">{label}</span>{children}{ayuda && <span className="block text-[11px] text-muted/80">{ayuda}</span>}</label>
}

/** Input numérico que acepta coma decimal. */
export function NumInput({ value, onChange, step = 1, min, max, className }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; className?: string }) {
  const [txt, setTxt] = useState(String(value))
  useEffect(() => { if (parseFloat(txt.replace(',', '.')) !== value) setTxt(String(value)) }, [value]) // eslint-disable-line
  return <input className={cx('inp', className)} inputMode="decimal" type="number" step={step} min={min} max={max} value={txt}
    onChange={(e) => { setTxt(e.target.value); const v = parseFloat(e.target.value.replace(',', '.')); if (Number.isFinite(v)) onChange(v) }} />
}

const tonos = { azul: 'bg-primario/15 text-primario border-primario/30', verde: 'bg-exito/15 text-exito border-exito/30', ambar: 'bg-alerta/15 text-alerta border-alerta/30', rojo: 'bg-peligro/15 text-peligro border-peligro/30', violeta: 'bg-violeta/15 text-cian border-violeta/30', gris: 'bg-fg/5 text-muted border-fg/10', cian: 'bg-cian/15 text-cian border-cian/30' }
export type Tono = keyof typeof tonos
export const Badge = ({ tono = 'gris', children }: { tono?: Tono; children: ReactNode }) => <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', tonos[tono])}>{children}</span>

export function Tabs<T extends string>({ items, valor, onChange }: { items: { id: T; label: string; icon?: ReactNode }[]; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="glass flex gap-1 overflow-x-auto p-1.5" role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" aria-selected={valor === t.id} onClick={() => onChange(t.id)} className={cx('relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition', valor === t.id ? 'font-semibold text-black' : 'text-muted hover:text-fg')}>
          {valor === t.id && <motion.span layoutId={`tab-${items[0].id}`} className="absolute inset-0 rounded-xl bg-gradient-to-r from-primario to-violeta" transition={{ type: 'spring', duration: 0.4 }} />}
          <span className="relative flex items-center gap-1.5">{t.icon}{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Modal({ abierto, onClose, titulo, children, ancho = 'max-w-3xl' }: { abierto: boolean; onClose: () => void; titulo: ReactNode; children: ReactNode; ancho?: string }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[6vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div role="dialog" aria-modal className={cx('glass w-full p-6', ancho)} style={{ background: 'color-mix(in srgb, var(--bg2) 88%, transparent)' }} initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}>
            <div className="mb-4 flex items-start justify-between gap-4"><h2 className="text-lg font-semibold">{titulo}</h2><button aria-label="Cerrar" onClick={onClose} className="rounded-lg p-1 hover:bg-fg/10"><X size={18} /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Contador animado para KPIs. */
export function Contador({ valor, formato }: { valor: number; formato: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  useEffect(() => {
    const c = animate(prev.current, valor, { duration: 0.9, ease: 'easeOut', onUpdate: (v) => { if (ref.current) ref.current.textContent = formato(v) } })
    prev.current = valor
    return () => c.stop()
  }, [valor, formato])
  return <span ref={ref} className="tnum">{formato(valor)}</span>
}

export function Kpi({ titulo, valor, formato, icono, tono = 'azul', sub }: { titulo: string; valor: number; formato: (v: number) => string; icono: ReactNode; tono?: 'azul' | 'verde' | 'ambar' | 'rojo' | 'violeta' | 'cian'; sub?: ReactNode }) {
  const g = { azul: 'from-primario/30', verde: 'from-exito/30', ambar: 'from-alerta/30', rojo: 'from-peligro/30', violeta: 'from-violeta/30', cian: 'from-cian/30' }[tono]
  return (
    <Card hover className="relative overflow-hidden">
      <div className={cx('pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-2xl', g)} />
      <div className="flex items-center justify-between text-muted"><span className="text-xs font-medium">{titulo}</span><span className="rounded-lg bg-fg/5 p-1.5">{icono}</span></div>
      <div className="mt-2 text-2xl font-bold tracking-tight"><Contador valor={valor} formato={formato} /></div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Card>
  )
}

export function Tex({ tex, block }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block })
  return <span className={block ? 'block overflow-x-auto py-1' : ''} dangerouslySetInnerHTML={{ __html: html }} />
}

export function Titulo({ titulo, sub, children }: { titulo: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-2xl font-bold tracking-tight sm:text-[1.7rem]">{titulo}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export const Scroll = ({ children }: { children: ReactNode }) => <div className="-mx-2 overflow-x-auto px-2">{children}</div>
