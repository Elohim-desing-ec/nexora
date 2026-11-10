/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fg: 'rgb(var(--fg) / <alpha-value>)', muted: 'rgb(var(--muted) / <alpha-value>)',
        // Paleta "obsidiana y oro": oro, oro viejo, bronce y champán (varían con el tema para mantener contraste AA)
        primario: 'rgb(var(--oro) / <alpha-value>)', secundario: 'rgb(var(--oro-viejo) / <alpha-value>)', violeta: 'rgb(var(--bronce) / <alpha-value>)',
        cian: 'rgb(var(--champan) / <alpha-value>)', exito: '#10B981', alerta: '#FB923C', peligro: '#F43F5E', tenue: '#A8A29E',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['"Space Grotesk"', 'Inter', 'sans-serif'] },
      keyframes: {
        barrido: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        destello: { '0%,100%': { opacity: '.55' }, '50%': { opacity: '1' } },
        orbe: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(60px,-40px) scale(1.15)' } },
      },
      animation: { orbe: 'orbe 18s ease-in-out infinite', barrido: 'barrido 9s linear infinite', destello: 'destello 4s ease-in-out infinite' },
    },
  },
  plugins: [],
}
