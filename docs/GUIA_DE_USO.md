# Guía de primera evaluación

## Principio de funcionamiento

Global Entry Strategy Studio trabaja con un **borrador activo**. Cada vez que se edita un campo, el valor queda incorporado al borrador local de la pantalla. Por tanto, **no hay que pulsar Enter** para confirmar un formulario y Enter no ejecuta ningún cálculo. Las acciones que producen un resultado están identificadas por botones: **Actualizar mercado y fiscal**, **Generar evaluación**, **Guardar**, **PDF** y **Crear gate**.

El modelo está diseñado para estructurar el juicio de entrada internacional, no para convertir datos públicos en una decisión automática. Las señales de Avanzar, Probar o Descartar sirven para priorizar trabajo de validación y gobierno. No autorizan gasto, la constitución de una sociedad, una adquisición ni una transacción financiera.

## Secuencia recomendada

| Fase | Acción del usuario | Qué hace la herramienta | Resultado esperado |
|---|---|---|---|
| 1. Mandato | Introducir empresa, país base, industria, modelo de negocio, objetivo y horizonte. | Conserva el contexto que da significado a todas las puntuaciones posteriores. | Un mandato definido y visible en el caso. |
| 2. Mercados | Añadir países y, si desea volver a consultar todos, pulsar **Actualizar mercado y fiscal**. | Al añadir un país descarga automáticamente macrodatos, IED, tasa corporativa estatutaria y tipo de cambio; WGI se completa en segundo plano. | Una base factual comparable; los campos sin datos permanecen vacíos. |
| 3. Calibración | Elegir cada país y ajustar factores cualitativos de 0 a 100. | Traduce la evidencia local y el juicio de dirección en atractividad, riesgo y encaje. | Supuestos estratégicos explícitos por país. |
| 4. Economía | Completar TAM/SAM/SOM, costes, inversiones, capital de trabajo, descuento y perfiles de entrada. | Calcula flujo libre, ROI, NPV, recuperación y valor terminal de cada alternativa. | Una evaluación económica por alternativa. |
| 5. Escenarios | Definir las variaciones optimista y conservadora. | Recalcula el efecto de precio/ingreso, margen y tipo de cambio. | La sensibilidad de ROI y NPV alrededor del caso base. |
| 6. Comparar y decidir | Seleccionar hasta cuatro países, revisar resultados y pulsar **Generar evaluación**. | Ordena los países por riesgo ajustado y aplica los umbrales de inversión. | Una lectura comparativa y una señal de Avanzar, Probar, Descartar o Completar evidencia. |
| 7. Gates | Guardar el escenario y, si la señal es Probar o Avanzar, crear un gate. | Registra responsables, fecha de revisión e hitos editables. | Un flujo de trabajo de decisión trazable. |

## Cómo actualizar las fuentes públicas

En la fase **Mercados**, los indicadores macroeconómicos, la IED de UNCTAD distribuida a través de World Bank, la tasa corporativa estatutaria de Tax Foundation y el tipo de cambio de referencia de Frankfurter se solicitan automáticamente al añadir cada país. No es necesario pulsar Enter ni guardar primero. El botón **Actualizar mercado y fiscal** permite volver a consultar todos los candidatos del borrador cuando quiera. La aplicación confirma cuántos perfiles macroeconómicos, tasas fiscales y pares de divisa están disponibles.

Los indicadores de gobernanza WGI se descargan en segundo plano porque el archivo oficial es más pesado. La tabla muestra **Cargando** en la columna WGI hasta que llegue la respuesta. Los demás indicadores se deben ver antes, sin esperar a WGI.

La actualización no sustituye campos que usted haya editado deliberadamente como manuales para impuesto o FX. En la fase Economía, una etiqueta **Público** identifica la cifra descargada y una etiqueta **Manual** identifica una cifra sobrescrita. Las fuentes, la fecha y sus límites se muestran bajo cada campo.

## Cómo leer los escenarios

El caso **Base** corresponde exactamente a sus supuestos económicos. El caso **Optimista** y el **Conservador** requieren tres valores: cambio porcentual de precio/ingreso, cambio del margen operativo en puntos porcentuales y cambio porcentual del tipo de cambio a moneda de reporte. Por ejemplo, una mejora de margen de `3` significa pasar de un margen base de 20% a 23%; no significa incrementar el margen un 3% relativo.

Para cada caso, la herramienta vuelve a calcular los flujos libres y todas las métricas por modo de entrada. Si falta una de las tres sensibilidades, ese escenario aparece como “Completar sensibilidades” y no genera una estimación artificial. Si la moneda local y la moneda de reporte son iguales, una variación de FX no modifica el resultado; la interfaz lo declara explícitamente.

## Cómo usar los gates de aprobación

Después de guardar el escenario, vaya a **7. Gates**. Elija un mercado cuya señal sea Probar o Avanzar, asigne un responsable, un revisor opcional y una fecha de revisión. La herramienta crea cuatro hitos que se pueden completar o dejar pendientes. Los hitos propuestos cambian según se trate de un avance o de una prueba reversible.

Si se modifica el mandato, mercados, calibración, datos, economía o umbrales después de guardar, la asociación del gate se elimina de la vista activa. Esto evita que un gate corresponda por error a un conjunto de supuestos diferente. Guarde de nuevo el escenario antes de crear un nuevo gate.

## Exportar el informe

Una vez generada la evaluación, el botón **PDF** produce un archivo local en el navegador. Incluye el mandato, la comparación, umbrales, supuestos financieros, alternativas, flujo de caja anual, escenarios, fuentes, alertas y límites del modelo. El botón no envía el PDF a terceros ni lo publica.

## Límites que deben revisarse antes de decidir

La tasa fiscal pública es una tasa corporativa estatutaria general; no incorpora incentivos, pérdidas fiscales, tratados, retenciones, estructura societaria ni asesoramiento local. El tipo de cambio es una referencia de bancos centrales y no garantiza un tipo ejecutable, una previsión o una cobertura. TAM, SAM, SOM, precio, margen, capital de trabajo, coste de entrada y coste de operación son supuestos de la empresa y deben sustentarse con investigación sectorial y evidencia local. Para una decisión real, complemente el resultado con revisión legal, fiscal, regulatoria, comercial, operativa y de socios.
