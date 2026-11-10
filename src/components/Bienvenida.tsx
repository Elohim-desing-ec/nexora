import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Building2, Check, Globe2, Rocket } from 'lucide-react'
import { useApp } from '../store/useApp'
import { Button, cx } from './ui'
import { Logo } from './Logo'
import { EditorSucursal, sucursalVacia } from './EditorSucursal'
import { FormEmpresa } from '../pages/Configuracion'
import { bandera, pais } from '../data/paises'
import type { Empresa, Sucursal } from '../data/base'

/** Configuración inicial de la empresa (se muestra al Gerente General la primera vez). */
export function Bienvenida() {
  const { empresa, sucursales, guardarEmpresa, guardarSucursal, usuario } = useApp()
  const [paso, setPaso] = useState(0), [err, setErr] = useState('')
  const [e, setE] = useState<Empresa>(empresa)
  const [suc, setSuc] = useState<Sucursal>({ ...sucursalVacia(empresa.pais), tipo: 'Matriz' })
  const pasos = [{ t: 'Su empresa', i: <Building2 size={15} /> }, { t: 'Sucursal principal', i: <Globe2 size={15} /> }, { t: 'Listo', i: <Rocket size={15} /> }]
  const siguiente = () => {
    setErr('')
    if (paso === 0) { if (!e.nombre.trim()) return setErr('Escriba la razón social de la empresa'); if (!sucursales.length) setSuc((s) => ({ ...s, pais: e.pais, lat: pais(e.pais)?.lat ?? s.lat, lng: pais(e.pais)?.lng ?? s.lng })) }
    if (paso === 1 && !sucursales.length) { const r = guardarSucursal(suc); if (r) return setErr(r) }
    if (paso === 2) return guardarEmpresa({ ...e, configurada: true })
    setPaso(paso + 1)
  }
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 p-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass mx-auto my-[4vh] w-full max-w-5xl p-6 sm:p-8" style={{ background: 'color-mix(in srgb, var(--bg2) 92%, transparent)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4"><Logo size={36} /><div className="flex gap-2">{pasos.map((p, k) => <div key={p.t} className={cx('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', k === paso ? 'bg-gradient-to-r from-primario to-violeta text-black' : k < paso ? 'bg-exito/15 text-exito' : 'bg-fg/5 text-muted')}>{k < paso ? <Check size={13} /> : p.i}<span className="hidden sm:inline">{p.t}</span></div>)}</div></div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight">{['Bienvenido a NEXORA, ' + (usuario?.nombre.split(' ')[0] ?? ''), '¿Dónde opera su empresa?', '¡Todo listo!'][paso]}</h2>
        <p className="mb-5 mt-1 text-sm text-muted">{['Configure su empresa. Funciona para cualquier país, moneda y tamaño de negocio.', sucursales.length ? `Ya tiene ${sucursales.length} sucursal(es) registradas. Podrá agregar más en Configuración → Empresa.` : 'Registre su sede principal con su ubicación real. Luego podrá agregar sucursales ilimitadas en cualquier país.', 'Su empresa quedó configurada. Estos son los siguientes pasos.'][paso]}</p>
        {paso === 0 && <FormEmpresa e={e} setE={setE} />}
        {paso === 1 && (sucursales.length
          ? <ul className="grid gap-2 sm:grid-cols-3">{sucursales.map((x) => <li key={x.id} className="rounded-xl bg-fg/5 p-3 text-sm"><b>{x.id}</b> · {x.nombre}<div className="text-xs text-muted">{bandera(x.pais)} {x.ciudad}</div></li>)}</ul>
          : <EditorSucursal v={suc} set={setSuc} />)}
        {paso === 2 && <div className="grid gap-3 sm:grid-cols-3">{[['Usuarios', 'Agregue a su equipo con usuario y contraseña (Configuración → Usuarios).'], ['Productos', 'Cárguelos con la plantilla de Excel o uno por uno en Inventario.'], ['Red global', 'Agregue más sucursales y véalas en el globo 3D.']].map(([t, d], k) => <div key={t} className="rounded-xl bg-fg/5 p-4"><div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primario to-violeta text-sm font-bold text-black">{k + 1}</div><div className="font-semibold">{t}</div><p className="text-sm text-muted">{d}</p></div>)}</div>}
        {err && <p className="mt-4 text-sm text-peligro">{err}</p>}
        <div className="mt-6 flex justify-between gap-2"><Button disabled={paso === 0} onClick={() => setPaso(paso - 1)}><ArrowLeft size={15} />Atrás</Button><Button variante="primario" onClick={siguiente}>{paso === 2 ? <>Comenzar <Rocket size={15} /></> : <>Continuar <ArrowRight size={15} /></>}</Button></div>
      </motion.div>
    </div>
  )
}
