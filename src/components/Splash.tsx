import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Horizonte } from './Horizonte'

/** Intro cinematográfica negro y oro: el horizonte dorado amanece, el isotipo se dibuja y aparece el wordmark. */
export function Splash({ onFin }: { onFin: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFin, 4200)
    const k = () => onFin()
    window.addEventListener('keydown', k)
    return () => { clearTimeout(t); window.removeEventListener('keydown', k) }
  }, [onFin])
  return (
    <motion.div onClick={onFin} className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-black" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.5 }}>
      {/* haces de luz */}
      <motion.div className="haz absolute -left-40 -top-40 h-[150%] w-[30rem] rotate-[24deg]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1.5 }} />
      {/* horizonte que amanece */}
      <motion.div className="absolute inset-x-0 bottom-0 h-[46vh]" initial={{ y: '60%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}>
        <Horizonte tamano={1700} className="top-[18%]" />
      </motion.div>
      <div className="relative flex h-full flex-col items-center justify-center pb-[18vh]">
        <motion.svg width="112" height="112" viewBox="0 0 64 64" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} style={{ filter: 'drop-shadow(0 0 26px rgba(212,175,55,.65))' }}>
          <defs><linearGradient id="sp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3CF" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#9C7420" /></linearGradient></defs>
          <motion.rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="url(#sp)" strokeWidth="1" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.55 }} transition={{ delay: 0.6, duration: 1.4, ease: 'easeInOut' }} />
          <motion.path d="M16 48V16l16 20" stroke="url(#sp)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.9, ease: 'easeInOut' }} />
          <motion.path d="M32 28l16 20V16" stroke="#F3D58A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.25, duration: 0.9, ease: 'easeInOut' }} />
        </motion.svg>
        <div className="mt-8 flex gap-[0.3em] font-display text-5xl font-bold tracking-[.22em] sm:text-7xl">
          {'NEXORA'.split('').map((l, k) => <motion.span key={k} className="texto-oro" initial={{ opacity: 0, y: 28, filter: 'blur(14px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 1.7 + k * 0.09, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>{l}</motion.span>)}
        </div>
        <motion.p className="mt-4 text-[11px] uppercase text-amber-100/70" initial={{ opacity: 0, letterSpacing: '1.1em' }} animate={{ opacity: 1, letterSpacing: '.55em' }} transition={{ delay: 2.4, duration: 0.9 }}>Intelligent Operations Suite</motion.p>
        <motion.p className="absolute bottom-8 text-[10px] tracking-[.35em] text-amber-100/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>EDICIÓN 2026 · CLIC PARA CONTINUAR</motion.p>
      </div>
    </motion.div>
  )
}
