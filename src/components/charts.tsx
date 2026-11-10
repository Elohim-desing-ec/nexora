import type { ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { money } from '../lib/format'

export const COLORES = ['#D4AF37', '#B07D26', '#F3D58A', '#10B981', '#FB923C', '#F43F5E']
export const ejes = { stroke: 'rgb(var(--muted))', fontSize: 11, tickLine: false, axisLine: false } as const
export const rejilla = { stroke: 'rgb(var(--muted) / .15)', strokeDasharray: '3 3', vertical: false } as const

type TP = { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string | number }
export function TooltipVidrio({ active, payload, label, fmt = money }: TP & { fmt?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass !rounded-xl px-3 py-2 text-xs" style={{ background: 'color-mix(in srgb, var(--bg2) 85%, transparent)' }}>
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p) => <div key={p.name} className="flex items-center gap-2 tnum"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}: <b>{fmt(p.value)}</b></div>)}
    </div>
  )
}
export const Grafico = ({ alto = 280, children }: { alto?: number; children: ReactNode }) => <div style={{ height: alto }}><ResponsiveContainer>{children as React.ReactElement}</ResponsiveContainer></div>
export const Degradados = () => (
  <defs>{COLORES.map((c, k) => <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={0.9} /><stop offset="100%" stopColor={c} stopOpacity={0.25} /></linearGradient>)}</defs>
)
