import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useEcon } from '../../store/useEcon'
import { Badge, Card, Kpi, Scroll, Tabs, cx } from '../../components/ui'
import { VerProc } from '../../components/Procedimiento'
import { Degradados, Grafico, TooltipVidrio, ejes, rejilla } from '../../components/charts'
import * as F from '../../lib/finance'
import * as PR from '../../lib/procedimientos'
import { money, num, pct } from '../../lib/format'

const k = (v: number) => `${num(v / 1000, 1)}k`

export function Comparacion() {
  const p = useEcon((s) => s.p)
  const K = F.indicadores(p), act = F.totalActual(p), nue = F.totalNuevo(p)
  const datos = p.conceptos.map((c) => ({ concepto: c.nombre.split(' ').slice(0, 2).join(' '), Actual: c.actual, NEXORA: c.nuevo }))
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi titulo="Ahorro anual" valor={K.A} formato={(v) => money(v)} icono={<CheckCircle2 size={15} />} tono="verde" sub={<VerProc proc={PR.procAhorro(p)} />} />
      <Kpi titulo="% de reducción" valor={(K.A / act) * 100} formato={(v) => `${num(v, 1)} %`} icono={<Info size={15} />} tono="cian" />
      <Kpi titulo="Recuperación simple" valor={K.recSimple} formato={(v) => `${num(v)} años`} icono={<Info size={15} />} tono="violeta" />
      <Kpi titulo="Recuperación descontada" valor={K.recDesc} formato={(v) => `${num(v)} años`} icono={<Info size={15} />} tono="azul" sub={<VerProc proc={PR.procRecDesc(p)} />} />
    </div>
    <div className="grid gap-4 2xl:grid-cols-2">
      <Card titulo="Costos anuales por concepto"><Scroll><table className="tabla">
        <thead><tr><th>Concepto</th><th className="num">Sistema actual</th><th className="num">NEXORA</th><th className="num">Ahorro</th><th className="num">% red.</th></tr></thead>
        <tbody>{p.conceptos.map((c) => <tr key={c.nombre}><td className="max-w-[220px] truncate">{c.nombre}</td><td className="num">{money(c.actual)}</td><td className="num">{money(c.nuevo)}</td><td className={cx('num font-semibold', c.actual - c.nuevo < 0 ? 'text-peligro' : 'text-exito')}>{money(c.actual - c.nuevo)}</td><td className="num">{pct(c.actual ? (c.actual - c.nuevo) / c.actual : 0, 0)}</td></tr>)}
          <tr className="font-bold"><td>TOTAL</td><td className="num">{money(act)}</td><td className="num">{money(nue)}</td><td className="num text-exito">{money(K.A)}</td><td className="num">{pct(K.A / act, 1)}</td></tr></tbody>
      </table></Scroll>
        <p className="mt-3 text-xs text-muted">Nota: la licencia y soporte SUBE con NEXORA (+{money(p.conceptos[2].nuevo - p.conceptos[2].actual)}), pero el resto de conceptos baja mucho más.</p>
      </Card>
      <Card titulo="Actual vs NEXORA"><Grafico><BarChart data={datos}><Degradados /><CartesianGrid {...rejilla} /><XAxis dataKey="concepto" {...ejes} /><YAxis {...ejes} tickFormatter={k} /><Tooltip content={<TooltipVidrio />} cursor={{ fill: 'rgb(var(--fg) / .05)' }} /><Legend />
        <Bar dataKey="Actual" fill="url(#g5)" radius={[6, 6, 0, 0]} /><Bar dataKey="NEXORA" fill="url(#g0)" radius={[6, 6, 0, 0]} /></BarChart></Grafico></Card>
    </div>
  </>
}

function TablaCAUE({ quien, P, vm, coa, filas, nOpt }: { quien: string; P: number; vm: number[]; coa: number[]; filas: F.FilaCAUE[]; nOpt: number }) {
  const p = useEcon((s) => s.p)
  return <Scroll><table className="tabla">
    <thead><tr><th>n</th><th className="num">VM_n</th><th className="num">COA_n</th><th className="num">RC</th><th className="num">COA eq.</th><th className="num">CAUE</th><th></th></tr></thead>
    <tbody>{filas.map((f) => <tr key={f.n} className={cx(f.n === nOpt && 'bg-exito/10')}><td>{f.n}{f.n === nOpt && <Badge tono="verde">mín</Badge>}</td><td className="num">{money(f.vm)}</td><td className="num">{money(f.coa)}</td><td className="num">{money(f.rc)}</td><td className="num">{money(f.coaEq)}</td><td className="num font-semibold">{money(f.caue)}</td><td><VerProc label="" proc={PR.procCAUE(P, vm, coa, p.i, f.n, quien)} /></td></tr>)}</tbody>
  </table></Scroll>
}

export function Reemplazo() {
  const p = useEcon((s) => s.p)
  const R = F.reemplazo(p), d = p.defensor
  const dm = R.marg.map((m) => ({ anio: `Año ${m.anio}`, cm: m.cm, ret: R.ret.caueMin }))
  return <>
    <Card className={cx('border-2', R.reemplazarAhora ? 'border-exito/40' : 'border-alerta/40')}>
      <div className="flex flex-wrap items-center gap-4">
        <div className={cx('grid h-14 w-14 place-items-center rounded-2xl', R.reemplazarAhora ? 'bg-exito/20 text-exito' : 'bg-alerta/20 text-alerta')}>{R.reemplazarAhora ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}</div>
        <div className="flex-1"><div className="text-xs uppercase tracking-wide text-muted">Veredicto automático</div><div className="text-3xl font-extrabold tracking-tight">{R.veredicto}</div>
          <p className="text-sm text-muted">CAUE mín. defensor {money(R.def.caueMin)} (n = {R.def.nOpt}) {R.reemplazarAhora ? '>' : '≤'} CAUE mín. retador {money(R.ret.caueMin)} (n = {R.ret.nOpt}). {R.anioReemplazo === 0 ? 'Según el costo marginal, conviene reemplazar en el año 0 (hoy).' : `Según el costo marginal, conservar hasta el año ${R.anioReemplazo} y reemplazar después.`}</p></div>
        <div className="text-right"><div className="text-xs text-muted">Ahorro equivalente</div><div className="text-2xl font-bold text-exito tnum">{money(R.def.caueMin - R.ret.caueMin)}</div><div className="text-xs text-muted">por año</div></div>
      </div>
    </Card>
    <div className="grid gap-4 2xl:grid-cols-2">
      <Card titulo="Defensor · CAUE por años de conservación"><TablaCAUE quien="defensor" P={d.vm0} vm={d.vm} coa={d.coa} filas={R.def.filas} nOpt={R.def.nOpt} /></Card>
      <Card titulo="Retador · CAUE por años de servicio"><TablaCAUE quien="retador" P={F.inversion(p)} vm={p.retador.vm} coa={p.retador.coa} filas={R.ret.filas} nOpt={R.ret.nOpt} /></Card>
    </div>
    <div className="grid gap-4 2xl:grid-cols-2">
      <Card titulo="Costo marginal del defensor (año por año)">
        <Scroll><table className="tabla"><thead><tr><th>Año</th><th className="num">Pérdida VM</th><th className="num">Interés i·VM</th><th className="num">COA</th><th className="num">Costo marginal</th><th>¿Conservar?</th><th></th></tr></thead>
          <tbody>{R.marg.map((m) => <tr key={m.anio}><td>{m.anio}</td><td className="num">{money(m.perdidaValor)}</td><td className="num">{money(m.interes)}</td><td className="num">{money(m.coa)}</td><td className="num font-semibold">{money(m.cm)}</td><td>{m.cm < R.ret.caueMin ? <Badge tono="verde">Sí</Badge> : <Badge tono="rojo">No</Badge>}</td><td><VerProc label="" proc={PR.procMarginal(p, m.anio)} /></td></tr>)}</tbody></table></Scroll>
        <p className="mt-3 rounded-lg bg-cian/10 p-3 text-xs"><b>Regla:</b> conservar el defensor mientras su costo marginal sea menor que el CAUE mínimo del retador ({money(R.ret.caueMin)}).</p>
      </Card>
      <Card titulo="Costo marginal vs CAUE mínimo del retador"><Grafico><ComposedChart data={dm}><Degradados /><CartesianGrid {...rejilla} /><XAxis dataKey="anio" {...ejes} /><YAxis {...ejes} tickFormatter={k} /><Tooltip content={<TooltipVidrio />} /><Legend />
        <Bar dataKey="cm" name="Costo marginal defensor" radius={[6, 6, 0, 0]}>{dm.map((x, i) => <Cell key={i} fill={x.cm < x.ret ? '#10B981' : '#F43F5E'} fillOpacity={0.75} />)}</Bar>
        <Line dataKey="ret" name="CAUE mín. retador" stroke="#F3D58A" strokeWidth={2.5} dot={false} /></ComposedChart></Grafico></Card>
    </div>
  </>
}

export function Enfoques() {
  const p = useEcon((s) => s.p), d = p.defensor
  const R = F.reemplazo(p)
  const libros = Math.max(0, d.costoOriginal - (d.costoOriginal / 10) * d.edad)
  const erroneo = F.vidaUtilEconomica(d.costoOriginal, d.vm.slice(0, d.vidaRestante), d.coa.slice(0, d.vidaRestante), p.i)
  const filas = [
    ['Valor de mercado hoy', money(d.vm0), true, 'Es lo que sacrificamos al conservarlo (costo de oportunidad) → inversión del defensor'],
    ['Costo original hace ' + d.edad + ' años', money(d.costoOriginal), false, 'COSTO HUNDIDO: ya se pagó y no cambia con la decisión'],
    ['Valor en libros (LR 10 años)', money(libros), false, 'Dato contable; solo sirve para calcular impuestos por ganancia/pérdida'],
    ['Depreciación acumulada', money(d.costoOriginal - libros), false, 'Pasado contable, no es flujo de efectivo'],
    ['COA futuros', d.coa.slice(0, d.vidaRestante).map((c) => money(c, 0)).join(' · '), true, 'Costos que sí ocurrirán según la decisión'],
    ['Valores de mercado futuros', d.vm.slice(0, d.vidaRestante).map((c) => money(c, 0)).join(' · '), true, 'Valor recuperable al dejarlo en cada año'],
  ] as const
  return <>
    <Card titulo="Enfoque del consultor (externo)">
      <p className="mb-4 text-sm leading-relaxed text-muted">Un consultor externo no "tiene" ningún activo: compara <b className="text-fg">comprar el defensor usado</b> por su valor de mercado ({money(d.vm0)}) contra <b className="text-fg">comprar el retador nuevo</b> ({money(F.inversion(p))}). Así ambos se evalúan con la misma lógica y se evitan los costos hundidos.</p>
      <Scroll><table className="tabla"><thead><tr><th>Dato</th><th>Valor</th><th>¿Se considera?</th><th>Razón</th></tr></thead>
        <tbody>{filas.map(([a, b, c, e]) => <tr key={a}><td className="font-medium">{a}</td><td className="tnum">{b}</td><td>{c ? <Badge tono="verde">Sí</Badge> : <Badge tono="rojo">No · hundido</Badge>}</td><td className="whitespace-normal text-xs text-muted">{e}</td></tr>)}</tbody></table></Scroll>
    </Card>
    <div className="grid gap-4 md:grid-cols-2">
      <Card titulo="✅ Correcto (valor de mercado)"><div className="text-2xl font-bold tnum">{money(R.def.caueMin)}</div><p className="text-xs text-muted">CAUE mínimo del defensor con P = {money(d.vm0)}</p></Card>
      <Card titulo="❌ Error común (usar el costo original)"><div className="text-2xl font-bold text-peligro tnum">{money(erroneo.caueMin)}</div><p className="text-xs text-muted">Si se usara P = {money(d.costoOriginal)} el defensor parecería {money(erroneo.caueMin - R.def.caueMin)} más caro por año: se estaría "cobrando" dos veces un dinero que ya se gastó.</p></Card>
    </div>
  </>
}

export function Estudio() {
  const { p, set } = useEcon()
  const e = F.periodoEstudio(p, p.horizonte)
  return <>
    <Card titulo="Horizonte del período de estudio" accion={<VerProc proc={PR.procEstudio(p, p.horizonte)} />}>
      <Tabs items={Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1), label: `${i + 1} año${i ? 's' : ''}` }))} valor={String(p.horizonte)} onChange={(v) => set((q) => { q.horizonte = +v })} />
      <p className="mt-3 text-sm text-muted">Se evalúan todas las combinaciones "conservar el defensor k años y luego el retador (H − k) años" dentro de H = {p.horizonte} años. Se elige la de menor VP de costos.</p>
    </Card>
    <div className="grid gap-4 2xl:grid-cols-2">
      <Card titulo="Combinaciones evaluadas"><Scroll><table className="tabla"><thead><tr><th>Opción</th><th className="num">VP costos</th><th className="num">VA costos</th><th></th></tr></thead>
        <tbody>{e.opciones.map((o) => <tr key={o.k} className={cx(o === e.mejor && 'bg-exito/10 font-semibold')}><td>{o.etiqueta}</td><td className="num">{money(o.vp)}</td><td className="num">{money(o.va)}</td><td>{o === e.mejor && <Badge tono="verde">Mejor</Badge>}</td></tr>)}</tbody></table></Scroll>
        <p className="mt-3 text-sm"><b>Conclusión:</b> con un horizonte de {p.horizonte} años conviene <b className="text-exito">{e.mejor.etiqueta}</b> (VP = {money(e.mejor.vp)}).</p></Card>
      <Card titulo="VP de costos por opción"><Grafico><BarChart data={e.opciones} layout="vertical" margin={{ left: 40 }}><CartesianGrid {...rejilla} horizontal={false} vertical /><XAxis type="number" {...ejes} tickFormatter={k} /><YAxis type="category" dataKey="etiqueta" {...ejes} width={150} /><Tooltip content={<TooltipVidrio />} cursor={{ fill: 'rgb(var(--fg) / .05)' }} />
        <Bar dataKey="vp" name="VP costos" radius={[0, 6, 6, 0]}>{e.opciones.map((o, i) => <Cell key={i} fill={o === e.mejor ? '#10B981' : '#C9972B'} fillOpacity={0.8} />)}</Bar></BarChart></Grafico></Card>
    </div>
  </>
}

export function VidaUtil() {
  const p = useEcon((s) => s.p)
  const [quien, setQuien] = useState<'ret' | 'def'>('ret')
  const R = F.reemplazo(p), V = quien === 'ret' ? R.ret : R.def
  const P = quien === 'ret' ? F.inversion(p) : p.defensor.vm0, vm = quien === 'ret' ? p.retador.vm : p.defensor.vm, coa = quien === 'ret' ? p.retador.coa : p.defensor.coa
  const min = V.filas[V.nOpt - 1]
  return <>
    <Tabs items={[{ id: 'ret', label: 'Retador (NEXORA)' }, { id: 'def', label: 'Defensor (sistema actual)' }]} valor={quien} onChange={setQuien} />
    <div className="grid gap-4 2xl:grid-cols-5">
      <Card className="2xl:col-span-2" titulo="Tabla de vida útil económica"><TablaCAUE quien={quien === 'ret' ? 'retador' : 'defensor'} P={P} vm={vm} coa={coa} filas={V.filas} nOpt={V.nOpt} /></Card>
      <Card className="2xl:col-span-3" titulo="Curvas de costo: forma de U">
        <Grafico alto={320}><ComposedChart data={V.filas}><CartesianGrid {...rejilla} /><XAxis dataKey="n" {...ejes} tickFormatter={(v) => `n=${v}`} /><YAxis {...ejes} tickFormatter={k} /><Tooltip content={<TooltipVidrio />} labelFormatter={(v) => `n = ${v}`} /><Legend />
          <Line dataKey="rc" name="Recuperación de capital" stroke="#B07D26" strokeWidth={2} dot={{ r: 3 }} /><Line dataKey="coaEq" name="COA equivalente" stroke="#FB923C" strokeWidth={2} dot={{ r: 3 }} /><Line dataKey="caue" name="CAUE total" stroke="#F3D58A" strokeWidth={3.5} dot={{ r: 4 }} />
          <ReferenceLine x={V.nOpt} stroke="#10B981" strokeDasharray="4 4" /><ReferenceDot x={V.nOpt} y={min.caue} r={8} fill="#10B981" stroke="white" /></ComposedChart></Grafico>
        <p className="mt-3 rounded-lg bg-exito/10 p-3 text-sm"><b>Conclusión automática:</b> la vida útil económica del {quien === 'ret' ? 'retador' : 'defensor'} es <b>{V.nOpt} año(s)</b> con CAUE mínimo de <b>{money(V.caueMin)}</b>. La RC baja al repartir la inversión en más años, mientras el COA equivalente sube por el envejecimiento; su suma forma la U.</p>
      </Card>
    </div>
  </>
}
