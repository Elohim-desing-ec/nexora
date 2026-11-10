# NEXORA Global — Software de operaciones e inventario para cualquier empresa, en cualquier país

> Documento explicativo del proyecto. Sirve para entender el sistema, preparar la exposición o dárselo a una IA para generar diapositivas.
> Complementa a `GUIA_PRESENTACION.md` (guion y división del equipo) y a `README.md` (instalación y fórmulas).

---

## 1. La idea en una frase

**NEXORA es una plataforma web que cualquier empresa del mundo —desde una tienda hasta una red multinacional— puede usar para controlar su inventario en todas sus sucursales, reducir pérdidas, automatizar sus compras y recibir reportes inteligentes**, y que además demuestra con Ingeniería Económica que reemplazar el software antiguo es rentable.

---

## 2. El problema que resolvemos

Muchas empresas siguen usando un **software de inventario antiguo** (de escritorio, de hace años) que:

| Problema | Consecuencia para la empresa |
|---|---|
| Genera **pérdidas de inventario** (errores de conteo, mermas no detectadas, devoluciones) | Dinero que se pierde cada mes sin que nadie lo vea |
| Requiere **mantenimiento constante** | Gastos fijos y dependencia de un técnico |
| Tiene **altos costos de soporte** y se cae con frecuencia | Horas extra, ventas perdidas, clientes molestos |
| No muestra la información a tiempo | Productos agotados (quiebres) o exceso de stock (capital inmovilizado) |
| Funciona solo en un local | No sirve para empresas con varias sucursales o en varios países |

En el caso base del análisis económico, estos problemas cuestan **$ 19.800 al año**.

---

## 3. Nuestros tres objetivos y cómo los cumple NEXORA

### Objetivo 1 — Reducir las pérdidas
- **Kardex con costo promedio ponderado**: cada entrada y salida queda registrada con su costo y saldo.
- **Detección de anomalías con IA**: el sistema compara cada movimiento con el historial del producto (z-score) y marca los atípicos, que pueden ser errores o robos.
- **Control de mermas y vencimientos**: alertas de productos que vencen en menos de 60 días y del valor perdido en mermas.
- **Trazabilidad completa**: quién hizo cada acción, cuándo y en qué sucursal.

### Objetivo 2 — Automatizar los procesos
- **Pronóstico de demanda a 30 días** (regresión lineal + estacionalidad + promedio móvil).
- **Punto de reorden automático** con stock de seguridad (95 % de nivel de servicio).
- **Órdenes de compra sugeridas en un clic**, agrupadas por proveedor.
- **Flujo de aprobación** (Borrador → Aprobada → Recibida): al recibir, el stock, el costo promedio y el kardex se actualizan solos.
- **Carga masiva desde Excel** y **asistente virtual** que responde dudas y consulta datos.

### Objetivo 3 — Generar reportes inteligentes
- **Reporte ejecutivo inteligente** (Reportes): el sistema analiza todos los datos y redacta un resumen con hallazgos clasificados (crítico, alerta, oportunidad, OK) y la **acción recomendada** para cada uno:
  - productos en quiebre y compra sugerida,
  - mermas de los últimos 90 días y su % sobre el costo de ventas,
  - movimientos atípicos,
  - capital inmovilizado en sobrestock,
  - productos sin ventas en 90 días,
  - productos por vencer,
  - órdenes pendientes y proveedores incumplidos,
  - impacto económico de NEXORA (ahorro, VPN, TIR).
- Exportación a **PDF y Excel** con el membrete de la empresa; el análisis económico se exporta con **fórmulas reales de Excel**.

---

## 4. Nivel nacional e internacional

| Capacidad | Cómo funciona |
|---|---|
| **Cualquier empresa** | Al primer ingreso, un asistente de bienvenida configura la empresa: razón social, país, moneda, identificación fiscal y sector. |
| **Cualquier país** | Catálogo real de 47 países con su moneda (ISO 4217) y el nombre de su identificador fiscal (RUC, NIT, RFC, CUIT, NIF, EIN…). |
| **Sucursales ilimitadas** | Matrices, sucursales, bodegas, centros de distribución o tiendas, en cualquier ciudad del mundo. |
| **Ubicación real** | La dirección se busca en **OpenStreetMap** y se guardan las coordenadas reales; también se puede hacer clic en el globo. |
| **Moneda de la empresa** | Todos los montos se muestran en la moneda elegida (USD, EUR, COP, MXN, PEN…). |
| **Tipos de cambio reales** | En Red global, el inventario de cada país se muestra también en su **moneda local** con la tasa del día (open.er-api.com). |
| **Red global en 3D** | Globo terráqueo interactivo con todas las sucursales y las transferencias entre ellas. |
| **Gran volumen de datos** | La información se guarda en **IndexedDB** (cientos de MB, frente a ~5 MB de un almacenamiento web normal) y el inventario se pagina de 50 en 50. |

---

## 5. El globo 3D (Red global)

- Es un **globo terráqueo real** (proyección esférica de MapLibre GL) que se puede:
  - **girar** arrastrando con el mouse o el dedo,
  - **acercar hasta nivel de calle** con la rueda o pellizcando,
  - **inclinar** con clic derecho y arrastrar,
  - poner en **pantalla completa**.
- Tres vistas: **Oscuro** (mapa CARTO), **Satélite** (imágenes de Esri) y **Claro** (OpenFreeMap / OpenStreetMap).
- Cada sucursal es un **punto de luz**; mientras más inventario tiene, más grande es. Al hacer clic se ve su detalle.
- Las **transferencias de mercadería** entre sucursales se dibujan como **arcos por el círculo máximo**, la ruta más corta sobre la Tierra (como las rutas aéreas).
- El mundo **gira solo** hasta que el usuario lo toca. Al elegir una sucursal en la lista, la cámara **vuela** hasta ella.
- Debajo del globo, el **consolidado por país**: sucursales, ciudades, unidades, inventario en moneda de la empresa y en moneda local, ventas y participación.

---

## 5.1 Diseño "obsidiana y oro" y página de presentación

- **Paleta negro y oro** en todo el sistema (y un modo claro "marfil y oro"), con contraste accesible: texto oscuro sobre botones dorados.
- **Horizonte dorado**: la firma visual de NEXORA, un arco de luz con un destello que recorre su borde (intro, página de presentación e ingreso).
- **Página de presentación** (lo primero que se ve sin iniciar sesión): al hacer scroll, el panel de NEXORA **emerge desde el horizonte** inclinado en 3D, las cifras cuentan al aparecer, las tarjetas se revelan una a una, una tarjeta dorada gira con el scroll y las barras del CAUE se llenan. Todas las cifras son las reales del proyecto.
- **Animaciones al desplazarse** en todas las pantallas del sistema (las tarjetas aparecen al entrar en la vista).
- Respeta la preferencia "reducir movimiento" del sistema operativo.

## 6. "Datos reales": qué significa en NEXORA

1. **El sistema arranca vacío.** No trae productos, ventas ni proveedores inventados: cada empresa carga los suyos.
2. **Tres formas de cargar datos:**
   - asistente de bienvenida (empresa y sede principal),
   - **plantilla de Excel** con una columna de stock por cada sucursal (se reconoce por código, ciudad o nombre),
   - registro uno por uno (productos, ventas, compras, ajustes, mermas, transferencias).
3. **Datos externos reales:**

| Dato | Fuente | Uso |
|---|---|---|
| Direcciones y coordenadas | OpenStreetMap (Nominatim) | Ubicar sucursales |
| Mapas del mundo | CARTO, OpenFreeMap (OpenStreetMap) | Globo 3D |
| Imágenes satelitales | Esri World Imagery | Vista satélite |
| Tipos de cambio del día | open.er-api.com | Valor del inventario en moneda local |
| Países y monedas | Normas ISO 3166 e ISO 4217 | Configuración de la empresa |

4. **Respaldo:** un archivo `.json` con toda la información, para no perderla o llevarla a otra computadora.

---

## 7. ¿Cómo funciona por dentro? (explicado simple)

```
 Usuario (navegador: PC, tablet o celular)
        │
        ▼
 Interfaz NEXORA  ── React + TypeScript + Tailwind (diseño glassmorphism 2026)
        │
        ├── Motor financiero ........ finance.ts (CAUE, VPN, TIR, depreciación) — 27 pruebas automáticas
        ├── IA estadística .......... pronóstico, reorden, anomalías (sin internet)
        ├── Reporte inteligente ..... analiza los datos y recomienda acciones
        ├── Asistente ............... entiende preguntas y consulta los datos
        ├── Globo 3D ................ MapLibre GL (WebGL)
        │
        ├── Datos de la empresa ..... IndexedDB del navegador (+ respaldo .json)
        └── Datos externos .......... OpenStreetMap · tipos de cambio · mapas satelitales
```

- **Es una aplicación web**: no se instala; se abre en el navegador.
- **Funciona sin internet** para la operación diaria (inventario, ventas, IA, análisis económico). Solo el globo, la búsqueda de direcciones y los tipos de cambio necesitan conexión.
- **Seguridad por roles**: Gerente General, Jefe de Bodega, Analista Financiero, Auditor y Ayudante; cada uno ve solo lo que le corresponde. Todo queda en la bitácora de auditoría.

---

## 8. Cómo empieza a usarlo una empresa nueva (5 pasos)

1. **Ingresa el Gerente General** → el asistente de bienvenida pide la empresa (país, moneda, ID fiscal, sector) y la sede principal, ubicada en el mapa.
2. **Configuración → Empresa** → agrega todas sus sucursales, en el país que sea.
3. **Configuración → Usuarios** → crea a su equipo con usuario y contraseña fáciles.
4. **Compras → Nuevo proveedor** y **Configuración → Mis datos → Plantilla Excel** para cargar sus productos.
5. **Opera**: registra ventas, compras y transferencias. El Dashboard, la Red global, la IA y el Reporte inteligente se llenan solos.

---

## 9. ¿Sirve para empresas grandes? Lo que hay hoy y lo que sigue

### Lo que ya está listo
- Sucursales y países **ilimitados**, catálogo de productos paginado, almacenamiento de gran capacidad.
- Roles, auditoría, respaldo, reportes inteligentes, IA y análisis económico.
- Diseño adaptable a computadora, tablet y celular.

### Hoja de ruta para un despliegue corporativo (fase 2)

| Necesidad de una gran empresa | Solución prevista |
|---|---|
| Que varias personas trabajen **al mismo tiempo desde distintas ciudades** con los mismos datos | Base de datos en la nube (PostgreSQL / Supabase) con sincronización en tiempo real |
| Muchas empresas usando el mismo sistema (**SaaS**) | Arquitectura multiempresa (cada empresa ve solo sus datos, con seguridad a nivel de fila) |
| Acceso seguro | Contraseñas cifradas, doble factor de autenticación e inicio de sesión corporativo |
| Operación en varias monedas | Precios y costos por moneda local con conversión automática al consolidar |
| Facturación | Integración con la facturación electrónica de cada país (SRI, DIAN, SAT, SUNAT…) |
| Idiomas | Interfaz en español, inglés y portugués |
| Integraciones | Conexión con ERP, tiendas en línea, lectores de código de barras y balanzas |
| Disponibilidad | Publicación en la nube con dominio propio, copias automáticas y monitoreo |

> Hoy cada navegador guarda su propia información. Para que **todos usen los mismos datos desde cualquier lugar**, el siguiente paso es conectar la base de datos en la nube (fase 2).

---

## 10. Resultado económico (resumen)

| Indicador | Valor |
|---|---|
| Costo anual del software antiguo | $ 19.800 |
| Costo anual con NEXORA | $ 7.200 |
| **Ahorro anual** | **$ 12.600 (−64 %)** |
| Inversión | $ 24.500 |
| CAUE mínimo defensor vs retador | $ 20.840,00 vs $ 14.347,94 |
| **Veredicto** | **REEMPLAZAR AHORA** |
| VPN (5 años, 12 %) | $ 23.473,60 |
| TIR | 44,59 % |
| Recuperación | 1,94 años |

---

## 11. Demostración sugerida de la versión global (3 minutos)

1. Abrir NEXORA (intro animada) e ingresar como `eduardo`.
2. Si es la primera vez: completar el **asistente de bienvenida** (empresa + sede principal buscando la dirección real).
3. **Configuración → Empresa → Agregar sucursal**: crear una sucursal en otro país (ej. Bogotá o Madrid) buscando su dirección.
4. **Inventario**: crear un producto y **transferir** unidades a la sucursal internacional.
5. **Red global**: mostrar el globo girando, el arco de la transferencia cruzando el océano, cambiar a **Satélite** y volar hasta la sucursal a nivel de calle; mostrar el valor en moneda local con el tipo de cambio del día.
6. **Reportes → Reporte ejecutivo inteligente**: leer el resumen y las acciones recomendadas; descargar el PDF.
