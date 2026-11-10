import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Calculator, Dices, Eye, EyeOff, GraduationCap, MessageCircleQuestion, Search, Sparkles } from 'lucide-react'
import { useEcon } from '../store/useEcon'
import { useApp } from '../store/useApp'
import { Badge, Button, Campo, Card, NumInput, Tex, Titulo, cx } from '../components/ui'
import { ProcContenido } from '../components/Procedimiento'
import { PREGUNTAS, numeros, responder, type Pregunta } from '../lib/preguntas'
import { ejercicioAleatorio, type Ejercicio } from '../lib/sorpresa'
import { FACTORES, type Factor } from '../lib/finance'
import { L, num } from '../lib/format'

const NOMBRES: Record<Factor, [string, string]> = {
  PF: ['(P/F)', '\\dfrac{1}{(1+i)^n}'], FP: ['(F/P)', '(1+i)^n'], AP: ['(A/P)', '\\dfrac{i(1+i)^n}{(1+i)^n-1}'],
  PA: ['(P/A)', '\\dfrac{(1+i)^n-1}{i(1+i)^n}'], AF: ['(A/F)', '\\dfrac{i}{(1+i)^n-1}'], FA: ['(F/A)', '\\dfrac{(1+i)^n-1}{i}'],
}

function Calculadora() {
  const [i, setI] = useState(12), [n, setN] = useState(5), [monto, setMonto] = useState(1000)
  const r = i / 100
  return <Card titulo={<span className="flex items-center gap-2"><Calculator size={15} className="text-cian" />Calculadora libre de factores</span>}>
    <div className="grid grid-cols-3 gap-2"><Campo label="i (%)"><NumInput step={0.5} value={i} onChange={setI} /></Campo><Campo label="n (años)"><NumInput min={1} value={n} onChange={(v) => setN(Math.max(1, Math.round(v)))} /></Campo><Campo label="Monto"><NumInput step={100} value={monto} onChange={setMonto} /></Campo></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{(Object.keys(FACTORES) as Factor[]).map((f) => { const v = FACTORES[f](r, n); return (
      <div key={f} className="rounded-xl bg-fg/5 p-3"><div className="flex items-center justify-between"><b>{NOMBRES[f][0]}</b><span className="text-lg font-bold text-cian tnum">{num(v, 4)}</span></div>
        <Tex tex={`${NOMBRES[f][1]} = ${L(v, 4)}`} block /><div className="text-xs text-muted tnum">{num(monto, 2)} × {num(v, 4)} = <b className="text-fg">{num(monto * v, 2)}</b></div></div>) })}</div>
  </Card>
}

function Sorpresa() {
  const [e, setE] = useState<Ejercicio | null>(null), [ver, setVer] = useState(false)
  return <Card titulo={<span className="flex items-center gap-2"><Dices size={15} className="text-violeta" />Pregunta sorpresa</span>} accion={<Button variante="primario" onClick={() => { setE(ejercicioAleatorio()); setVer(false) }}><Sparkles size={15} />Generar ejercicio</Button>}>
    {!e ? <p className="text-sm text-muted">Genera un ejercicio aleatorio de reemplazo o depreciación con valores realistas para practicar la defensa.</p> : <div className="space-y-3">
      <Badge tono="violeta">{e.tipo}</Badge><p className="text-sm leading-relaxed">{e.enunciado}</p>
      <Button onClick={() => setVer(!ver)}>{ver ? <EyeOff size={15} /> : <Eye size={15} />}{ver ? 'Ocultar solución' : 'Mostrar solución'}</Button>
      {ver && <ol className="space-y-2">{e.pasos.map((s, k) => <li key={k} className="rounded-lg bg-fg/5 p-3 text-sm"><span className="mr-2 text-xs font-bold text-cian">Paso {k + 1}</span>{s.texto}{s.tex && <Tex tex={s.tex} block />}</li>)}
        <li className="rounded-lg border border-exito/30 bg-exito/10 p-3 text-sm font-semibold">{e.respuesta}</li></ol>}
    </div>}
  </Card>
}

export default function Defensa() {
  const p = useEcon((s) => s.p), setTab = useEcon((s) => s.setTab), ir = useApp((s) => s.ir)
  const [q, setQ] = useState(''), [enviada, setEnviada] = useState('')
  const [cat, setCat] = useState('Conceptos')
  useEffect(() => { const s = sessionStorage.getItem('nx-q'); if (s) { sessionStorage.removeItem('nx-q'); setQ(s); setEnviada(s) } }, [])
  const res = useMemo(() => (enviada ? responder(enviada, p) : null), [enviada, p])
  const cats = [...new Set(PREGUNTAS.map((x) => x.cat))]
  const preguntar = (x: Pregunta | string) => { const t = typeof x === 'string' ? x : x.pregunta; setQ(t); setEnviada(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return (
    <div className="space-y-5">
      <Titulo titulo="Modo Defensa" sub={`${PREGUNTAS.length} preguntas · respuestas calculadas con los valores actuales del sistema`}><Badge tono="cian"><GraduationCap size={12} />Ingeniería Económica · Unidad 4</Badge></Titulo>
      <Card className="relative overflow-hidden"><div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primario/30 blur-3xl" />
        <form onSubmit={(e) => { e.preventDefault(); setEnviada(q) }} className="relative flex gap-2">
          <div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input autoFocus className="inp !py-3 pl-10 text-base" placeholder="Escriba la pregunta de la docente… ej.: ¿qué pasa si la TMAR sube a 18 %?" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Button variante="primario" type="submit" className="!px-5">Responder</Button>
        </form>
        {enviada && !res && <p className="mt-4 text-sm text-alerta">No encontré una pregunta parecida. Pruebe con otras palabras (CAUE, TMAR, depreciación, VPN, costo hundido…).</p>}
        {res && <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2"><Badge tono="azul">{res.pregunta.cat}</Badge><span className="font-semibold">{res.pregunta.pregunta}</span>{numeros(enviada).length > 0 && <Badge tono="ambar">Valores detectados: {numeros(enviada).map((n) => num(n, n % 1 ? 2 : 0)).join(', ')}</Badge>}</div>
          <p className="whitespace-pre-line rounded-xl bg-fg/5 p-4 leading-relaxed">{res.respuesta.texto}</p>
          {res.respuesta.proc && <details open className="rounded-xl border border-fg/10 p-4"><summary className="cursor-pointer text-sm font-semibold text-cian">Procedimiento: {res.respuesta.proc.titulo}</summary><div className="mt-3"><ProcContenido proc={res.respuesta.proc} /></div></details>}
          <div className="flex flex-wrap items-center gap-2">
            {res.respuesta.tab && <Button onClick={() => { setTab(res.respuesta.tab!); ir('economico'); location.hash = '' }}>Ver en el sistema <ArrowRight size={15} /></Button>}
            {res.alternativas.length > 0 && <span className="text-xs text-muted">¿Quiso decir?</span>}
            {res.alternativas.slice(0, 3).map((a) => <button key={a.pregunta.id} onClick={() => preguntar(a.pregunta)} className="rounded-full bg-fg/5 px-3 py-1 text-xs hover:bg-fg/10">{a.pregunta.pregunta}</button>)}
          </div>
        </div>}
      </Card>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3" titulo={<span className="flex items-center gap-2"><MessageCircleQuestion size={15} />Banco de preguntas</span>}>
          <div className="mb-3 flex flex-wrap gap-1.5">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className={cx('rounded-full px-3 py-1 text-xs font-medium transition', cat === c ? 'bg-gradient-to-r from-primario to-violeta text-black' : 'bg-fg/5 text-muted hover:text-fg')}>{c} ({PREGUNTAS.filter((x) => x.cat === c).length})</button>)}</div>
          <ul className="grid gap-1.5 sm:grid-cols-2">{PREGUNTAS.filter((x) => x.cat === cat).map((x) => <li key={x.id}><button onClick={() => preguntar(x)} className="w-full rounded-lg bg-fg/5 px-3 py-2 text-left text-sm transition hover:bg-primario/15">{x.pregunta}</button></li>)}</ul>
        </Card>
        <div className="space-y-4 xl:col-span-2"><Sorpresa /><Calculadora /></div>
      </div>
    </div>
  )
}
