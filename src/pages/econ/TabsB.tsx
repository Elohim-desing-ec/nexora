import { useState } from 'react'
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { CheckCircle2, Info, Trash2, Upload, Wallet, XCircle } from 'lucide-react'
import { useEcon } from '../../store/useEcon'
import { Badge, Button, Card, Kpi, Scroll, cx } from '../../components/ui'
import { VerProc } from '../../components/Procedimiento'
import { COLORES, Degradados, Grafico, TooltipVidrio, ejes, rejilla } from '../../components/charts'
import * as F from '../../lib/finance'
import * as PR from '../../lib/procedimientos'
import { money, num, pct, fecha } from '../../lib/format'

const k = (v: number) => `${num(v / 1000, 1)}k`
const METODOS: F.MetodoDep[] = ['LR', 'SD', 'SDD_LR', 'SDA', 'MACRS', 'UP']

export function Depreciacion() {
  const p = useEcon((s) => s.p)
  const [sel, setSel] = useState<F.MetodoDep[]>(['LR', 'SD', 'SDA', 'MACRS'])
  const [ver, setVer] = useState<F.MetodoDep>('SD')
  const P = F.inversion(p)
  const tablas = Object.fromEntries(METODOS.map((m) => [m, F.depreciar(p, m)])) as Record<F.MetodoDep, F.FilaDep[]>
  const fiscal = METODOS.map((m) => ({ m, ...F.ahorroFiscal(tablas[m], p.impuesto, p.i) }))
  const mejor = fiscal.filter((f) => sel.includes(f.m)).sort((a, b) => b.vp - a.vp)[0]
  const maxN = Math.max(...sel.map((m) => tablas[m].length))
  const curva = Array.from({ length: maxN + 1 }, (_, t) => Object.fromEntries([['anio', t], ...sel.map((m) => [F.NOMBRE_DEP[m], t === 0 ? P : tablas[m][t - 1]?.vl ?? tablas[m][tablas[m].length - 1].vl])]))
  const cambio = F.sddConCambio(P, p.S, p.n).anioCambio
  const t = tablas[ver]
  return <>
    <Card titulo="Métodos a comparar">
      <div className="flex flex-wrap gap-2">{METODOS.map((m) => <label key={m} className={cx('flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs', sel.includes(m) ? 'border-primario/50 bg-primario/15' : 'border-fg/10 bg-fg/5')}><input type="checkbox" className="accent-amber-500" checked={sel.includes(m)} onChange={() => setSel(sel.includes(m) ? sel.filter((x) => x !== m) : [...sel, m])} />{F.NOMBRE_DEP[m]}{m === 'SD' && ` (${num(p.factorSD, 1)}/n)`}{m === 'MACRS' && ` ${p.macrsClase} años`}</label>)}</div>
      <p className="mt-3 text-xs text-muted">P = {money(P)} · S = {money(p.S)} · n = {p.n} · T = {pct(p.impuesto, 0)}. Cambie el factor del saldo decreciente (2 = doble, 1,5 = 150 %) o la clase MACRS en Parámetros. {cambio ? `SDD con cambio a LR: el cambio ocurre en el año ${cambio}.` : 'SDD con cambio a LR: con estos datos el cambio NO ocurre (el SDD llega antes al valor residual).'}</p>
    </Card>
    <div className="grid gap-4 2xl:grid-cols-2">
      <Card titulo="Tabla de depreciación" accion={<VerProc proc={PR.procDep(p, ver)} />}>
        <select className="inp mb-3" value={ver} onChange={(e) => setVer(e.target.value as F.MetodoDep)}>{METODOS.map((m) => <option key={m} value={m}>{F.NOMBRE_DEP[m]}</option>)}</select>
        <Scroll><table className="tabla"><thead><tr><th>Año</th><th className="num">Tasa / fracción</th><th className="num">Depreciación</th><th className="num">Dep. acumulada</th><th className="num">Valor en libros</th></tr></thead>
          <tbody><tr><td>0</td><td /><td /><td /><td className="num">{money(P)}</td></tr>{t.map((f) => <tr key={f.anio}><td>{f.anio}</td><td className="num">{num(f.tasa, 4)}</td><td className="num font-semibold">{money(f.dep)}</td><td className="num">{money(f.acum)}</td><td className="num">{money(f.vl)}</td></tr>)}</tbody></table></Scroll>
        {ver === 'MACRS' && <p className="mt-2 text-xs text-muted">MACRS ignora el valor residual y usa convención de medio año ({t.length} años).</p>}
      </Card>
      <Card titulo="Valor en libros por método"><Grafico alto={300}><LineChart data={curva}><CartesianGrid {...rejilla} /><XAxis dataKey="anio" {...ejes} /><YAxis {...ejes} tickFormatter={k} /><Tooltip content={<TooltipVidrio />} labelFormatter={(v) => `Año ${v}`} /><Legend /><ReferenceLine y={p.S} stroke="#A8A29E" strokeDasharray="4 4" label={{ value: 'S', fill: '#A8A29E', fontSize: 11 }} />
        {sel.map((m) => <Line key={m} dataKey={F.NOMBRE_DEP[m]} stroke={COLORES[METODOS.indexOf(m)]} strokeWidth={2.5} dot={{ r: 3 }} />)}</LineChart></Grafico></Card>
    </div>
    <Card titulo="Ahorro fiscal por año (depreciación × impuesto) y su valor presente">
      <Scroll><table className="tabla"><thead><tr><th>Método</th>{Array.from({ length: 8 }, (_, i) => <th key={i} className="num">Año {i + 1}</th>)}<th className="num">VP</th><th /></tr></thead>
        <tbody>{fiscal.filter((f) => sel.includes(f.m)).map((f) => <tr key={f.m} className={cx(f.m === mejor?.m && 'bg-exito/10')}><td className="font-medium">{F.NOMBRE_DEP[f.m]}</td>{Array.from({ length: 8 }, (_, i) => <td key={i} className="num">{f.anual[i] !== undefined ? money(f.anual[i], 0) : ''}</td>)}<td className="num font-bold">{money(f.vp)}</td><td>{f.m === mejor?.m && <Badge tono="verde">Conviene</Badge>}</td></tr>)}</tbody></table></Scroll>
      {mejor && <p className="mt-3 text-sm"><b>Conclusión:</b> fiscalmente conviene <b className="text-exito">{F.NOMBRE_DEP[mejor.m]}</b> (VP del ahorro {money(mejor.vp)}) porque concentra la depreciación en los primeros años y el impuesto ahorrado antes vale más.</p>}
      <p className="mt-2 flex gap-2 rounded-lg bg-alerta/10 p-3 text-xs"><Info size={14} className="shrink-0 text-alerta" />Nota informativa: en Ecuador (SRI) el método usual para efectos tributarios es línea recta; los métodos acelerados se muestran para análisis gerencial.</p>
    </Card>
  </>
}

export function Impuestos() {
  const { p, set } = useEcon()
  const r = F.fedi(p, p.depMetodo)
  return <>
    <div className="grid gap-4 sm:grid-cols-3">
      <Kpi titulo="VP después de impuestos" valor={r.VP} formato={(v) => money(v)} icono={<Wallet size={15} />} tono="verde" sub={<VerProc proc={PR.procFEDI(p)} />} />
      <Kpi titulo="VA después de impuestos" valor={r.VA} formato={(v) => money(v)} icono={<Wallet size={15} />} tono="cian" />
      <Kpi titulo="TIR después de impuestos" valor={r.TIR * 100} formato={(v) => `${num(v)} %`} icono={<Wallet size={15} />} tono="violeta" />
    </div>
    <Card titulo="Flujo de efectivo después de impuestos (FEDI) del retador" accion={<select className="inp !w-auto" value={p.depMetodo} onChange={(e) => set((q) => { q.depMetodo = e.target.value as F.MetodoDep })}>{METODOS.map((m) => <option key={m} value={m}>{F.NOMBRE_DEP[m]}</option>)}</select>}>
      <Scroll><table className="tabla"><thead><tr><th>Año</th><th className="num">Ahorro (A)</th><th className="num">Depreciación (D)</th><th className="num">Renta gravable A − D</th><th className="num">Impuesto {pct(p.impuesto, 0)}</th><th className="num">Valor residual</th><th className="num">FEDI</th></tr></thead>
        <tbody>{r.filas.map((f) => <tr key={f.anio}><td>{f.anio}</td><td className="num">{f.anio ? money(f.ahorro) : ''}</td><td className="num">{f.anio ? money(f.dep) : ''}</td><td className="num">{f.anio ? money(f.renta) : ''}</td><td className="num text-peligro">{f.anio ? money(f.impuesto) : ''}</td><td className="num">{f.residual ? money(f.residual) : ''}</td><td className={cx('num font-semibold', f.fedi < 0 ? 'text-peligro' : 'text-exito')}>{money(f.fedi)}</td></tr>)}</tbody></table></Scroll>
      <p className="mt-3 text-xs text-muted">En el último año se suma el valor residual y se ajusta el impuesto por la diferencia entre S y el valor en libros (ganancia o pérdida en la venta). La depreciación no es salida de efectivo: solo reduce la renta gravable.</p>
    </Card>
  </>
}

export function Indicadores() {
  const p = useEcon((s) => s.p)
  const K = F.indicadores(p)
  const perfil = Array.from({ length: 31 }, (_, j) => { const i = j * 0.02; return { i: `${j * 2}%`, VPN: F.vpnProyecto(K.P, K.A, p.S, i, p.n) } })
  const acum = K.flujos.reduce<{ t: number; flujo: number; acum: number }[]>((a, f, t) => [...a, { t, flujo: f, acum: (a[t - 1]?.acum ?? 0) + f * F.PF(p.i, t) }], [])
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi titulo="VPN" valor={K.VPN} formato={(v) => money(v)} icono={<CheckCircle2 size={15} />} tono="verde" sub={<VerProc proc={PR.procVPN(p)} />} />
      <Kpi titulo="VAE" valor={K.VAE} formato={(v) => money(v)} icono={<Info size={15} />} tono="cian" sub="VPN × (A/P,i,n)" />
      <Kpi titulo="TIR (bisección)" valor={K.TIR * 100} formato={(v) => `${num(v)} %`} icono={<Info size={15} />} tono="violeta" sub={<VerProc proc={PR.procTIR(p)} />} />
      <Kpi titulo="Beneficio / Costo" valor={K.BC} formato={(v) => num(v, 4)} icono={<Info size={15} />} tono="azul" sub={<VerProc proc={PR.procBC(p)} />} />
      <Kpi titulo="Recuperación descontada" valor={K.recDesc} formato={(v) => `${num(v)} años`} icono={<Info size={15} />} tono="ambar" sub={<VerProc proc={PR.procRecDesc(p)} />} />
    </div>
    <div className="grid gap-4 2xl:grid-cols-2">
      <Card titulo="Flujos y VP acumulado"><Grafico><ComposedChart data={acum}><Degradados /><CartesianGrid {...rejilla} /><XAxis dataKey="t" {...ejes} /><YAxis {...ejes} tickFormatter={k} /><Tooltip content={<TooltipVidrio />} labelFormatter={(v) => `Año ${v}`} /><Legend /><ReferenceLine y={0} stroke="#A8A29E" />
        <Bar dataKey="flujo" name="Flujo" radius={[6, 6, 0, 0]}>{acum.map((a, i) => <Cell key={i} fill={a.flujo < 0 ? '#F43F5E' : '#D4AF37'} fillOpacity={0.75} />)}</Bar><Line dataKey="acum" name="VP acumulado" stroke="#10B981" strokeWidth={2.5} /></ComposedChart></Grafico></Card>
      <Card titulo="Perfil del VPN vs tasa (la TIR es donde corta el eje)"><Grafico><ComposedChart data={perfil}><Degradados /><CartesianGrid {...rejilla} /><XAxis dataKey="i" {...ejes} interval={4} /><YAxis {...ejes} tickFormatter={k} /><Tooltip content={<TooltipVidrio />} /><ReferenceLine y={0} stroke="#F43F5E" />
        <Area dataKey="VPN" stroke="#F3D58A" fill="url(#g2)" strokeWidth={2.5} /></ComposedChart></Grafico>
        <p className="text-xs text-muted">TIR = {pct(K.TIR)} · TMAR = {pct(p.i, 0)} → {K.TIR > p.i ? 'TIR > TMAR: se acepta.' : 'TIR < TMAR: se rechaza.'}</p></Card>
    </div>
  </>
}

export function Sensibilidad() {
  const { p, set } = useEcon()
  const T = F.tornado(p), R = F.reemplazo(p), K = F.indicadores(p)
  const datos = T.filas.map((f) => ({ variable: f.variable, '−20 %': f.bajo - T.base, '+20 %': f.alto - T.base }))
  const tmars = Array.from({ length: 21 }, (_, j) => { const q = F.conCambios(p, { i: (5 + j) / 100 }); const r = F.reemplazo(q); return { tmar: `${5 + j}%`, defensor: r.def.caueMin, retador: r.ret.caueMin, VPN: F.indicadores(q).VPN } })
  return <>
    <Card titulo="TMAR en vivo">
      <div className="flex flex-wrap items-center gap-4"><input aria-label="TMAR" type="range" min={5} max={25} step={0.5} value={p.i * 100} onChange={(e) => set((q) => { q.i = +e.target.value / 100 })} className="h-2 flex-1 cursor-pointer accent-amber-300" />
        <div className="text-3xl font-extrabold tnum">{num(p.i * 100, 1)} %</div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">{[['CAUE mín. defensor', money(R.def.caueMin)], ['CAUE mín. retador', money(R.ret.caueMin)], ['VPN', money(K.VPN)], ['Veredicto', R.veredicto]].map(([a, b]) => <div key={a} className="rounded-xl bg-fg/5 p-3"><div className="text-xs text-muted">{a}</div><div className="font-bold tnum">{b}</div></div>)}</div>
    </Card>
    <div className="grid gap-4 2xl:grid-cols-2">
      <Card titulo={`Gráfico tornado: variación del VPN (base ${money(T.base, 0)}) con ±20 %`}><Grafico><BarChart data={datos} layout="vertical" stackOffset="sign" margin={{ left: 30 }}><CartesianGrid {...rejilla} horizontal={false} vertical /><XAxis type="number" {...ejes} tickFormatter={k} /><YAxis type="category" dataKey="variable" {...ejes} width={110} /><Tooltip content={<TooltipVidrio />} cursor={{ fill: 'rgb(var(--fg) / .05)' }} /><Legend /><ReferenceLine x={0} stroke="#A8A29E" />
        <Bar dataKey="−20 %" stackId="a" fill="#FB923C" fillOpacity={0.8} radius={4} /><Bar dataKey="+20 %" stackId="a" fill="#D4AF37" fillOpacity={0.8} radius={4} /></BarChart></Grafico>
        <p className="text-xs text-muted">Variable más sensible: <b className="text-fg">{T.filas[0].variable}</b>. Ordenadas de mayor a menor impacto.</p></Card>
      <Card titulo="CAUE mínimo vs TMAR (5 % – 25 %)"><Grafico><LineChart data={tmars}><CartesianGrid {...rejilla} /><XAxis dataKey="tmar" {...ejes} interval={4} /><YAxis {...ejes} tickFormatter={k} /><Tooltip content={<TooltipVidrio />} /><Legend />
        <Line dataKey="defensor" name="Defensor" stroke="#F43F5E" strokeWidth={2.5} dot={false} /><Line dataKey="retador" name="Retador" stroke="#F3D58A" strokeWidth={2.5} dot={false} /></LineChart></Grafico></Card>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card titulo="Valor de equilibrio del defensor" accion={<VerProc proc={PR.procEquilibrio(p)} />}><div className="text-3xl font-bold tnum">{money(F.equilibrioDefensor(p))}</div><p className="mt-1 text-sm text-muted">Valor de mercado del sistema actual con el que daría igual conservarlo o reemplazarlo (hoy vale {money(p.defensor.vm0)}).</p></Card>
      <Card titulo="Ahorro mínimo para que sea rentable" accion={<VerProc proc={PR.procAhorroMin(p)} />}><div className="text-3xl font-bold tnum">{money(K.ahorroMinimo)}</div><p className="mt-1 text-sm text-muted">Ahorro actual {money(K.A)} → margen de seguridad de {pct(1 - K.ahorroMinimo / K.A, 1)}.</p></Card>
    </div>
  </>
}

export function Inflacion() {
  const { p, set } = useEcon()
  const f = p.inflacion, iF = F.tmarInflacion(p.i, f), K = F.indicadores(p)
  const nominales = K.flujos.map((x, t) => (t === 0 ? x : x * Math.pow(1 + f, t)))
  const vpnNom = F.vp(nominales, iF), vpnMal = F.vp(K.flujos, iF)
  return <>
    <Card titulo="Inflación (opcional)" accion={<VerProc proc={PR.procInflacion(p)} />}>
      <div className="flex flex-wrap items-center gap-4"><input aria-label="Inflación" type="range" min={0} max={15} step={0.25} value={f * 100} onChange={(e) => set((q) => { q.inflacion = +e.target.value / 100 })} className="h-2 flex-1 accent-amber-400" /><div className="text-3xl font-extrabold tnum">{num(f * 100, 2)} %</div></div>
      <div className="mt-4 rounded-xl bg-fg/5 p-4 text-center text-lg">i<sub>f</sub> = i + f + i·f = {pct(p.i, 0)} + {pct(f, 2)} + ({num(p.i, 2)})({num(f, 4)}) = <b className="text-cian">{pct(iF)}</b></div>
    </Card>
    <div className="grid gap-4 md:grid-cols-3">
      <Card titulo="Dólares constantes a TMAR real"><div className="text-2xl font-bold tnum">{money(K.VPN)}</div><p className="text-xs text-muted">Flujos sin inflar, descontados al {pct(p.i, 0)}.</p></Card>
      <Card titulo="Dólares corrientes a TMAR inflada"><div className="text-2xl font-bold tnum">{money(vpnNom)}</div><p className="text-xs text-muted">Ahorros inflados al {pct(f, 1)} anual y descontados al {pct(iF)}. ≈ Igual al anterior (salvo el residual, que se asumió nominal).</p></Card>
      <Card titulo="⚠ Error: mezclar ambos"><div className="text-2xl font-bold text-peligro tnum">{money(vpnMal)}</div><p className="text-xs text-muted">Flujos constantes descontados a la tasa inflada: subestima el proyecto.</p></Card>
    </div>
  </>
}

export function Recomendacion() {
  const p = useEcon((s) => s.p)
  const R = F.reemplazo(p), K = F.indicadores(p), fe = F.fedi(p, p.depMetodo)
  const criterios = [
    [R.reemplazarAhora, `CAUE: NEXORA ${money(R.ret.caueMin)} vs actual ${money(R.def.caueMin)} → ahorro equivalente ${money(R.def.caueMin - R.ret.caueMin)}/año`],
    [K.VPN > 0, `VPN = ${money(K.VPN)} > 0 a una TMAR del ${pct(p.i, 0)}`],
    [K.TIR > p.i, `TIR = ${pct(K.TIR)} frente a TMAR ${pct(p.i, 0)}`],
    [K.BC > 1, `B/C = ${num(K.BC, 2)}: cada dólar invertido devuelve ${money(K.BC)}`],
    [K.recDesc < p.n, `Se recupera en ${num(K.recDesc)} años descontados, dentro de los ${p.n} de vida fiscal`],
    [fe.VP > 0, `Después de impuestos sigue generando ${money(fe.VP)} (VP)`],
    [K.ahorroMinimo < K.A * 0.8, `El ahorro puede caer hasta ${money(K.ahorroMinimo)} (−${pct(1 - K.ahorroMinimo / K.A, 0)}) y seguir siendo rentable`],
  ] as const
  const si = criterios.filter((c) => c[0]).length
  const ok = si >= 6
  return <Card className={cx('border-2', ok ? 'border-exito/40' : 'border-peligro/40')}>
    <div className="flex items-center gap-4"><div className={cx('grid h-16 w-16 place-items-center rounded-2xl text-3xl', ok ? 'bg-exito/20' : 'bg-peligro/20')}>{ok ? '💼' : '✋'}</div>
      <div><div className="text-xs uppercase tracking-wide text-muted">¿Lo compraría con mi propio dinero?</div><div className={cx('text-4xl font-extrabold', ok ? 'text-exito' : 'text-peligro')}>{ok ? 'SÍ, lo compraría' : 'NO lo compraría'}</div><div className="text-sm text-muted">{si} de {criterios.length} criterios favorables</div></div></div>
    <ul className="mt-5 space-y-2">{criterios.map(([b, t], i) => <li key={i} className="flex items-start gap-2 rounded-lg bg-fg/5 px-3 py-2 text-sm">{b ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-exito" /> : <XCircle size={17} className="mt-0.5 shrink-0 text-peligro" />}{t}</li>)}</ul>
    <p className="mt-4 text-sm leading-relaxed">{ok ? `Invertir ${money(K.P)} hoy elimina un sistema cuyo costo marginal ya supera al del retador, recupera el dinero en menos de ${Math.ceil(K.recDesc)} años y deja ${money(K.VPN)} de valor adicional. El riesgo principal es que el ahorro real sea menor, pero el margen de seguridad es amplio.` : 'Con los parámetros actuales los indicadores no justifican la inversión: conviene renegociar el precio, ampliar el alcance del ahorro o esperar.'}</p>
  </Card>
}

export function Escenarios() {
  const { p, escenarios, cargar, eliminar } = useEcon()
  const cols = [{ id: 'actual', nombre: 'Actual (en pantalla)', fecha: '', params: p }, ...escenarios]
  const m = (q: F.Params) => { const R = F.reemplazo(q), K = F.indicadores(q); return [['TMAR', pct(q.i, 1)], ['Inversión', money(F.inversion(q), 0)], ['Ahorro anual', money(K.A, 0)], ['CAUE mín. defensor', money(R.def.caueMin)], ['CAUE mín. retador', money(R.ret.caueMin)], ['Vida económica', `${R.ret.nOpt} años`], ['VPN', money(K.VPN)], ['TIR', pct(K.TIR)], ['B/C', num(K.BC, 3)], ['Veredicto', R.veredicto]] }
  return <Card titulo="Comparación de escenarios lado a lado">
    {!escenarios.length && <p className="mb-3 text-sm text-muted">Aún no hay escenarios. Modifique parámetros y pulse "Guardar escenario".</p>}
    <Scroll><table className="tabla"><thead><tr><th>Indicador</th>{cols.map((c) => <th key={c.id} className="num"><div>{c.nombre}</div>{c.fecha && <div className="text-[10px] font-normal normal-case">{fecha(c.fecha)}</div>}</th>)}</tr></thead>
      <tbody>{m(p).map((_, r) => <tr key={r}><td className="font-medium">{m(p)[r][0]}</td>{cols.map((c) => <td key={c.id} className="num">{m(c.params)[r][1]}</td>)}</tr>)}
        <tr><td /><td />{escenarios.map((e) => <td key={e.id} className="num"><div className="flex justify-end gap-1"><Button className="!px-2 !py-1 text-xs" onClick={() => cargar(e.id)}><Upload size={13} />Cargar</Button><Button variante="peligro" className="!px-2 !py-1" onClick={() => eliminar(e.id)}><Trash2 size={13} /></Button></div></td>)}</tr></tbody></table></Scroll>
  </Card>
}

