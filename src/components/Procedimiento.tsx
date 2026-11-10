import { useState } from 'react'
import { Sigma } from 'lucide-react'
import { Button, Modal, Tex } from './ui'
import type { Proc } from '../lib/procedimientos'
import { num } from '../lib/format'

/** Contenido del procedimiento: fórmula general, sustituida, factores (4 decimales) e interpretación. */
export function ProcContenido({ proc }: { proc: Proc }) {
  return (
    <div className="space-y-4 text-sm">
      <section><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-cian">1 · Fórmula general</h4><div className="rounded-xl bg-fg/5 p-3">{proc.general.map((g, k) => <Tex key={k} tex={g} block />)}</div></section>
      <section><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-cian">2 · Sustitución con los valores actuales</h4><div className="rounded-xl bg-fg/5 p-3">{proc.sustituida.map((g, k) => <Tex key={k} tex={g} block />)}</div></section>
      {proc.factores.length > 0 && (
        <section><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-cian">3 · Factores utilizados</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{proc.factores.map((f, k) => <div key={k} className="rounded-lg bg-fg/5 px-2 py-1.5 text-xs"><div className="text-muted">{f.nombre}</div><div className="font-semibold tnum">{num(f.valor, 4)}</div></div>)}</div>
        </section>
      )}
      <section className="rounded-xl border border-exito/30 bg-exito/10 p-3"><div className="text-xs font-semibold uppercase text-exito">Resultado: {proc.resultado}</div><p className="mt-1 leading-relaxed">{proc.interpretacion}</p></section>
    </div>
  )
}

export function VerProc({ proc, label = 'Ver procedimiento' }: { proc: Proc; label?: string }) {
  const [a, setA] = useState(false)
  return (
    <>
      <Button variante="fantasma" className="!px-2 !py-1 text-xs text-cian" onClick={() => setA(true)}><Sigma size={14} />{label}</Button>
      <Modal abierto={a} onClose={() => setA(false)} titulo={proc.titulo}><ProcContenido proc={proc} /></Modal>
    </>
  )
}
