import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Params } from '../lib/finance'
import { PROYECTO } from '../data/proyecto'

export interface Escenario { id: string; nombre: string; fecha: string; params: Params }

interface EconState {
  p: Params
  tab: string
  escenarios: Escenario[]
  set: (fn: (p: Params) => void) => void
  setTab: (t: string) => void
  restaurar: () => void
  guardar: (nombre: string) => void
  cargar: (id: string) => void
  eliminar: (id: string) => void
}

export const useEcon = create<EconState>()(persist((set, get) => ({
  p: structuredClone(PROYECTO),
  tab: 'comparacion',
  escenarios: [],
  set: (fn) => { const p = structuredClone(get().p); fn(p); set({ p }) },
  setTab: (tab) => set({ tab }),
  restaurar: () => set({ p: structuredClone(PROYECTO) }),
  guardar: (nombre) => set({ escenarios: [...get().escenarios, { id: crypto.randomUUID(), nombre, fecha: new Date().toISOString(), params: structuredClone(get().p) }] }),
  cargar: (id) => { const e = get().escenarios.find((x) => x.id === id); if (e) set({ p: structuredClone(e.params) }) },
  eliminar: (id) => set({ escenarios: get().escenarios.filter((e) => e.id !== id) }),
}), { name: 'nexora-econ', version: 1 }))
