import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, GraduationCap, Lock, User } from 'lucide-react'
import { Horizonte } from '../components/Horizonte'
import { useApp } from '../store/useApp'
import { Fondo } from '../components/Layout'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui'

export default function Login() {
  const { login, usuarios } = useApp()
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const entrar = (e: React.FormEvent) => {
    e.preventDefault()
    const q = email.trim().toLowerCase()
    const u = usuarios.find((x) => x.usuario.toLowerCase() === q || (!!x.email && x.email.toLowerCase() === q))
    if (!u || u.clave !== clave) return setError('Usuario o contraseña incorrectos')
    login(u)
  }
  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden p-4"><Fondo />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh]"><Horizonte tamano={1700} className="top-[30%]" /></div>
      <a href="#/" className="fixed left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-fg/10 bg-fg/5 px-3 py-1.5 text-xs backdrop-blur hover:bg-fg/10"><ArrowLeft size={14} />Conocer NEXORA</a>
      <motion.form onSubmit={entrar} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="glass relative z-10 w-full max-w-md p-8">
        <div className="mb-6 flex justify-center"><Logo size={44} /></div>
        <h1 className="text-center font-display text-2xl font-bold tracking-tight">Bienvenido de <span className="texto-oro">nuevo</span></h1>
        <p className="mt-1 text-center text-sm text-muted">Gestión inteligente de operaciones e inventario</p>
        <div className="mt-6 space-y-3">
          <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input autoFocus aria-label="Usuario" autoComplete="username" autoCapitalize="none" className="inp pl-9" placeholder="Usuario" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} /></div>
          <div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input aria-label="Contraseña" autoComplete="current-password" type="password" className="inp pl-9" placeholder="Contraseña" value={clave} onChange={(e) => { setClave(e.target.value); setError('') }} /></div>
          {error && <p className="text-xs text-peligro">{error}</p>}
          <Button variante="primario" type="submit" className="w-full !py-2.5">Ingresar <ArrowRight size={16} /></Button>
        </div>
        <p className="mt-5 text-center text-[11px] text-muted">¿Olvidó su contraseña? El Gerente General puede cambiarla en Configuración → Usuarios.</p>
      </motion.form>
      <a href="#/defensa" className="glass glass-hover fixed bottom-4 right-4 flex items-center gap-2 !rounded-full px-4 py-2 text-xs font-medium"><GraduationCap size={15} className="text-cian" />Modo Defensa (herramienta aparte)</a>
    </div>
  )
}
