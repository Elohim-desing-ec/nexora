import { useId } from 'react'

/** Isotipo: "N" formada por dos trazos con degradado azul → violeta + wordmark. */
export function Logo({ size = 32, texto = true }: { size?: number; texto?: boolean }) {
  const id = `nx${useId().replace(/:/g, '')}` // id único: evita que dos logos compartan el degradado
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D4AF37" /><stop offset="1" stopColor="#B07D26" /></linearGradient></defs>
        <rect width="64" height="64" rx="16" fill={`url(#${id})`} opacity=".14" />
        <path d="M16 48V16l16 20" stroke={`url(#${id})`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M32 28l16 20V16" stroke="#F3D58A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".85" />
      </svg>
      {texto && <div className="leading-none"><div className="texto-oro font-display text-lg font-bold tracking-[.22em]">NEXORA</div><div className="mt-0.5 text-[9px] uppercase tracking-[.18em] text-muted">Intelligent Operations</div></div>}
    </div>
  )
}
