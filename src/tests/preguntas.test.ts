import { describe, it, expect } from 'vitest'
import { buscar, numeros, PREGUNTAS, responder } from '../lib/preguntas'
import { PROYECTO } from '../data/proyecto'

const top = (q: string) => buscar(q)[0]?.pregunta.id

describe('Motor de preguntas del Modo Defensa', () => {
  it('tiene al menos 60 preguntas con ids únicos', () => {
    expect(PREGUNTAS.length).toBeGreaterThanOrEqual(60)
    expect(new Set(PREGUNTAS.map((p) => p.id)).size).toBe(PREGUNTAS.length)
  })
  it('extrae números en formato español', () => expect(numeros('si la inversión es $35.000 y la TMAR 20 %')).toEqual([35000, 20]))

  const casos: [string, string[]][] = [
    ['hundido', ['¿Qué es un costo hundido?', 'explique los costos hundidos', 'COSTO HUNDIDO que significa', 'que significa que un costo sea hundido', 'defina costo hundido por favor']],
    ['tmar-20', ['¿Qué pasa si la TMAR sube a 20 %?', 'y si la tmar fuera 18%', 'que ocurre si aumenta la tasa minima atractiva', 'TMAR del 25 por ciento, que pasaria', 'si sube la TMAR qué pasa con el reemplazo']],
    ['curva-u', ['¿Por qué la curva tiene forma de U?', 'por que el CAUE forma una U', 'explique la curva en U', 'la grafica tiene forma de u por que', 'curva en u del caue']],
    ['sri', ['¿Qué método permite el SRI?', 'que depreciacion acepta el SRI en Ecuador', 'metodo de depreciacion permitido por la ley en ecuador', 'el SRI permite saldo decreciente?', 'SRI software método']],
    ['vpn', ['¿Cuál es el VPN?', 'valor presente neto del proyecto', 'cuánto da el VAN', 'calcule el valor actual neto', 'vpn']],
  ]
  for (const [id, frases] of casos) it(`encuentra "${id}" con 5 frases distintas`, () => frases.forEach((f) => expect(top(f), f).toBe(id)))

  it('responde con valores actuales', () => {
    const r = responder('¿qué pasa si la inversión es $35.000?', PROYECTO)!
    expect(r.pregunta.id).toBe('inversion-35000')
    expect(r.respuesta.texto).toContain('35.000,00')
  })
  it('todas las respuestas se calculan sin errores', () => PREGUNTAS.forEach((q) => expect(q.responder(PROYECTO, []).texto.length).toBeGreaterThan(5)))
})
