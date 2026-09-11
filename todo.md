# Estado del proyecto

## Funcionalidades completadas

- [x] Metodología de entrada internacional basada en los capítulos 5–8 de *Global Strategic Management*.
- [x] Evaluación de atractividad, riesgo, distancia CAGE, timing y modos de entrada.
- [x] Datos públicos de World Bank, UNCTAD/WDI y WGI.
- [x] TAM, SAM, SOM, ROI, NPV, recuperación, impuestos, capital de trabajo, FX y valor terminal.
- [x] Umbrales configurables para Avanzar, Probar, Descartar o Completar evidencia.
- [x] Comparación lado a lado y exportación PDF detallada.
- [x] Escenarios base, optimista y conservador para precio/ingreso, margen y FX.
- [x] Integración de Tax Foundation y Frankfurter, con edición manual preservada.
- [x] Gates de aprobación con responsables, fechas de revisión e hitos persistentes.
- [x] Guía visible de primera evaluación que explica que Enter no confirma ni calcula.
- [x] Carga automática y progresiva de indicadores al añadir mercados, sin bloquear la tabla por WGI.
- [x] Tabla de Mercados con impuesto corporativo, FX, fecha de última actualización, edición manual y restauración selectiva.
- [x] Reintento específico de WGI por país, sin volver a consultar los demás indicadores.
- [x] Cola de cargas, reintentos automáticos y límite de concurrencia para evitar saturación al añadir varios países.

## Verificación completada

- [x] Migración de las tablas de gates aplicada a la base de datos.
- [x] Validación en vivo de la tasa corporativa mexicana y MXN/USD.
- [x] Suite Vitest, comprobación TypeScript, compilación de producción y revisión visual del PDF.
- [x] Pruebas de carga rápida de datos públicos, trazabilidad de actualización, TypeScript y compilación tras la ampliación de Mercados.

## Fase 1 del blueprint v2 — motor y procedencia (completada)

- [x] Escudo fiscal por arrastre de bases imponibles negativas.
- [x] Dos bases de ROI declaradas (`roiBasis`), coherentes con el NPV.
- [x] Recuperación interpolada dentro del año de cruce.
- [x] Rampa de cuota lineal, en curva en S o definida año a año.
- [x] Modelos económicos por modo: operador, royalty, canal y solo coste.
- [x] Tornado de ocho palancas ordenadas por amplitud de NPV.
- [x] Cobertura de evidencia real, sobre justificaciones escritas y antigüedad del dato, en lugar de deslizadores movidos.
- [x] Criterios eliminatorios no compensatorios de riesgo, distancia y evidencia.
- [x] Peso variable del dato de gobernanza según antigüedad y completitud, en lugar de un 0,35 fijo.
- [x] Modelo de entrega declarado (relacional, digital o híbrido) en lugar de una expresión regular sobre texto libre.
- [x] Puntuación de modos con la Tabla 7.4 del libro y procedencia por criterio.
- [x] Catálogo único de países en `shared/domain`, antes duplicado en cliente y servidor.
- [x] Campo de justificación por factor en la pestaña de Calibración.

### Cambio de comportamiento a tener en cuenta

Los escenarios guardados antes de esta fase no llevan justificaciones por factor, de modo que su cobertura de evidencia cae y la política devolverá **Completar evidencia** hasta que se documenten los juicios. Es el resultado buscado: la cifra anterior de confianza no medía evidencia.

## Fase 2 del blueprint v2 — capítulo 6 completo (completada)

- [x] Marcos del capítulo 6 como datos: 71 ítems con ancla baja y alta declaradas, más 29 instrumentos de incentivo y 5 cuestiones ambientales y sociales.
- [x] 21 dimensiones CAGE y 23 componentes de riesgo, con la separación del libro entre exposición del accionista, del empleado y de la operación.
- [x] Seis fuerzas con los determinantes propios de una entrada internacional, y diamante del país.
- [x] Derivación de la calibración desde la evaluación, conservando los cuatro factores que describen a la empresa.
- [x] Indicadores públicos ampliados a las cuatro familias de la Tabla 6.1 y serie de crecimiento para el coeficiente de variación.
- [x] Curva de penetración con tres formas y residuo por país; efecto clase media sobre distribución lognormal calibrada por Gini.
- [x] Perfil estratégico de país por comparación con la Tabla 6.6 y matriz oportunidades × riesgos con umbrales parametrizables.
- [x] Panel de evaluación detallada generado desde los marcos, con justificación por ítem.
- [x] Criterio de aceptación: el mini-caso 6.2 del libro (Izmir Industrial Electric) se resuelve dentro de la herramienta con las cifras de la Tabla 6.7.

### Corrección de recuento

El blueprint decía 22 dimensiones CAGE y 14 componentes de riesgo. Contados uno a uno sobre las figuras 6.11 y 6.12, son **21** y **23**. Corregido en el documento.

## Fase 5 del blueprint v2 — copiloto de caso (completada)

- [x] Modelo de caso: `strategyCases`, `strategyCaseDocuments` y `strategyEvidence`, más `caseId` en `strategyScenarios`. Migración aditiva `0003`.
- [x] Documentos por texto pegado o subida de PDF a almacenamiento, con URL firmada para el modelo.
- [x] Extracción de evidencias con cita literal y localizador obligatorios, verificación de la cita contra el texto de origen y degradación de fiabilidad cuando no se puede verificar.
- [x] Propuesta de puntuación por bloque del capítulo 6, con descarte de ítems ajenos, sin justificación o sin cita comprobable.
- [x] Revisor crítico que devuelve objeciones sobre las puntuaciones ya introducidas.
- [x] Libro de evidencias en la interfaz con aceptar, rechazar y eliminar; lo propuesto por IA se ve como propuesta.
- [x] Aplicación de propuestas una a una desde el panel de evaluación, arrastrando la cita a la justificación del ítem.

### Antes de desplegar

Ejecute la migración: `pnpm drizzle-kit migrate`. Es aditiva y no altera datos existentes.
El copiloto requiere `BUILT_IN_FORGE_API_KEY` y `BUILT_IN_FORGE_API_URL` en el entorno; sin
ellas la pestaña de caso funciona para cargar documentos y registrar evidencias a mano, pero
los botones de IA devuelven error.

## Migración fuera de la plataforma (completada)

- [x] Retirados seis servicios de plataforma sin ningún importador, más el showcase de componentes y el diálogo de plataforma: unas 1.400 líneas.
- [x] Autenticación propia con Google OAuth, lista blanca de correos y sesión firmada con `JWT_SECRET`. Sin lista blanca no entra nadie.
- [x] Almacenamiento en S3 o compatible con el SDK de AWS, que ya era dependencia del proyecto. Los ficheros exigen sesión y se sirven por URL firmada de quince minutos.
- [x] Cliente de modelo apuntando a cualquier API compatible con OpenAI mediante `LLM_BASE_URL`, `LLM_API_KEY` y `LLM_MODEL`.
- [x] Endpoint de refresco programado protegido por secreto compartido en cabecera.
- [x] Retirados el plugin de compilación, el recolector de logs y el script de analítica de la plataforma.
- [x] `Dockerfile`, `.env.example` y guía de despliegue en `docs/DESPLIEGUE.md`.
- [x] Extracción de texto de PDF en el servidor, que hace verificables las citas también en documentos subidos.

### Base de datos en PostgreSQL

- [x] Esquema y consultas portados de MySQL a PostgreSQL: `drizzle/schema.ts` sobre `pg-core`, cliente `postgres.js` con `prepare: false`, `onConflictDoUpdate` y `returning` en lugar de `insertId`.
- [x] Las cuatro migraciones de MySQL sustituidas por una inicial de PostgreSQL, idempotente, más una segunda que cierra el acceso público.
- [x] Índices por `userId`, `caseId` y `approvalId`, y unicidad de país por escenario en las puertas de decisión, que antes solo comprobaba el código.
- [x] Tablas creadas en Supabase en un esquema propio, `entry_strategy`, sin permisos para los roles `anon` y `authenticated` y con RLS activo sin políticas.

### Antes de desplegar

Credenciales de Google con el URI de redirección exacto, `DATABASE_URL` con la cadena del
pooler de sesión de Supabase, `JWT_SECRET` de al menos 32 caracteres y `ALLOWED_EMAILS`. El
copiloto necesita además `LLM_API_KEY` y `LLM_MODEL`, y los PDF de casos un bucket S3 o
compatible. Las migraciones ya están aplicadas: no hay que ejecutar nada contra la base.

### Fase 3 — capítulo 5 completo

- [x] M1: motivos de globalización (p. 181), roles globales (pp. 181-182), etapas (p. 219) y diseño organizativo de la Tabla 5.8.
- [x] Tabla 5.2 (p. 183) cargada como semilla editable, con traslación automática entre el reparto de cuatro regiones y el de tres del learning assignment.
- [x] GRI y GCI con convención propia declarada en pantalla, más el mapa de ambición de la Fig. 5.5 y la brecha entre rol declarado, rol observado y rol objetivo.
- [x] Roles de país de las pp. 187-188 con criterio justificado.
- [x] M2: los ocho posicionamientos de la Tabla 5.4, curva de valor con rejilla ERRC deducida de las dos curvas, matriz 6×3 de configuración de la cadena de valor (Fig. 5.12), Transfer-Adapt-Create (Fig. 5.14) con la brecha de recursos que abre el módulo 5, tipología de capacidades (Tabla 5.5) y vías de sostenibilidad (Tabla 5.7).
- [x] Liability of foreignness como campo bloqueante en los dos módulos (p. 198).
- [x] Test de aceptación: el learning assignment 1 del capítulo 5 (Air Liquide, p. 220) da GRI 0,953 y GCI 0,785, y lo sitúa como jugador global.

**Pendiente de tu criterio:** la fórmula oficial de GRI/GCI del Online Appendix 5.1. Mientras no esté,
la herramienta usa el índice de solapamiento y lo dice en pantalla. El selector de convención está
preparado en el motor: añadir la oficial es una entrada más en `CONVENTIONS`.

### Archivo de escenarios

- [x] Abrir un escenario guardado y rehidratar el formulario entero: perfil, países, calibración con sus justificaciones, evaluación del capítulo 6, datos de mercado, caso económico, umbrales y pesos.
- [x] Actualizar el escenario abierto, que reevalúa en el servidor para que no queden supuestos nuevos con conclusiones viejas, y «Guardar como nuevo» para bifurcar.
- [x] Duplicar, renombrar, borrar y buscar. Al borrar se van con él sus puertas de decisión y los hitos; al duplicar no se heredan, porque se aprobaron sobre los supuestos del original.
- [x] El escenario queda vinculado al caso activo mediante `caseId`, que existía en la base desde la Fase 5 y no se usaba.

### Fase 4a — capítulo 7, primera parte

- [x] Objetivos de entrada de la Tabla 7.1 con sus expectativas, indicadores, momento, tipo de país y modos típicos.
- [x] Las cuatro fases de la ventana (pp. 261-262) con los modos que el libro considera apropiados en cada una, y la Tabla 7.2 de primer entrante.
- [x] Ritmo de entrada: los seis factores de la p. 262 sintetizados en un índice que se presenta como síntesis propia, no como fórmula del libro.
- [x] Elección de modo con el mapa de la Fig. 7.3 y la rejilla de la Fig. 7.1, sobre los perfiles de la Tabla 7.4 que ya existían desde la Fase 1. Modelos de entrada digital de la Tabla 7.5.
- [x] Seis reglas de coherencia: modo fuera de fase, inversión fuerte en fase prematura, primer entrante cuando la ventana ya se cerró, primer entrante sin justificar, ritmo gradual contra modo de compromiso alto y modo fuera del mapa.

### Fase 4b — opción real, socio y build-borrow-buy

- [x] La entrada como opción real (p. 270): prima, periodo de observación, señales con umbral verificable y las dos salidas, ampliar o replegarse.
- [x] Árbol build-borrow-buy con preguntas propias sobre el marco de Capron y Mitchell. Responde en orden y se detiene en la pregunta que decide; no promedia. Señala cuando la vía elegida no es la del árbol.
- [x] Las cuatro pruebas de encaje (p. 278) sin compensación entre ellas: la media se muestra, pero lo que decide es el encaje más débil.
- [x] Los seis tipos de socio local de la Tabla 7.3 con lo que se busca en cada uno y lo que hay que vigilar, más las cinco categorías de la p. 278.
- [x] La lista de capacidades «crear» del Transfer-Adapt-Create se importa como entrada del módulo con un botón.
- [x] Test de aceptación: el mini-caso 7.3 (Lubricador SA) resuelve sus cuatro alternativas dentro de la herramienta y da cifras distintas, con el patrón que describe la p. 270.

**Incoherencia del enunciado, documentada en el propio test:** el mini-caso da costes
administrativos de «1.200 millones de yuanes» contra un mercado de 175 millones. El fixture
fija margen y coste anual como supuesto propio y lo dice, en lugar de reconstruir una
función de costes que el caso no determina.

### Ruta guiada

- [x] Doce pasos en el orden del libro, encima de las pestañas, que responden en todo momento a «¿qué hago ahora?».
- [x] Cada paso dice qué se decide, por qué importa, un ejemplo del propio libro con su página y qué distingue una respuesta buena de una vacía.
- [x] El progreso se calcula en vivo a partir del estado de los módulos y del formulario, no del último guardado.
- [x] No bloquea: se puede trabajar fuera de orden y la ruta refleja lo que queda pendiente en lugar de impedirlo.

## Fases siguientes del blueprint v2
### Fase 6 — coherencia entre módulos

- [x] Trece reglas cruzadas, cada una con la página del libro de la que sale la incompatibilidad. No repiten lo que ya vigila cada módulo por su cuenta.
- [x] Índice de exhaustividad ponderado: ambición 20, posicionamiento 25, entrada 30, vía y socio 25.
- [x] Un módulo sin empezar cuenta cero. Varias comprobaciones son condicionales y en un módulo vacío se dan por satisfechas; contarlas mostraba un 13% hecho sobre un análisis sin tocar.
- [x] Los bloqueantes se listan aparte, y desde cada contradicción se salta al módulo que la provoca.

- [ ] Informe ampliado en PDF con la sección de coherencia. Pendiente.
### Bilingüe — entrega 1 de 4

- [x] Infraestructura: tipo `Localized` con los dos idiomas juntos, conmutador que recuerda la elección en el navegador y toma la del sistema la primera vez.
- [x] La ruta guiada entera en los dos idiomas: doce pasos con su decisión, su porqué, su ejemplo del libro y sus criterios de calidad.
- [x] Etiquetas de las nueve pestañas de navegación.
- [x] Pruebas que comprueban que no hay huecos en ningún idioma y que el inglés no es la cadena española repetida.

- [ ] Entrega 2: dominio compartido, las tablas del libro y las etiquetas de los marcos (~590 cadenas).
- [ ] Entrega 3: motores, avisos de coherencia y criterios (~310 cadenas).
- [ ] Entrega 4: copiloto de caso en el idioma elegido, e informe PDF.

## Consideraciones para la siguiente evolución

La actualización programada de escenarios guardados debe configurarse únicamente después de publicar la aplicación y fijar una frecuencia de actualización. El catálogo de moneda ISO 4217 debe ampliarse antes de habilitar mercados que no estén incluidos actualmente. Las fuentes sectoriales o de pago y la licencia del repositorio requieren decisiones del propietario y están fuera de la presente entrega.

## Incidencias conocidas

Resuelta: el paquete de producción arrastraba `vite` porque `serveStatic` y `setupVite`
compartían fichero. La imagen solo instala dependencias de producción, así que el proceso
moría al arrancar con `Cannot find package 'vite'`. `serveStatic` vive ahora en
`server/_core/static.ts` y el servidor de desarrollo se carga con un import dinámico que
esbuild deja fuera del paquete.

No hay incidencias bloqueantes abiertas. La generación PDF muestra advertencias internas de ajuste de ancho en algunas tablas de jsPDF, pero la revisión de la muestra renderizada confirmó que las columnas y el contenido quedan dentro del área de página.
