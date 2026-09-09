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

## Consideraciones para la siguiente evolución

La actualización programada de escenarios guardados debe configurarse únicamente después de publicar la aplicación y fijar una frecuencia de actualización. El catálogo de moneda ISO 4217 debe ampliarse antes de habilitar mercados que no estén incluidos actualmente. Las fuentes sectoriales o de pago y la licencia del repositorio requieren decisiones del propietario y están fuera de la presente entrega.

## Incidencias conocidas

No hay incidencias bloqueantes abiertas. La generación PDF muestra advertencias internas de ajuste de ancho en algunas tablas de jsPDF, pero la revisión de la muestra renderizada confirmó que las columnas y el contenido quedan dentro del área de página.
