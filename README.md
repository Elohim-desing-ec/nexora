# NEXORA — Intelligent Operations Suite

Plataforma web de gestión de operaciones e inventario multi-sucursal con IA y **módulo de Ingeniería Económica** (Unidad 4: análisis de reemplazo y depreciación).
Diseño **negro y oro** con página de presentación animada (el panel emerge del horizonte dorado al hacer scroll). Para **cualquier empresa, en cualquier país**: sucursales ilimitadas, moneda propia, ubicaciones reales y red global en un globo 3D. Visión completa en **`NEXORA_GLOBAL.md`**.

## 1. Instalación y uso

```bash
npm install
npm run dev      # abre http://localhost:5173
npm test         # 27 pruebas (Vitest)
npm run build    # compilación de producción
npm run publicar # pruebas + compilación + publicación en GitHub Pages
```

No necesita backend: los datos se guardan en el navegador (localStorage). Al abrir se muestra una intro animada (clic o tecla para saltarla).

El sistema **arranca sin datos de demostración**: la empresa carga sus datos reales.

**Ingreso:** usuario `eduardo` / contraseña `eduardo2026` (Gerente General). El resto del equipo: `kattia`, `emilio`, `holger`, `emily`, `christopher` (contraseña = usuario + `2026`, rol Ayudante).

| Rol | Ve |
|---|---|
| Gerente General | Todo + **Configuración** (usuarios y datos) |
| Jefe de Bodega | Dashboard, Inventario, Compras, Reportes, IA |
| Analista Financiero | Dashboard, Compras, Reportes, Análisis económico, IA |
| Auditor | Dashboard, Inventario (solo lectura), Trazabilidad, Reportes, Análisis económico |
| Ayudante | Dashboard, Inventario, Reportes |

Atajos: **Ctrl + K** abre el buscador global · botón **Presentación** pone pantalla completa (Esc para salir) · ☀/🌙 cambia el tema.

## Cargar SUS propios datos (Configuración, solo Gerente General)

1. **Usuarios** → *Agregar persona*: nombre, correo, rol y contraseña. Con ese correo inicia sesión.
2. **Empresa** → país, moneda, identificación fiscal y **sucursales ilimitadas** (dirección real con OpenStreetMap o clic en el globo). **Compras → Nuevo proveedor** para los proveedores. Al primer ingreso del Gerente, un asistente de bienvenida hace esta configuración.
3. *Plantilla* descarga un Excel; llénelo (una fila por producto) e *Importar Excel* (.xlsx, .xls o .csv). Se muestra una vista previa; cada producto queda con su "Saldo inicial" en el kardex. Si el SKU ya existe, se actualiza.
4. O agregue productos uno por uno en **Inventario → Nuevo producto** (puede escribir categorías nuevas).
5. **Análisis económico → Parámetros**: escriba sus costos, inversión, TMAR, valores de mercado y COA. Puede agregar o quitar conceptos de costo.
6. **Inventario → Registrar movimiento**: ventas, compras directas, ajustes y mermas (alimentan el kardex y la IA).
7. **Mis datos → Respaldo**: descargue/restaure un archivo .json con toda la información.

**Asistente NEXORA** (botón ✦ abajo a la derecha): responde cómo usar el sistema, consulta datos (stock, quiebres, más vendidos, vencimientos) y preguntas del análisis económico. Funciona sin internet.

> Los datos viven en el navegador donde se cargaron. Para llevarlos a otra computadora, exporte desde Reportes. En producción, usuarios y contraseñas irían a un servidor con cifrado.

## Modo Defensa (herramienta aparte)

No forma parte del menú del sistema. Se abre desde el botón de la pantalla de ingreso, desde *Análisis económico → Modo Defensa ↗*, o con la dirección `http://localhost:5173/#/defensa`. Usa los parámetros económicos actuales.

## Versión publicada

**https://elohim-desing-ec.github.io/nexora/** — se actualiza con `npm run publicar` (solo publica si las 27 pruebas pasan).

## 2. Estructura

```
src/
├─ lib/
│  ├─ finance.ts         ← TODA la matemática financiera (funciones puras y documentadas)
│  ├─ procedimientos.ts  ← "Ver procedimiento": fórmula general, sustituida, factores e interpretación
│  ├─ preguntas.ts       ← Modo Defensa: 62 preguntas + motor de búsqueda con sinónimos
│  ├─ sorpresa.ts        ← generador de ejercicios aleatorios resueltos
│  ├─ export.ts          ← Excel (con fórmulas reales) y PDF con membrete
│  ├─ ai.ts              ← pronóstico, punto de reorden, anomalías
│  └─ inventario.ts      ← kardex promedio ponderado, ventas
├─ data/   proyecto.ts (valores del proyecto) · seed.ts (60 productos, 8 proveedores, 6 meses)
├─ store/  useApp.ts (operación) · useEcon.ts (parámetros y escenarios)
├─ components/  Layout, ui (componentes estilo shadcn), Procedimiento, charts, Logo
├─ pages/  Dashboard, Productos, Compras, IA, Auditoria, Reportes, Economico, Defensa, econ/*
└─ tests/  finance.test.ts · preguntas.test.ts
```

> Los componentes de interfaz (Card, Button, Modal, Tabs…) siguen el patrón de shadcn/ui (código propio en `components/ui.tsx`, sin dependencias extra).

## 3. Fórmulas utilizadas (`src/lib/finance.ts`)

**Factores** (i en decimal, n en años)

| Factor | Fórmula | Uso |
|---|---|---|
| (P/F,i,n) | 1/(1+i)ⁿ | traer un futuro al presente |
| (F/P,i,n) | (1+i)ⁿ | llevar un presente al futuro |
| (A/P,i,n) | i(1+i)ⁿ / [(1+i)ⁿ − 1] | recuperación de capital |
| (P/A,i,n) | [(1+i)ⁿ − 1] / [i(1+i)ⁿ] | VP de una serie uniforme |
| (A/F,i,n) | i / [(1+i)ⁿ − 1] | fondo de amortización |
| (F/A,i,n) | [(1+i)ⁿ − 1] / i | futuro de una serie uniforme |

**Reemplazo**
- Recuperación de capital: `RC = P(A/P,i,n) − Sₙ(A/F,i,n)`
- COA equivalente: `COA_eq = [Σ COAₜ (P/F,i,t)] · (A/P,i,n)`
- `CAUE = RC + COA_eq`. La **vida útil económica** es el n con CAUE mínimo.
- Defensor (enfoque del consultor): P = **valor de mercado hoy**. El costo original y el valor en libros son **costos hundidos**.
- Veredicto: si CAUE mín. defensor > CAUE mín. retador → **REEMPLAZAR AHORA**.
- Costo marginal del defensor: `CMₜ = (VMₜ₋₁ − VMₜ) + i·VMₜ₋₁ + COAₜ`. Se conserva mientras CMₜ < CAUE mín. del retador.
- Período de estudio H: se evalúan todas las combinaciones "defensor k años + retador H−k años" y se elige la de menor VP.

**Depreciación**
- Línea recta: `D = (P − S)/n`
- Saldo decreciente: `Dₜ = d·VLₜ₋₁`, `d = factor/n` (2 = doble, 1,5 = 150 %), sin bajar de S
- SDD con cambio a LR: se cambia cuando `(VL − S)/(años restantes)` supera a la de SDD
- Suma de dígitos: `Dₜ = (n − t + 1)/[n(n+1)/2] · (P − S)`
- MACRS (3, 5, 7 años, medio año): `Dₜ = rₜ·P` (ignora S)
- Unidades de producción: `Dₜ = uₜ/Σu · (P − S)`
- Ahorro fiscal: `Dₜ·T`; se compara el **VP** de ese ahorro entre métodos.

**Indicadores**
- `VPN = −P + A(P/A,i,n) + S(P/F,i,n)` · `VAE = VPN(A/P,i,n)`
- TIR: tasa con VPN = 0, por **bisección**
- `B/C = [A(P/A) + S(P/F)] / P`
- Recuperación simple `P/A`; descontada: año en que Σ A(P/F) ≥ P (con interpolación)
- Ahorro mínimo: `[P − S(P/F)] / (P/A)`
- Después de impuestos: `FEDI = A − T(A − D)`; el último año suma `S − T(S − VLₙ)`
- Inflación: `i_f = i + f + i·f`

## 4. Valores verificados por las pruebas (datos por defecto)

| Resultado | Valor |
|---|---|
| CAUE retador n = 1…8 | 18.640,00 · 16.224,91 · 15.221,79 · 14.643,09 · **14.347,94** · 14.457,86 · 14.735,60 · 15.165,89 |
| CAUE defensor n = 1…4 | **20.840,00** · 21.455,09 · 22.234,17 · 23.092,41 |
| Veredicto | REEMPLAZAR AHORA (20.840,00 > 14.347,94) |
| Ahorro anual / recuperación simple | 12.600 / 1,94 años |
| VPN / TIR | 23.473,60 / 44,59 % |
| SDD | 9.800 · 5.880 · 3.528 · 792 · 0 (VL final 4.500) |
| MACRS 5 años | 4.900 · 7.840 · 4.704 · 2.822,40 · 2.822,40 · 1.411,20 |

## 5. Guía de demostración (5 minutos)

1. **(30 s) Intro y login** — intro animada; entrar como *Eduardo Lara* (Gerente General) y mostrar en Configuración cómo se agrega una persona.
2. **(45 s) Dashboard** — KPIs animados, ventas por sucursal, quiebres y anomalías detectadas por IA.
3. **(45 s) Operación** — *Inventario*: abrir un kardex (promedio ponderado), imprimir código de barras/QR, hacer una transferencia. *IA*: pronóstico a 30 días y "Generar órdenes en borrador".
4. **(2 min) Análisis económico**
   - *b · Reemplazo*: veredicto **REEMPLAZAR AHORA**, pulsar "Ver procedimiento" en una fila.
   - *e · Vida útil*: curva en U con mínimo en n = 5.
   - *c · Enfoques*: por qué los $15.000 originales son costo hundido.
   - *f · Depreciación*: comparar métodos y el VP del ahorro fiscal.
   - *i · Sensibilidad*: mover la TMAR de 5 % a 25 % y ver todo recalcularse.
   - En **Parámetros** cambiar un valor (ej. inversión a 35.000) → "Guardar escenario" → pestaña *Escenarios*.
5. **(1 min) Modo Defensa** (botón *Modo Defensa ↗*, se abre en otra pestaña) — escribir una pregunta libre, p. ej. *"¿y si la TMAR fuera 20 %?"* o *"¿qué pasa si el sistema actual se vende en $5.000?"*: la respuesta usa los números de la pregunta y muestra el procedimiento. Generar una **pregunta sorpresa** y usar la calculadora de factores.
6. **Cierre** — pestaña *k · ¿Con mi dinero?* + exportar el análisis a **Excel** (fórmulas reales) y **PDF**.

Tras cambiar parámetros, use **Restaurar valores del proyecto** para volver a los datos originales.

## 6. Nota tributaria

En Ecuador (SRI) el método usual para efectos tributarios es **línea recta**. Los métodos acelerados (SDD, SDA, MACRS) se incluyen para análisis gerencial y comparación académica.


## 7. Material para la exposición

`GUIA_PRESENTACION.md` contiene todo lo necesario para generar las diapositivas y la división de la exposición entre los 6 integrantes.
