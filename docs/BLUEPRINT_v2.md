# Global Entry Strategy Studio — Auditoría y blueprint v2

**De herramienta de selección de país a estudio de estrategia corporativa y de entrada**

Base teórica: Lasserre & Monteiro, *Global Strategic Management*, 5ª ed., Parte II (caps. 5–8, pp. 175–350), complementada con los módulos 7, 8, 10, 11, 12 y 16 del programa INSEAD CSO.
Base de código auditada: `RafaDiazRios/global-entry-strategy` (commit del 10-sep-2026).

---

## 0. Resumen ejecutivo

**El diagnóstico en una frase:** la aplicación actual resuelve bien un problema que no es el que tienes. Es un comparador multicriterio de países con un DCF encima; tú necesitas un estudio de estrategia que empiece en la ambición global de la empresa y termine en un modo de entrada justificado, con la evidencia del caso trazada en cada paso.

Los cinco hallazgos:

1. **Falta la mitad superior del marco.** El capítulo 5 (ambición global, posicionamiento, sistema de negocio, organización) no existe en el código. La app arranca en "elige países", que en el libro es el paso 2 de 6 (Fig. 6.1, p. 226). Sin ese piso superior no hay análisis de estrategia corporativa: hay comparación de mercados.

2. **Falta el capítulo 8 entero.** No hay análisis de encajes (estratégico, de capacidades, cultural, organizativo), ni análisis de socio, ni valoración de adquisición con sinergias, ni modo de integración. La app *recomienda* "adquisición" o "joint venture" como salida de una fórmula ponderada y ahí se detiene — justo donde el libro dedica 66 páginas y donde se pierde el 45–75% del valor de las operaciones (p. 289).

3. **Lo cualitativo se ha comprimido a 13 deslizadores sin evidencia.** Toda la riqueza de los caps. 6 y 7 — las 21 dimensiones CAGE (Fig. 6.11, p. 243), las 6 fuerzas con sus determinantes (Tabla 6.4, pp. 238–239), los 4 riesgos con sus 23 componentes (Fig. 6.12, p. 244), los 5 tipos de incentivo (Tabla 6.5, pp. 241–242) — se han colapsado en `calibration`, un vector de 13 escalares 0–100 sin fuente, sin cita y sin justificación. Para un caso de estudio esto es inservible: un caso son hechos, y la herramienta no tiene dónde ponerlos.

4. **No hay caso.** No existe entidad "caso", ni ingesta de documento, ni campo narrativo, ni libro de evidencias. Existe `valueProposition` (hasta 1.200 caracteres) y se ignora en todos los cálculos. La buena noticia: `server/_core/llm.ts` ya expone un cliente LLM con soporte de `file_url` con `mime_type: application/pdf` y `response_format: json_schema` estricto — la pieza más cara del "modo caso" ya está en el repositorio, sin usar.

5. **El motor tiene defectos que invalidan la decisión, no solo la afinan.** La confianza de evidencia se calcula contando cuántos deslizadores has movido de 50; el ROI que se compara contra el umbral excluye el valor terminal que sí entra en el NPV; la licencia se valora con el mismo DCF que una filial propia; el impuesto no tiene escudo por pérdidas. Detalle en §4.

**La decisión de diseño central de la v2:** el objeto raíz deja de ser *el escenario de comparación de países* y pasa a ser **el caso**. Un caso contiene documentos, un libro de evidencias, y siete bloques de análisis encadenados que van de la ambición al gate de inversión. Cada afirmación cualitativa deja de ser un número y pasa a ser una tripleta `{juicio, evidencia, confianza}`. La IA propone, cita y nunca decide. Y un motor de coherencia contrasta los bloques entre sí — eso es lo que convierte la herramienta en un guía de análisis exhaustivo en lugar de una calculadora con opinión.

---

## 1. Qué hay hoy

Stack: React 19 + Vite + wouter + shadcn, Express + tRPC v11, Drizzle/MySQL, plantilla Manus. ~15.200 líneas TS/TSX, de las que el dominio real son ~2.900.

| Pieza | Fichero | Qué hace |
|---|---|---|
| Motor de puntuación | `server/strategy/engine.ts` (453) | 6 subpuntuaciones, atractividad ponderada, ajuste por riesgo, ranking de 7 modos, timing en 3 estados, flags |
| Motor financiero | `server/strategy/financialEngine.ts` (507) | TAM/SAM/SOM, FCF, NPV, valor terminal, ROI, payback, 3 escenarios de sensibilidad, política de umbrales |
| Datos públicos | `worldBank.ts`, `wgi.ts`, `countryFinancialData.ts` | 10 indicadores WDI, 5 dimensiones WGI, tipo corporativo Tax Foundation, FX Frankfurter |
| API | `server/routers.ts` (308) | 14 procedimientos tRPC; `evaluate` es puro y síncrono; `saveScenario` reejecuta el motor en servidor |
| UI | `client/src/pages/Home.tsx` (722) | Componente monolítico con 7 pestañas y ~25 `useState`, sin persistencia de borrador |
| Persistencia | `drizzle/schema.ts` (67) | 4 tablas; el escenario entero vive en dos blobs JSON opacos (`inputJson`, `resultJson`) |
| Informe | `client/src/lib/strategyReportPdf.ts` (358) | jsPDF + autotable, una página por país |
| LLM (sin usar) | `server/_core/llm.ts` (454) | Cliente compatible OpenAI: `messages` con `file_url`/PDF, `tools`, `json_schema` estricto, reintentos. Único consumidor: `ComponentShowcase.tsx:1409` |

Lo que está bien hecho y hay que conservar: la disciplina de trazabilidad de datos públicos (`manualFields`, `sourceStatus`, restauración selectiva, refresco programado que respeta ediciones manuales), la separación explícita entre dato público y supuesto, el rechazo a inventar cifras cuando falta un input (`insufficient_data`), y el lenguaje de gobierno del README ("una puntuación no es una recomendación de inversión"). Eso es el 20% del trabajo que suele faltar en estas herramientas.

---

## 2. Diagnóstico

### 2.1 El problema conceptual

El libro plantea la decisión como una cascada de seis bloques (Fig. 6.1, p. 226):

```
                      ┌─ (1) Country opportunities
  Assessing country   ├─ (2) Country risk analysis
  attractiveness      └─ (3) Competitive analysis (external / internal)
                      ┌─ (4) Defining ambition and positioning
  Implementing entry  ├─ (5) Entry mode and development paths
                      └─ (6) Organization: control
```

Y el capítulo 5 antepone a todo eso la pregunta que ordena las demás: *¿qué papel quiere jugar esta empresa en el mercado mundial?* (ambición → posicionamiento → sistema de negocio → organización, Fig. 5.3, p. 181).

La app implementa (1) y (2) de forma reducida, (3) como un solo deslizador, (5) como una fórmula, y no implementa (4) ni (6) ni el capítulo 5. El resultado es que la herramienta puede decirte que México puntúa 71 y Polonia 68 sin haberte preguntado nunca si la empresa aspira a ser *global player*, *regional player*, *global exporter* o *global sourcer* (pp. 181–182) — que es precisamente lo que determina si México y Polonia son siquiera los países que hay que comparar.

Para un caso de estudio esto es fatal: un caso te da una empresa con una historia, una posición competitiva y una intención. La app no tiene dónde meter nada de eso.

### 2.2 Cobertura real de la Parte II

| Cap. | Marco del libro | Ref. | Estado hoy |
|---|---|---|---|
| 5 | Ambición global: rationale (market/resource/capability seeking) y scope (5 roles) | pp. 181–182 | **Ausente** |
| 5 | Transnational Index / Global Revenue Index / Global Capabilities Index + mapping GCI×GRI | pp. 184–186, Fig. 5.5 | **Ausente** |
| 5 | Clasificación de países por importancia estratégica (key / emerging / platform / marketing / sourcing) | pp. 187–188 | **Ausente** |
| 5 | Posicionamiento global: 8 alternativas (niche/broad × standard/adaptive × diferenciación/coste) | Tabla 5.4, p. 190 | **Ausente** |
| 5 | Value curve y propuesta de valor en 3 dimensiones | Figs. 5.8–5.9, p. 189 | **Ausente** (`valueProposition` es texto muerto) |
| 5 | Sistema de negocio: distribución global/regional/local de 6 funciones | Fig. 5.12, p. 193 | **Ausente** |
| 5 | Transfer–Adapt–Create de recursos, activos y competencias | Fig. 5.14, p. 199 | **Ausente** |
| 5 | Ventaja competitiva: 5 tipologías y 4 vías de sostenibilidad | Tablas 5.5 y 5.7, pp. 194, 197 | **Ausente** |
| 5 | Etapas de globalización (export → multinacional → global) y diseño organizativo | Tabla 5.8, pp. 200–202 | **Ausente** |
| 6 | Distinción mercado / recursos / industria como fuentes de atractividad | Fig. 6.3, p. 229 | **Parcial**: hay `market` y `resources` pero mezclados con calibración, sin la lógica de las tres preguntas (p. 227) |
| 6 | Taxonomía de indicadores macro (económicos, sociológicos, demográficos, institucionales) | Tabla 6.1, p. 231 | **Parcial**: 10 de ~20; faltan distribución de renta, niveles educativos, I+D, gasto público, edad |
| 6 | Curvas de penetración y elasticidad frente a PIB per cápita | Figs. 6.4–6.5, p. 230 | **Ausente** |
| 6 | Efecto clase media (umbral de renta) | Fig. 6.6, p. 232 | **Ausente** |
| 6 | Clusters de ciclo de vida de país y características de demanda | Tabla 6.2, p. 234 | **Ausente** |
| 6 | Recursos humanos: skills × pay-and-productivity | Fig. 6.10, p. 236 | **Ausente** |
| 6 | Cinco fuerzas + políticas gubernamentales, con determinantes específicos de entrada internacional | Tabla 6.4, pp. 238–239 | **Reducido a 1 deslizador** (`competitionAttractiveness`) |
| 6 | Country diamond (dotación, calidad de demanda, rivalidad, industrias de soporte) | p. 239 | **Ausente** |
| 6 | Incentivos gubernamentales: 5 familias, ~25 instrumentos | Tabla 6.5, pp. 241–242 | **Ausente** |
| 6 | CAGE con 21 dimensiones nombradas | Fig. 6.11, p. 243 | **Reducido a 1 deslizador** (`cageDistance`) |
| 6 | Riesgo país: 4 categorías, 23 componentes, con exposición separada de accionista / empleado / operación | Fig. 6.12, p. 244 | **Reducido a 4 deslizadores** |
| 6 | Variabilidad económica como coeficiente de variación del crecimiento | Fig. 6.13, p. 245 | **Ausente** (calculable con los datos que ya se descargan) |
| 6 | Clustering en 6 dimensiones y perfiles estratégicos (hubs, gigantes emergentes, etc.) | Tabla 6.6, p. 249 | **Ausente** |
| 6 | Matriz de síntesis oportunidades × riesgos | Fig. 6.2, p. 227 | **Ausente** (hay un escalar `riskAdjusted`, que no es lo mismo) |
| 7 | Cuatro objetivos de entrada con sus KPI, timing y modos asociados | Tabla 7.1, pp. 260–261 | **Parcial**: existe `objective` pero solo modula la etiqueta y un sumando de +8/+5 |
| 7 | Cuatro fases de ventana (premature / window / competitive growth / mature) | pp. 261–262 | **Ausente** (hay 3 estados inventados por umbrales) |
| 7 | First mover: ventajas y desventajas | Tabla 7.2, p. 262 | **Ausente** |
| 7 | Pace of entry: 6 factores determinantes | p. 262 | **Ausente** |
| 7 | Clasificador de modos por control × intensidad de inversión | Fig. 7.1, p. 263 | **Ausente** |
| 7 | Comparación de modos en 8 criterios | Tabla 7.4, p. 271 | **Sustituido** por una fórmula ponderada propia sin correspondencia con el libro |
| 7 | Mapping modo × (atractividad × clima de inversión) | Fig. 7.3, p. 272 | **Ausente** |
| 7 | Entrada digital: relacional / digital / híbrido | Tabla 7.5, p. 272 | **Reducido** a un `regex` sobre el string de modelo de negocio |
| 7 | Opción real: precio de la opción y decisión de ejercicio | p. 270 | **Mencionado en docs, no modelado** |
| 8 | Motivos de M&A: market reach / consolidation / competences | p. 291 | **Ausente** |
| 8 | Cuatro encajes (estratégico, capacidades, cultural, organizativo) | Fig. 8.3, p. 293 | **Ausente** |
| 8 | Matriz de capacidades 3×5 (recursos/activos/competencias × cadena de valor) | Fig. 8.4, p. 294 | **Ausente** |
| 8 | Valoración: stand-alone + sinergias = rango de negociación | Fig. 8.5, p. 298 | **Ausente** |
| 8 | Modos de integración contingentes (preservación / simbiosis / absorción) | Fig. 8.7, p. 301 | **Ausente** |
| 8 | Fase de transición: 8 cuestiones | pp. 302–305 | **Ausente** |
| 8 | Tipología de alianzas por scope × objetivo | Fig. 8.8, p. 308 | **Ausente** |
| 8 | Análisis de socio: 4 encajes + criticidad + matriz 4×4 de agendas | Figs. 8.11–8.13, pp. 314–316 | **Ausente** |
| 8 | Diseño organizativo de la alianza (operator/broker × leverage/learning) | Fig. 8.14, p. 317 | **Ausente** |
| 8 | Reparto de valor en JV (dividendos, royalties, transfer pricing, comisiones, aprendizaje) | Tabla 8.4, p. 313 | **Ausente** |
| 8 | Death valley y 7 causas de fracaso de JV | Fig. 8.17 y pp. 336–337 | **Ausente** |
| 8 | Constelaciones (network/portfolio/web) y ecosistemas industriales | Figs. 8.18, 8.22–8.24 | **Ausente** |

Cobertura estimada de la Parte II: **~15%**, concentrada en el cap. 6 y la mitad del cap. 7.

### 2.3 Lo que el modo caso necesita y no existe

| Necesidad | Estado |
|---|---|
| Subir un PDF o pegar el texto de un caso | No hay endpoint de upload, ni `multipart`, ni parser. Sí hay `storagePut` (S3 vía Forge) y `storageProxy` |
| Extraer hechos con cita al párrafo | No hay router `ai`, ni tabla de evidencias, ni tipo de cita |
| Distinguir hecho / supuesto / juicio | Solo `manualFields` para datos públicos; nada para lo cualitativo |
| Campos narrativos por bloque | Solo `notes` y `evidence` como texto libre en los gates |
| Preguntas socráticas por marco | No existen; las únicas frases generadas son plantillas de umbral (`financialEngine.ts:483-499`) y `flags` fijos (`engine.ts:388-395`) |
| Versionado del análisis | `saveScenario` siempre inserta fila nueva (`db.ts:60-65`); no hay update ni historial comparable |

---

## 3. Defectos concretos del motor actual

Estos hay que corregirlos con independencia del rediseño, porque afectan al resultado que la herramienta presenta como decisión.

**Financieros** (`financialEngine.ts`)

1. **Confianza falsa.** `calculateConfidence` = `20 + nDatos*4 + min(nSlidersMovidos, 8)*2`. Un deslizador dejado deliberadamente en 50 tras estudiar el caso cuenta como "no especificado"; uno movido al azar cuenta como evidencia. Y esta cifra es una de las seis condiciones del veredicto "Avanzar" (`recommendInvestmentAction`, línea 482). Sustituir por cobertura real de evidencia (§5.3).
2. **ROI incoherente con NPV.** `ROI = (ΣFCF − I)/I` excluye el valor terminal (línea 337), pero el NPV sí lo incluye (línea 331). Un negocio cuyo valor está mayoritariamente en la perpetuidad puede pasar el umbral de NPV y fallar el de ROI, y viceversa. Decide una convención y documenta cuál: ROI sobre flujo del horizonte *o* MOIC incluyendo terminal, pero no mezclar.
3. **Impuesto sin escudo por pérdidas.** `taxes = max(EBIT,0) × tasa` (línea 299), sin arrastre de bases negativas. En una entrada greenfield con 2–3 años de pérdidas iniciales — el caso normal — esto infravalora el proyecto de forma sistemática.
4. **La licencia se valora como una filial.** `calculateMode` aplica la misma fórmula a los siete modos, cambiando solo inversión inicial, coste anual y `revenueCapturePct` (líneas 297–301). Una licencia no tiene EBIT sobre ventas del mercado: tiene royalty sobre ventas del licenciatario más lump sum inicial más margen en componentes (p. 268). Un distribuidor no tiene capital de trabajo propio. Una adquisición tiene precio y sinergias, no inversión greenfield. Ver §5.6.
5. **SOM lineal.** La cuota se interpola linealmente entre año 1 y horizonte (líneas 209–210). Las curvas de penetración del libro (Figs. 6.4–6.5) son logarítmicas o en campana. Ofrecer al menos lineal / curva-S / definida por el usuario.
6. **Payback sin interpolación** (línea 310): devuelve el año entero, comparado contra un umbral que el usuario expresa en años. Interpolar dentro del año.
7. **Sensibilidad de tres palancas.** `priceRevenuePct`, `operatingMarginPctPoints`, `fxRatePct` (líneas 385–435). Faltan las palancas que más mueven una entrada: cuota alcanzada (SOM), retraso de rampa, inversión inicial y coste de capital. Y falta un tornado que ordene las palancas por sensibilidad en lugar de tres escenarios fijos.

**De puntuación** (`engine.ts`)

8. **Todo compensatorio.** La atractividad es una media ponderada: un riesgo político inaceptable se compensa con un PIB grande. El libro es explícito en que la tercera pregunta —"¿son los riesgos aceptables para accionistas y empleados?" (p. 227)— es eliminatoria, no ponderable. Faltan **knock-outs**.
9. **Mezcla fija de dato y opinión.** Gobernanza: `0,65 × calibración + 0,35 × WGI` siempre (líneas ~350). El peso del dato objetivo debería subir cuando el dato es reciente y completo, y bajar cuando es viejo o parcial — no ser una constante.
10. **El modo digital depende de un regex.** `/(digital|saas|software|plataforma|marketplace|e-commerce)/i` sobre el string libre `businessModel` (línea ~250 de `calculateEntryModes`). Sustituir por la clasificación explícita de la Tabla 7.5 (relacional / digital / híbrido) elegida por el analista.
11. **Fórmulas de modo sin procedencia.** Los coeficientes (0,28 · atractividad + 0,22 · seguridad + …) no salen del libro ni de ninguna fuente citable. Como salida de una herramienta de estudio, un número sin procedencia es peor que ningún número. Sustituir por el scoring explícito de la Tabla 7.4 con pesos que el usuario ve y edita.

**Estructurales**

12. Tipos duplicados en cuatro sitios (`server/strategy/*`, zod de `routers.ts`, a mano en `Home.tsx:51-120` y en `strategyReportPdf.ts:4-73`); `shared/types.ts` solo reexporta el esquema Drizzle. Añadir un campo obliga a tocar cuatro ficheros.
13. `Home.tsx`: 722 líneas, ~25 estados, sin persistencia. Una recarga pierde el borrador.
14. Catálogo de países duplicado y desalineado: monedas en `countryFinancialData.ts:42-47`, nombres y regiones en `Home.tsx:122-127`. 24 países.
15. Sin claves foráneas ni cascada; `saveScenario` siempre inserta; `resultJson` opaco impide comparar versiones o consultar por país.

---

## 4. Arquitectura objetivo

### 4.1 Principio

> **Caso → Evidencia → Juicio → Decisión → Gate.** Cada eslabón es visible, editable y trazable al anterior. Ningún número aparece sin poder abrir de dónde viene.

Tres reglas de diseño que se aplican en todos los módulos:

- **Un juicio no es un número, es una tripleta.** `{valor, evidencias[], confianza, autor}`. El valor puede ser un escalar 0–100, una categoría o un texto. Las evidencias apuntan al libro mayor. La confianza se deriva, no se escribe.
- **La IA propone; la persona acepta.** Toda salida de LLM entra como `status: "suggested"` con citas obligatorias. Nada calculado usa una sugerencia no aceptada.
- **La incoherencia es una salida de primera clase.** Un análisis internamente contradictorio se señala igual que un dato que falta.

### 4.2 Los siete módulos

```
M0  CASO            Documentos, ficha de empresa, libro de evidencias
     │
M1  AMBICIÓN        Rationale · roles · GRI/GCI · etapa · roles de país          (cap. 5, pp. 180-188)
     │
M2  POSICIÓN        Propuesta de valor · 8 posicionamientos · value curve
    Y SISTEMA       Cadena de valor global/regional/local · T-A-C · ventajas      (cap. 5, pp. 188-199)
     │
M3  PAÍSES          Mercado · recursos · industria (6 fuerzas) · incentivos
                    CAGE (21 dim.) · riesgo (23 comp.) · clusters · matriz O×R    (cap. 6)
     │
M4  ENTRADA         Por qué · cuándo (4 fases) · ritmo · modo (Tabla 7.4)
                    · opción real · modelo digital                                (cap. 7)
     │
M5  VÍA             Build-Borrow-Buy · 4 encajes · socio · integración
                    · alianza/ecosistema                                          (cap. 8 + mód. 8/11/12)
     │
M6  ECONOMÍA        Caso económico por modo · sensibilidad · umbrales · gate
    Y DECISIÓN      · informe

        ⟂ MOTOR DE COHERENCIA (contrasta M1..M6 entre sí)
        ⟂ ÍNDICE DE EXHAUSTIVIDAD (cobertura de marcos con evidencia)
```

El usuario puede entrar por cualquier módulo y saltar, pero el índice de exhaustividad muestra siempre qué queda sin cubrir y el motor de coherencia se ejecuta con lo que haya.

### 4.3 El libro mayor de evidencias

Una tabla, referenciada desde todos los módulos:

```ts
type Evidence = {
  id: string
  caseId: string
  kind: "document" | "public_data" | "interview" | "assumption" | "ai_extraction"
  claim: string                  // la afirmación, en una frase
  source: {
    label: string                // "Caso, §3" | "World Bank WDI" | "entrevista distribuidor local"
    documentId?: string
    locator?: string             // página, párrafo, celda
    url?: string
    retrievedAt?: string
  }
  quote?: string                 // cita literal cuando viene de documento
  reliability: 1 | 2 | 3 | 4 | 5 // 5 = dato oficial verificable; 1 = supuesto no contrastado
  createdBy: "user" | "ai"
  status: "accepted" | "suggested" | "rejected"
}
```

Cualquier juicio de cualquier módulo referencia cero o más evidencias. **Cero evidencias es un estado legítimo y visible** ("supuesto sin respaldo"), no un error silencioso.

Esto es lo que hace posible el análisis de casos: al leer un caso de Harvard o INSEAD, subrayas, y cada subrayado se convierte en una evidencia que después alimenta uno o varios marcos. Y al final, el informe puede imprimir la cadena completa: *"Recomendamos joint venture porque la sensibilidad de IP es alta (evidencia #14, caso §4, «la tecnología de recubrimiento representa el 60% del valor añadido»)"*.

### 4.4 El motor de coherencia

Reglas que cruzan módulos. Cada una devuelve `{severidad, mensaje, módulos implicados, referencia del libro}`. Trece para empezar:

| # | Regla | Ref. |
|---|---|---|
| C1 | Ambición = *global player* pero sin presencia ni plan en los países que concentran la demanda de la industria | Tabla 5.2, p. 183 |
| C2 | GRI objetivo > GRI actual sin ningún mercado candidato en fase *window* o *premature* | pp. 184, 261 |
| C3 | Posicionamiento estandarizado / liderazgo en coste + cadena de valor mayoritariamente local | p. 202 |
| C4 | Posicionamiento adaptativo + configuración 100% global sin capacidad local declarada | Fig. 5.12, p. 193 |
| C5 | Ventaja competitiva declarada sin ninguna de las 4 vías de sostenibilidad marcada | Tabla 5.7, p. 197 |
| C6 | Objetivo de entrada = *learning* + modo recomendado = distribuidor o licencia | Tabla 7.1, p. 261 |
| C7 | Sensibilidad de IP alta + modo licencia o franquicia | p. 268 |
| C8 | Fase = *mature* + modo greenfield sin producto innovador declarado | p. 262 |
| C9 | Distancia CAGE alta + ritmo rápido + ≥3 entradas simultáneas | p. 262 (Vermeulen & Barkema) |
| C10 | Agenda propia *venturing* frente a agenda de socio *extractive* → "encaje problemático" | Fig. 8.13, p. 316 |
| C11 | Interdependencias operativas altas + autonomía requerida alta pero modo de integración = absorción | Fig. 8.7, p. 301 |
| C12 | Recurso interno relevante y contratable (tradable) pero modo elegido = adquisición | Módulo 8 (BBB) |
| C13 | Moneda de umbrales ≠ moneda de reporte *(ya implementada; conservar)* | — |

Las reglas son datos, no código: viven en un fichero declarativo `shared/domain/coherence.ts` con predicados tipados, para poder añadirlas sin tocar el motor.

### 4.5 El índice de exhaustividad

Un panel que replica la estructura de la Parte II y marca, por cada marco, tres estados: **sin abordar** / **respondido sin evidencia** / **respondido con evidencia**. Es el sustituto honesto del "confidence" actual y, en la práctica, la funcionalidad que convierte la herramienta en un guía: te dice qué te falta por analizar, en el orden del libro.

Las *learning assignments* de cada capítulo (pp. 220–221, 253, 280, 345–346) se cargan como preguntas de autocomprobación al cierre de cada módulo.

---

## 5. Especificación por módulo

### M0 — Caso

**Propósito:** contener la materia prima y la ficha de la unidad de análisis.

Entradas:
- Documentos: PDF, DOCX o texto pegado. Múltiples por caso (el caso principal + anexos + notas propias).
- Ficha: empresa, país de origen, industria y subindustria, año del caso, tamaño (ingresos, empleados, activos — con desglose por región si el caso lo da), estructura de propiedad, y si es multinegocio, la lista de negocios.
- Pregunta de decisión: el mandato en una frase. Ej. *"¿Debe Essilor entrar en India con producción local o seguir exportando?"*.

Salidas: el caso queda disponible para el copiloto; la ficha alimenta M1 (los datos regionales de ventas y activos son el numerador de GRI/GCI).

Nota de implementación: la ingesta usa `storagePut` + URL firmada, y la extracción pasa la URL como `file_url` a `invokeLLM` con `mime_type: "application/pdf"`. No hace falta parser propio de PDF.

### M1 — Ambición global

**Marco:** Fig. 5.3 (p. 181), pp. 181–188.

| Bloque | Campos | Salida |
|---|---|---|
| Rationale | Checkbox múltiple: *market seeking* / *resource seeking* / *capability seeking*, con justificación por cada uno | Perfil de motivos |
| Rol actual y objetivo | Selector: *global player* / *regional player* / *regional dominant* / *global exporter* / *global sourcer* — dos veces (hoy y objetivo a N años) | Brecha de ambición |
| Índices | Ventas y activos (o empleo) por región + distribución regional de la demanda de la industria → **GRI** y **GCI** | Punto en el mapping Fig. 5.5 |
| Etapa de globalización | *export* / *multinacional* / *global*, con las características de la Tabla 5.8 como ayuda | Implicación organizativa |
| Roles de país | Para cada país del universo: *key* / *emerging* / *platform* / *marketing* / *sourcing*, con criterio justificado | Prioridad de inversión |

**Advertencia sobre GRI/GCI:** el libro define los índices pero remite la fórmula al apéndice online (p. 184). La implementación debe fijar y **documentar visiblemente** su convención. Propuesta: `GRI = Σᵢ min(Sᵢ, Wᵢ)` con `Sᵢ` = % de ventas de la empresa en la región *i* y `Wᵢ` = % de la demanda mundial de la industria en la región *i*, escala 0–1; ídem GCI con activos o empleo. Test de aceptación: el *learning assignment* 1 del cap. 5 (p. 220) da el caso de Air Liquide con datos reales — si tu implementación lo resuelve de forma defendible, sirve.

La Tabla 5.2 (p. 183, distribución regional de la demanda en 15 industrias) se carga como tabla semilla editable, para que el denominador no haya que buscarlo cada vez.

### M2 — Posicionamiento y sistema de negocio

**Marco:** pp. 188–199.

- **Propuesta de valor en tres dimensiones** (Fig. 5.8, p. 189): estandarización↔adaptación, coste↔diferenciación, segmento único↔múltiple. Selector triple que devuelve una de las **8 posiciones de la Tabla 5.4** (p. 190) con su etiqueta y ejemplo.
- **Value curve** (Fig. 5.9, p. 189): editor de atributos de valor con puntuación alta/baja para la empresa y para 1–3 competidores. Aquí engancha el módulo 10 de tu programa: sobre la misma curva, la rejilla **ERRC** (eliminar / reducir / aumentar / crear) genera la curva "to be", y el **buyer utility map** 6×6 (ciclo de experiencia × palancas de utilidad) localiza los puntos de dolor. Es el complemento natural, no un añadido: el libro ya cita blue ocean como quinta tipología de ventaja (Tabla 5.5, p. 194).
- **Configuración de la cadena de valor** (Fig. 5.12, p. 193): matriz de 6 funciones (I+D, sourcing/producción, marketing, servicio al cliente, finanzas, RRHH) × 3 niveles (global / regional / local). El usuario marca dónde está hoy y dónde debe estar. Esta matriz es la que alimenta después la decisión de qué actividades se localizan en el país de entrada.
- **Transfer–Adapt–Create** (Fig. 5.14, p. 199): por cada recurso, activo y competencia, etiqueta T / A / C respecto al país de destino. Salida directa: la lista de "C" es la lista de lo que hay que construir o conseguir de un socio — es decir, **el resource gap que abre M5**.
- **Ventajas competitivas y sostenibilidad** (Tablas 5.5 y 5.7, pp. 194, 197): tipología de capacidades y las 4 vías de sostenibilidad (lealtad, efectos de red/retroalimentación, pre-emption, barreras a la imitación), más el modo de construcción (first mover / leverage).
- **Liability of foreignness** (p. 198): campo obligatorio — qué desventaja concreta tiene la empresa por ser extranjera en este mercado y con qué ventaja superior la compensa. Sin respuesta, el módulo queda incompleto.

### M3 — Atractividad de países

Reemplaza la pestaña actual de Calibración. La estructura sigue la Fig. 6.3 (p. 229).

**3a. Oportunidades de mercado**
- Indicadores: ampliar los 10 actuales a la taxonomía de la Tabla 6.1 (p. 231), añadiendo `SI.POV.GINI` (distribución de renta), `SE.*` (niveles educativos), `GB.XPD.RSDV.GD.ZS` (gasto en I+D), `NE.CON.GOVT.ZS` (gasto público) y estructura de edad. Todos ya disponibles en la API de World Bank que el proyecto ya usa.
- **Curva de penetración** (Figs. 6.4–6.5, p. 230): el usuario elige un indicador de consumo de su industria y el sistema traza el ajuste frente a PIB per cápita sobre el conjunto de países, con su R. Es el instrumento que convierte "PIB de 450.000 M$" en "demanda esperada de X unidades".
- **Efecto clase media** (Fig. 6.6, p. 232): umbral de renta de entrada al segmento + escenario de crecimiento del PIB per cápita → variación del tamaño del segmento. Muestra la no linealidad, que es el punto del libro.
- **Calidad de la demanda** (Fig. 6.8 y Tabla 6.2, pp. 233–234): segmentación predominante y curva de valor del cliente en cada segmento, con el cluster de ciclo de vida del país (developing / emerging / fast industrializing / industrialized) precargando los valores típicos.

**3b. Oportunidades de recursos**
- Naturales, humanos, infraestructura/industrias de soporte, tecnológicos (p. 234 y ss.).
- **Skills × pay-and-productivity** (Fig. 6.10, p. 236): matriz 2×2 con los cuatro cuadrantes de coste unitario, alimentada con datos del WEF cuando estén disponibles y con juicio cuando no.
- Rol de hub / ventaja locacional.

**3c. Oportunidades de industria**
- **Las 6 fuerzas con los determinantes de entrada internacional** (Tabla 6.4, pp. 238–239): seis bloques, cada uno con su pregunta específica del libro (no "¿cómo de atractiva es la competencia?" sino "¿la política de licencias eleva artificialmente las barreras?", "¿hay política de contenido local que dé poder a los proveedores?", "¿están las redes de distribución fuertemente controladas?").
- **Country diamond** (p. 239): dotación, calidad de demanda, rivalidad, industrias de soporte y clusters.
- **Incentivos** (Tabla 6.5, pp. 241–242): checklist de las 5 familias y ~25 instrumentos, con la advertencia del libro de que su papel es secundario (p. 242, Guisinger).
- **ESG** (p. 242): el checklist de cuestiones medioambientales y sociales como filtro explícito.

**3d. Distancia CAGE**
Las 21 dimensiones nombradas de la Fig. 6.11 (p. 243), agrupadas en cultural (5), administrativa (5), geográfica (4) y económica (7), cada una con escala 0–4 y campo de justificación. Comparación bilateral desde el país de origen. Se puede precargar con datos objetivos donde existan (idioma común, bloque regional compartido, colonia común, distancia física, diferencia de PIB per cápita) y dejar el resto a juicio. El módulo debe mostrar el perfil, no solo la media — dos países con la misma media CAGE y perfiles opuestos exigen respuestas distintas.

**3e. Riesgo país**
Los 23 componentes de la Fig. 6.12 (p. 244), con la distinción del libro entre exposición de accionista (destrucción, expropiación, inflexibilidad de transferencia), de empleado (secuestro, gangsterismo, acoso) y operativa (disrupción de mercado, conflictividad, extorsión, escasez de suministros), más riesgo económico, competitivo y operativo. Dos añadidos calculables con datos que la app ya descarga:
- **Coeficiente de variación del crecimiento** (Fig. 6.13, p. 245): σ/μ de la serie de `NY.GDP.MKTP.KD.ZG` de los últimos 20 años. Es una medida objetiva de riesgo económico y hoy la app descarga la serie y se queda solo con el último valor.
- **Knock-outs**: umbrales por componente que declaran el país no elegible con motivo, en lugar de compensarse.

**3f. Síntesis**
- **Matriz oportunidades × riesgos** (Fig. 6.2, p. 227) con los países posicionados y los cuatro cuadrantes etiquetados. Esta es la salida visual principal del módulo, no una tabla de rankings.
- **Clustering** en las 6 dimensiones de la p. 248 y asignación de perfil (hub / gigante emergente / industrializador rápido / en desarrollo / OCDE / rico en recursos), con la Tabla 6.6 (p. 249) como referencia L/M/H.
- Ranking ponderado: se conserva, pero **subordinado a la matriz y con los pesos siempre visibles**, y con la advertencia del libro de que los pesos dependen de la industria (p. 228) y de la ambición (p. 248) — es decir, de lo que se decidió en M1.

### M4 — Estrategia de entrada

**4a. Por qué** — Tabla 7.1 (pp. 260–261) completa: para el objetivo elegido, la app precarga las expectativas, los KPI (crecimiento/cuota/margen para mercado; coste/calidad/acceso para recursos; know-how/mejora de proceso para aprendizaje; velocidad/control/sinergias para coordinación), el tipo de país que encaja y los modos compatibles. Se admiten objetivos múltiples con prioridad.

**4b. Cuándo** — Las cuatro fases (pp. 261–262) como estado explícito del par país×industria: *premature* / *window* / *competitive growth* / *mature*, con la evidencia que lo justifica y la restricción de modos que impone cada una (en *premature*, solo oficina de representación, listening post o acuerdo de distribución; en *mature*, adquisición o entrada directa con producto innovador). Más el checklist de first mover de la Tabla 7.2 (p. 262).

**4c. Ritmo** — Los 6 factores de la p. 262 (experiencia previa, distancia CAGE, riesgo país, recursos disponibles, dispersión de entradas simultáneas, número de recursos en juego), con la señal de alarma de Vermeulen & Barkema cuando hay varias entradas a la vez. El caso Whirlpool China 1994 (pp. 262–263) como ejemplo de la ficha de ayuda.

**4d. Cómo** — Tres instrumentos encadenados:
1. **Clasificador** (Fig. 7.1, p. 263): control × intensidad de inversión sitúa cada modo en su cuadrante.
2. **Scoring multicriterio** con los **8 criterios de la Tabla 7.4** (p. 271): inversión inicial, velocidad de entrada, penetración de mercado, control del mercado, exposición a riesgo político, fuga tecnológica, complejidad de gestión, retorno financiero potencial. Los valores del libro (High/Medium/Low por modo) se cargan como línea base editable, y el usuario pondera los ocho criterios según su caso. **Esto sustituye a las fórmulas inventadas del `engine.ts` actual y da procedencia a cada número.**
3. **Mapping** (Fig. 7.3, p. 272): atractividad de mercado × clima político de inversión, con la advertencia literal del libro de que "la decisión final es multidimensional y resiste una representación simplista 3×3" (p. 271) impresa en la propia pantalla.

**4e. Modelo digital** — Tabla 7.5 (p. 272): relacional / digital / híbrido, elegido explícitamente, no inferido de un regex.

**4f. Opción real** — p. 270. Modelar la entrada de bajo compromiso como una call: `precio de la opción = coste de la entrada exploratoria`; `valor = E[max(VAN_expandir, VAN_salir)] descontado − precio de la opción`. El usuario introduce el horizonte de decisión, los estados posibles y sus probabilidades subjetivas. La salida compara **entrar ahora a fondo** contra **comprar la opción**, que es exactamente la elección que el libro plantea y que hoy la app resuelve con una frase.

### M5 — Vía de acceso: build, borrow, buy

Este módulo no existe hoy y es el que cierra el hueco del cap. 8.

**5a. Resource gap y BBB** — Toma la lista de "C" (create) de M2 y pregunta, por cada recurso crítico, en la secuencia del módulo 8 de tu programa:
1. ¿Tenemos conocimiento, capacidades y soporte organizativo para desarrollarlo internamente? → **build**.
2. Si no: ¿está el recurso claramente definible en un contrato? → **borrow por contrato**. ¿Requiere colaboración con alcance claro y objetivos compatibles? → **borrow por alianza / JV**.
3. Si los objetivos divergen o la colaboración necesita ser más profunda → **buy**.
Más el checklist de las tres trampas (*one-trick pony*, exceso de confianza en recursos internos, necesidad dominante de control) y del síndrome *not-invented-here*, que se muestran como sesgos a declarar antes de decidir. El continuum contrato → alianza → JV → adquisición se representa como escala ordinal, con la ruta secuencial (participación minoritaria antes de adquisición total) como opción explícita.

**5b. Los cuatro encajes** — Fig. 8.3 (p. 293) para adquisición, Fig. 8.11 (p. 314) para alianza. Mismo motor, distintas preguntas:

| Encaje | Preguntas (literales del libro) | Instrumento |
|---|---|---|
| Estratégico | ¿Son compatibles los posicionamientos? ¿Consolida el posicionamiento de la entidad combinada? ¿Hay riesgo de dilución de imagen? En alianza: ¿son compatibles los objetivos, y por cuánto tiempo? | Matriz de criticidad (Fig. 8.12, p. 315) + matriz 4×4 de agendas *venturing/extractive/sharing/options* (Fig. 8.13, p. 316), que devuelve *Fit long-term* / *Fit short-term* / *Possible* / *Problematic* |
| Capacidades | ¿Están disponibles los recursos, activos y competencias críticos combinados? | Matriz 3×5 de la Fig. 8.4 (p. 294): recursos/activos/competencias × I+D, compras, producción, marketing, dirección general. La contribución de cada parte a cada celda es lo que cuantifica la sinergia |
| Cultural | ¿Son compatibles los valores? ¿Hay que emprender una revolución cultural? ¿Comparten la misma lógica de negocio? ¿Hay que anticipar un choque de la alta dirección? | Los 3 tipos de diferencia (corporativa, sectorial, nacional) × las 5 vías de impacto de la p. 295 |
| Organizativo | ¿Los mecanismos de decisión y control son propicios a buena comunicación y monitorización efectiva? | Las 5 dimensiones de las pp. 295–296: descentralización, documentación de políticas, sistemas contables y de reporting, formalización, incentivos |

Se complementa con el cuestionario de las cuatro dimensiones del módulo 11 de tu programa (strategy / resource / organisation / culture fit), que hace las mismas preguntas en un lenguaje más operativo y añade dos que el libro no formula tan directamente: *¿cuándo saldrás de la alianza?* y *¿cómo cambiarán las contribuciones de recursos con el tiempo?*

**5c. Socio** — Tipología de socio local (Tabla 8.6, pp. 333–334) con sus ventajas y desventajas precargadas; checklist de investigación del socio (p. 334: pedir información, entrevistar en profundidad a propietario, alta dirección y personal operativo, pedir datos financieros, entrevistar a sus otros socios de JV, banqueros, proveedores, clientes y competidores); y las **7 causas de fracaso** (pp. 336–337) como cuestionario de señales de alerta, con el ciclo del *death valley* (Fig. 8.17, p. 323) como modelo del estado de la relación.

**5d. Diseño** — Fig. 8.14 (p. 317): operator/broker × leverage/learning devuelve *self-contained* / *transfer platform* / *project team* / *joint committee*. Más los seis dominios de gobierno a negociar (p. 318) y el checklist de cláusulas de la Fig. 8.15 (p. 319): alcance, contribuciones, valoración, gestión y staffing, protección, resolución de conflictos.

**5e. Integración (adquisición)** — Fig. 8.7 (p. 301): interdependencias operativas requeridas × autonomía organizativa requerida → *absorción* / *simbiosis* / *preservación*, con el plan de las 8 cuestiones de la fase de transición (pp. 302–305) y la Tabla 8.2 (p. 299) como registro de riesgos de integración precargado.

**5f. Ecosistema (opcional)** — Cuando el modo elegido no es bilateral: los 5 roles del Ecosystem Canvas de tu módulo 12 (orquestador, core partners, technology enablers, complementors, resellers) con sus criterios de asignación, el eje centralizado↔adaptativo con su regla de selección según madurez de industria, y la tipología de constelaciones del libro (network / portfolio / web, Fig. 8.18, p. 326).

### M6 — Economía y decisión

**6a. Caso económico por modo.** Reemplaza el DCF único por un modelo económico distinto para cada modo, que es lo que hoy falla:

| Modo | Modelo |
|---|---|
| Greenfield | DCF actual, corregido: escudo fiscal por pérdidas, rampa de SOM configurable (lineal / curva S / manual), payback interpolado |
| Adquisición | **Stand-alone** (FCF de la adquirida sin la operación) + **sinergias** (FCF incremental por celda de la matriz Fig. 8.4) → **rango de negociación** (Fig. 8.5, p. 298). Precio, prima (el libro cita 30–100% en transfronterizas, p. 297), coste de integración, y el reparto del valor entre comprador y vendedor visible |
| JV / alianza | Valor creado *y* valor capturado por cada socio (Tabla 8.4, p. 313): dividendos + royalties + destacamento de personal + margen en productos vendidos a través de la JV + alquileres + comisiones + mejora de productividad en el negocio propio. El ejemplo numérico del Insert 8.2 (pp. 312–313) sirve de caso de prueba |
| Licencia / franquicia | Lump sum + royalty sobre ventas del licenciatario + margen en componentes obligatorios; sin capital de trabajo ni activos propios |
| Distribuidor / agente | Margen de canal sobre ventas, sin activos; con el punto de sustitución explícito (p. 269): el volumen a partir del cual la comisión supera el coste fijo de una filial propia |
| Oficina de representación | Solo coste; su valor se computa como precio de la opción real de M4f |

**6b. Sensibilidad.** Sustituir los tres escenarios fijos por un **tornado** sobre 8 palancas (precio, cuota alcanzada, retraso de rampa, margen operativo, inversión inicial, coste de capital, FX, tasa fiscal), conservando los tres escenarios como vista resumida.

**6c. Umbrales y gate.** Se conserva la política actual, con dos cambios: la condición de confianza pasa a leer el índice de exhaustividad real (§4.5), y se añaden los knock-outs de M3e como condición previa e incompensable.

**6d. Informe.** El PDF actual es sólido; hay que ampliarlo con las secciones de M1, M2 y M5, y con un **anexo de evidencias** que imprima la cadena juicio → evidencia → fuente. Añadir salida en Markdown además del PDF, para poder pegar el análisis en un documento de trabajo.

---

## 6. Modelo de datos

Sustituir los dos blobs JSON por un esquema donde el análisis sea consultable y versionable.

```
cases                 id, userId, title, decisionQuestion, companyName, homeCountry,
                      industry, subIndustry, caseYear, createdAt, updatedAt
case_documents        id, caseId, filename, mimeType, storageKey, pages, uploadedAt
evidence              id, caseId, kind, claim, sourceLabel, documentId, locator, quote,
                      url, retrievedAt, reliability, createdBy, status
analysis_blocks       id, caseId, module (M1..M6), blockKey, schemaVersion,
                      payload JSON, status (draft|complete), updatedAt
   └── una fila por marco: 'ambition.rationale', 'positioning.valueCurve',
       'country.cage', 'entry.modeScoring', 'partner.fits'...
block_evidence        blockId, fieldPath, evidenceId          (N:M juicio ↔ evidencia)
countries             code, name, region, currency, isActive   (catálogo único, hoy duplicado)
country_data          countryCode, caseId, indicatorKey, value, sourceYear, source,
                      isManual, updatedAt                      (serie, no snapshot)
entry_options         id, caseId, countryCode, mode, timingPhase, pace, economics JSON
partners              id, caseId, name, type, fits JSON, dueDiligence JSON
scenarios             id, caseId, label, snapshot JSON, createdAt   (versión inmutable)
gates                 (actual, con FK real a scenarios y cascada)
gate_milestones       (actual)
```

**Tipos compartidos.** Crear `shared/domain/` con los esquemas zod como fuente única, e inferir de ahí los tipos de servidor, de cliente y del PDF. Elimina la cuádruple duplicación actual. Los esquemas son además lo que se pasa a `invokeLLM` como `response_format: json_schema` — un solo sitio para definir la forma de cada marco, y la IA rellena exactamente esa forma.

**Versionado.** `analysis_blocks.schemaVersion` permite evolucionar un marco sin romper casos antiguos. `scenarios.snapshot` congela el estado completo en el momento de crear un gate, que es lo que hoy se intenta con la desvinculación del gate y queda a medias.

---

## 7. Contratos API nuevos

Sobre los 14 procedimientos actuales:

```
case.create / get / list / update / delete
case.uploadDocument            → URL firmada + registro
evidence.create / update / list / accept / reject
block.get / upsert             (module, blockKey, payload validado por el zod del marco)
coherence.check                (caseId) → Finding[]
completeness.get               (caseId) → cobertura por capítulo y marco

ai.extractCaseFacts            (caseId, documentId) → Evidence[] sugeridas con locator
ai.proposeBlock                (caseId, blockKey)   → payload sugerido + evidencias citadas
ai.critique                    (caseId, blockKey)   → objeciones y preguntas abiertas
ai.narrate                     (caseId, section)    → borrador de texto para el informe

entry.scoreModes               (caseId, countryCode) → scoring Tabla 7.4 con procedencia
entry.optionValue              (caseId, countryCode) → valor de la opción real
partner.assessFits             (caseId, partnerId)   → 4 encajes + veredicto de agendas
economics.evaluate             (caseId, countryCode, mode) → modelo económico del modo
```

**Reglas para la capa `ai`:**
- Toda respuesta usa `response_format: json_schema` estricto con el esquema del bloque. Nada de texto libre parseado.
- Toda afirmación extraída debe traer `locator` (página/párrafo) y `quote`. Si el modelo no puede citar, el ítem se descarta en servidor antes de llegar al cliente.
- Las sugerencias entran como `status: "suggested"`. El motor de puntuación ignora todo lo que no esté `accepted`.
- `ai.critique` es la función que más valor añade en modo caso y la más barata de implementar: recibe el bloque completo y devuelve objeciones —"has puntuado la rivalidad como baja pero el caso menciona sobrecapacidad en §3"—, no propuestas. Es un revisor, no un autor.
- `llm.ts` no tiene streaming. Para respuestas largas, o se acepta la espera bloqueante con estado de carga, o se añade streaming. Recomendación: aceptar la espera en la v2 y trocear las llamadas por bloque.

---

## 8. Plan de implementación

Seis fases. Cada una es entregable por sí sola y deja la aplicación funcionando.

### Fase 0 — Fundamentos (L)
Tipos compartidos en `shared/domain`; modelo de caso, documentos y evidencias; catálogo único de países; troceado de `Home.tsx` en un layout de módulos con ruta por módulo y persistencia de borrador; FKs y cascada; `saveScenario` con update y versionado.
*Criterio de aceptación:* un caso existente se puede migrar sin pérdida; recargar el navegador no pierde el borrador; añadir un campo nuevo toca un solo fichero.

### Fase 1 — Corregir lo que hay (M)
Los 11 defectos de §3: escudo fiscal, coherencia ROI/NPV, payback interpolado, rampa de SOM, knock-outs, confianza real, procedencia de las fórmulas de modo, modelo digital explícito, mezcla dato/opinión variable.
*Criterio:* cada número del informe puede rastrearse a una fórmula documentada o a una fuente. Ningún coeficiente sin procedencia.

### Fase 2 — Capítulo 6 completo (L)
M3 entero: taxonomía de indicadores ampliada, curva de penetración, efecto clase media, 6 fuerzas con determinantes, country diamond, incentivos, CAGE de 21 dimensiones, riesgo de 23 componentes con coeficiente de variación, clustering y matriz oportunidades × riesgos.
*Criterio:* el mini-caso 6.2 (Izmir Industrial Electric, pp. 249–251, con sus cinco países africanos) se puede resolver de principio a fin dentro de la herramienta.

### Fase 3 — Capítulo 5 (L)
M1 y M2: ambición, GRI/GCI con la Tabla 5.2 como semilla, roles de país, 8 posicionamientos, value curve con ERRC, configuración de cadena de valor, T-A-C, ventajas y sostenibilidad.
*Criterio:* el *learning assignment* 1 del cap. 5 (Air Liquide, p. 220) da un resultado defendible; el mini-caso 5.2 (Essilor) se puede modelar.

### Fase 4 — Capítulo 7 y 8 (XL)
M4 completo (fases de ventana, ritmo, Tabla 7.4, mapping, opción real) y M5 completo (BBB, cuatro encajes, socio, diseño, integración, ecosistema), más los modelos económicos por modo de M6a.
*Criterio:* el mini-caso 7.3 (Lubricador SA, pp. 275–276, con sus cuatro alternativas: greenfield, compra del competidor, JV 50/50 y licencia, WACC 15%) se resuelve dentro de la herramienta y los cuatro modos dan cifras distintas y defendibles. Este es el mejor test de aceptación de toda la v2.

### Fase 5 — Copiloto de caso (L)
Ingesta de PDF, `ai.extractCaseFacts`, `ai.proposeBlock`, `ai.critique`, flujo de aceptación de sugerencias, anexo de evidencias en el informe.
*Criterio:* se sube un caso de 15 páginas y la herramienta propone la ficha de empresa y al menos 20 evidencias con cita literal y localizador, ninguna sin cita.

### Fase 6 — Coherencia y modo docente (M)
Motor de coherencia con las 13 reglas, índice de exhaustividad, *learning assignments* como autocomprobación, informe ampliado y salida Markdown.
*Criterio:* un análisis deliberadamente contradictorio (ambición de global player + solo mercados marginales + licencia con IP crítica) dispara al menos tres avisos con su referencia de página.

**Orden recomendado si hay que priorizar:** 0 → 1 → 2 → 5 → 4 → 3 → 6. Adelantar la fase 5 sobre la 4 y la 3 te da antes lo que hoy te falta —poder trabajar un caso— aunque los módulos que rellena sean todavía los de los caps. 6 y 7.

---

## 9. Lo que necesita tu criterio

Cinco decisiones que no puedo tomar por ti y que condicionan el diseño:

1. **Fórmula de GRI/GCI.** El libro remite al apéndice online. Si tienes acceso al material complementario de Bloomsbury, la fórmula oficial es preferible a mi propuesta. Si no, hay que fijar y documentar una convención propia — y asumir que los números no serán comparables con los de la bibliografía.

2. **Hoja BBB Spider.** Tienes `BBB Spider Spreadsheet_RRA.xlsx` y `Interpreting Your Company's Position on the Spider Diagram.pdf` en tu carpeta del programa. El cuestionario puntuado 1–15 sobre los tres ejes es la pieza que convierte el módulo 5a en un instrumento medible en lugar de un árbol de decisión cualitativo. ¿Lo incorporamos? Si es material propietario del programa, mejor reformularlo con preguntas propias.

3. **Alcance de la sustitución.** El motor actual de puntuación (`engine.ts`) tiene fórmulas que no proceden del libro. ¿Las sustituimos por el scoring explícito de la Tabla 7.4 —más defendible, menos automático— o las conservamos como una segunda opinión etiquetada como heurística propia?

4. **Ambición del modo caso.** ¿Casos publicados (Harvard/INSEAD, texto que la IA puede leer entero) o también casos reales de empresa con documentación confidencial? Lo segundo cambia el diseño de retención de datos y probablemente exige no enviar el documento completo al LLM.

5. **Multiusuario.** Hoy todo es por usuario, sin equipos ni compartición. Si esto va a ser una pieza de tu posicionamiento como CSO —y los ficheros de tu carpeta sugieren que sí—, conviene decidir ahora si habrá casos compartidos y comentarios, porque afecta al esquema.

---

## 10. Anexo: mapa marco → módulo → referencia

| Marco | Módulo v2 | Referencia |
|---|---|---|
| Framework de estrategia global (4 bloques) | M1+M2 | Fig. 5.3, p. 181 |
| Rationale de globalización | M1 | p. 181 |
| Cinco roles de ambición | M1 | pp. 181–182, 217 |
| TNI / GRI / GCI y mapping | M1 | pp. 184–186, Fig. 5.5 |
| Distribución regional de demanda por industria | M1 | Tabla 5.2, p. 183 |
| Cinco roles de país | M1 | pp. 187–188 |
| Propuesta de valor en 3 dimensiones | M2 | Fig. 5.8, p. 189 |
| Ocho posicionamientos globales | M2 | Tabla 5.4, p. 190 |
| Value curve / ERRC / buyer utility map | M2 | Fig. 5.9, p. 189 + módulo 10 INSEAD |
| Cadena de valor genérica | M2 | Fig. 5.10, p. 191 |
| Distribución global/regional/local | M2 | Fig. 5.12, p. 193 |
| Capacidades → ventaja competitiva | M2 | Tabla 5.5, p. 194 |
| Sostenibilidad de la ventaja (4 vías) | M2 | Tabla 5.7, p. 197 |
| Transfer–Adapt–Create | M2→M5 | Fig. 5.14, p. 199 |
| Liability of foreignness | M2 | p. 198 |
| Etapas y diseño organizativo | M1 | Tabla 5.8, pp. 200–202 |
| Cascada de decisión de entrada | Flujo global | Fig. 6.1, p. 226 |
| Matriz oportunidades × riesgos | M3f | Fig. 6.2, p. 227 |
| Marco de atractividad (mercado/recursos/industria) | M3 | Fig. 6.3, p. 229 |
| Indicadores macro | M3a | Tabla 6.1, p. 231 |
| Curvas de penetración | M3a | Figs. 6.4–6.5, p. 230 |
| Efecto clase media | M3a | Fig. 6.6, p. 232 |
| Segmentaciones de mercado | M3a | Fig. 6.8, p. 233 |
| Clusters de ciclo de vida | M3a | Tabla 6.2, p. 234 |
| Skills × pay-and-productivity | M3b | Fig. 6.10, p. 236 |
| Calidad de infraestructuras | M3b | Tabla 6.3, pp. 237–238 |
| Cinco fuerzas + gobierno | M3c | Tabla 6.4, pp. 238–239 |
| Country diamond | M3c | p. 239 |
| Incentivos a la inversión | M3c | Tabla 6.5, pp. 241–242 |
| CAGE (21 dimensiones) | M3d | Fig. 6.11, p. 243 |
| Riesgo país (23 componentes) | M3e | Fig. 6.12, p. 244 |
| Variabilidad económica | M3e | Fig. 6.13, p. 245 |
| Clustering y perfiles | M3f | Tabla 6.6, p. 249 |
| Objetivos de entrada | M4a | Tabla 7.1, pp. 260–261 |
| Cuatro fases de ventana | M4b | pp. 261–262 |
| First mover | M4b | Tabla 7.2, p. 262 |
| Pace of entry | M4c | p. 262 |
| Clasificador de modos | M4d | Fig. 7.1, p. 263 |
| Factores que influyen en el modo | M4d | Fig. 7.2, p. 264 |
| Comparación de modos (8 criterios) | M4d | Tabla 7.4, p. 271 |
| Mapping de elección de modo | M4d | Fig. 7.3, p. 272 |
| Modelos de entrada digital | M4e | Tabla 7.5, p. 272 |
| Opción real | M4f | p. 270 |
| Build-Borrow-Buy | M5a | Módulo 8 INSEAD + p. 284 |
| Motivos de M&A | M5 | p. 291, Tabla 8.1, p. 292 |
| Proceso de M&A | M5 | Fig. 8.2, p. 290 |
| Cuatro encajes (M&A) | M5b | Fig. 8.3, p. 293 |
| Matriz de capacidades 3×5 | M5b | Fig. 8.4, p. 294 |
| Diferencias culturales (3 tipos, 5 impactos) | M5b | pp. 294–295 |
| Due diligence y ajustes contables | M5c | p. 296 |
| Valoración y rango de negociación | M6a | Fig. 8.5, p. 298 |
| Fallos de integración | M5e | Tabla 8.2, p. 299 |
| Modos de integración contingentes | M5e | Fig. 8.7, p. 301 |
| Fase de transición (8 cuestiones) | M5e | pp. 302–305 |
| Tipología de alianzas | M5 | Fig. 8.8, p. 308 |
| Objetivos por tipo de alianza | M5 | Tabla 8.3, p. 311 |
| Valor creado y capturado | M6a | Fig. 8.10, p. 312; Tabla 8.4, p. 313 |
| Cuatro encajes (alianza) | M5b | Fig. 8.11, p. 314 |
| Criticidad de la alianza | M5b | Fig. 8.12, p. 315 |
| Matriz 4×4 de agendas | M5b | Fig. 8.13, p. 316 |
| Diseño organizativo de alianza | M5d | Fig. 8.14, p. 317 |
| Cláusulas del acuerdo de JV | M5d | Fig. 8.15, p. 319 |
| Competencias de gestión de alianzas | M5d | Fig. 8.16, p. 321 |
| Death valley | M5c | Fig. 8.17, p. 323 |
| Receptividad al aprendizaje | M5d | Tabla 8.5, p. 326 |
| Constelaciones | M5f | Fig. 8.18, p. 326 |
| Ecosistemas industriales | M5f | Figs. 8.22–8.24, pp. 331–332 |
| Tipos de socio local | M5c | Tabla 8.6, pp. 333–334 |
| Causas de fracaso de JV | M5c | pp. 336–337 |
| Ecosystem canvas y roles | M5f | Módulo 12 INSEAD |
| Cuatro dimensiones de partnership fit | M5b | Módulo 11 INSEAD |
| Vectores de crecimiento y parenting | M1 | Módulo 7 INSEAD |
| Preguntas de análisis estratégico | Transversal | Módulo 16 INSEAD |

---

> **Corrección posterior a la implementación.** Al codificar los marcos se contaron los ítems uno a uno: la Fig. 6.11 tiene **21** dimensiones CAGE (5 culturales, 5 administrativas, 4 geográficas, 7 económicas) y la Fig. 6.12 tiene **23** componentes de riesgo, no las 22 y 14 que decía el primer borrador. El total del capítulo 6 implementado es de **71 ítems** más 29 instrumentos de incentivo.

*Documento preparado para revisión previa a la implementación. Todas las referencias de página corresponden a la 5ª edición (Bloomsbury Academic, 2023). Las referencias de código corresponden al estado del repositorio el 10 de septiembre de 2026.*
