import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Send, Sparkles, X } from 'lucide-react'
import { useApp, PERMISOS } from '../store/useApp'
import { useEcon } from '../store/useEcon'
import { asistente, SUGERENCIAS, type Resp } from '../lib/asistente'
import { cx } from './ui'

interface Msg { de: 'yo' | 'ia'; r: Resp }

/** Chat flotante disponible en todas las páginas. */
export function Asistente() {
  const app = useApp(), econ = useEcon()
  const [abierto, setAbierto] = useState(false), [q, setQ] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const fin = useRef<HTMLDivElement>(null)
  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, abierto])
  if (!app.usuario) return null
  const u = app.usuario
  const enviar = (texto: string) => {
    if (!texto.trim()) return
    const r = asistente(texto, { productos: app.productos, movimientos: app.movimientos, ordenes: app.ordenes, proveedores: app.proveedores, sucursales: app.sucursales, empresa: app.empresa, rol: u.rol, nombre: u.nombre, p: econ.p })
    setMsgs((m) => [...m, { de: 'yo', r: { texto } }, { de: 'ia', r }]); setQ('')
  }
  const inicio: Msg = { de: 'ia', r: { texto: `Hola, ${u.nombre.split(' ')[0]} 👋 Pregúnteme cómo usar NEXORA o consulte sus datos.`, sugerencias: SUGERENCIAS } }
  return (
    <div className="no-print">
      <AnimatePresence>
        {abierto && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ type: 'spring', duration: 0.4 }}
            className="glass fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden" style={{ background: 'color-mix(in srgb, var(--bg2) 90%, transparent)' }}>
            <header className="flex items-center gap-3 border-b border-fg/10 p-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primario to-violeta text-black"><Sparkles size={18} /></div>
              <div className="flex-1"><div className="text-sm font-semibold">Asistente NEXORA</div><div className="flex items-center gap-1 text-[11px] text-exito"><span className="h-1.5 w-1.5 rounded-full bg-exito" />En línea · funciona sin internet</div></div>
              <button aria-label="Cerrar asistente" onClick={() => setAbierto(false)} className="rounded-lg p-1 hover:bg-fg/10"><X size={16} /></button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {[inicio, ...msgs].map((m, k) => (
                <div key={k} className={cx('flex', m.de === 'yo' && 'justify-end')}>
                  <div className={cx('max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm', m.de === 'yo' ? 'rounded-br-md bg-gradient-to-r from-primario to-violeta text-black' : 'rounded-bl-md bg-fg/5')}>
                    <p className="whitespace-pre-line leading-relaxed">{m.r.texto}</p>
                    {m.r.ir && PERMISOS[u.rol].includes(m.r.ir.pagina) && <button onClick={() => { if (m.r.ir!.tab) econ.setTab(m.r.ir!.tab); app.ir(m.r.ir!.pagina); setAbierto(false) }} className="mt-2 flex items-center gap-1 text-xs font-semibold text-cian hover:underline">{m.r.ir.label}<ArrowRight size={12} /></button>}
                    {m.r.sugerencias && k === msgs.length && <div className="mt-2 flex flex-wrap gap-1.5">{m.r.sugerencias.map((s) => <button key={s} onClick={() => enviar(s)} className="rounded-full border border-fg/15 px-2.5 py-1 text-xs hover:bg-fg/10">{s}</button>)}</div>}
                  </div>
                </div>
              ))}
              <div ref={fin} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); enviar(q) }} className="flex gap-2 border-t border-fg/10 p-3">
              <input autoFocus className="inp" placeholder="Escriba su pregunta…" value={q} onChange={(e) => setQ(e.target.value)} />
              <button aria-label="Enviar" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-primario to-violeta text-black disabled:opacity-40" disabled={!q.trim()}><Send size={16} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button aria-label="Abrir asistente" onClick={() => setAbierto(!abierto)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primario via-secundario to-violeta text-black shadow-[0_10px_40px_-5px_rgba(212,175,55,.55)]">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-violeta/30 [animation-duration:3s]" />
        {abierto ? <X size={22} /> : <Sparkles size={22} />}
      </motion.button>
    </div>
  )
}
