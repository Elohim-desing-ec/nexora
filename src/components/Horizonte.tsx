import { cx } from './ui'

/** Firma visual de NEXORA: horizonte dorado (un "eclipse" de luz) con un destello que recorre el borde. */
export function Horizonte({ tamano = 1400, className, style }: { tamano?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cx('horizonte', className)} style={{ ['--d' as string]: `${tamano}px`, ...style }} aria-hidden>
      <div className="horizonte-halo animate-destello" />
      <div className="horizonte-disco" />
      <div className="horizonte-brillo animate-barrido" />
      <div className="horizonte-barrido animate-barrido" />
    </div>
  )
}
