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

## Fases siguientes del blueprint v2

- [ ] Fase 2 — capítulo 6 completo: indicadores ampliados, curvas de penetración, efecto clase media, seis fuerzas con determinantes, incentivos, CAGE de 22 dimensiones, riesgo de 14 componentes, clusters y matriz oportunidades × riesgos.
- [ ] Fase 3 — capítulo 5: ambición global, GRI/GCI, roles de país, posicionamiento, cadena de valor y Transfer-Adapt-Create.
- [ ] Fase 4 — capítulos 7 y 8: fases de ventana, ritmo, opción real, build-borrow-buy, cuatro encajes, socio, integración y modelos económicos de adquisición y JV.
- [ ] Fase 5 — copiloto de caso: ingesta de PDF, extracción con cita, libro de evidencias.
- [ ] Fase 6 — motor de coherencia, índice de exhaustividad e informe ampliado.

## Consideraciones para la siguiente evolución

La actualización programada de escenarios guardados debe configurarse únicamente después de publicar la aplicación y fijar una frecuencia de actualización. El catálogo de moneda ISO 4217 debe ampliarse antes de habilitar mercados que no estén incluidos actualmente. Las fuentes sectoriales o de pago y la licencia del repositorio requieren decisiones del propietario y están fuera de la presente entrega.

## Incidencias conocidas

No hay incidencias bloqueantes abiertas. La generación PDF muestra advertencias internas de ajuste de ancho en algunas tablas de jsPDF, pero la revisión de la muestra renderizada confirmó que las columnas y el contenido quedan dentro del área de página.
