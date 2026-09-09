# Registro de validación

## Validación visual inicial

La captura de escritorio de la interfaz principal muestra el flujo de cuatro fases, la navegación lateral, el formulario de mandato y el marco metodológico sin solapamientos ni cortes visibles. La jerarquía visual diferencia correctamente el mandato, las advertencias metodológicas y la navegación entre fases. La versión de acceso no autenticado se muestra como una pantalla de inicio de sesión controlada, coherente con el carácter personal de la aplicación.

## Validación funcional y técnica

El 9 de septiembre de 2026 se ejecutaron las pruebas Vitest del proyecto y la comprobación TypeScript. El resultado fue satisfactorio: tres pruebas pasaron, incluyendo dos pruebas del motor estratégico y la prueba preexistente de cierre de sesión; TypeScript no devolvió errores. También se verificó una respuesta válida del endpoint público de World Bank para Alemania y el indicador de PIB corriente.

## Límites de la validación en vista previa

La sesión de navegador de validación no contiene una sesión OAuth de usuario, por lo que el flujo autenticado no se pudo recorrer directamente en el navegador compartido. La captura gestionada del entorno de desarrollo confirma el renderizado del espacio autenticado, y las rutas de datos y evaluación están cubiertas por el chequeo de compilación y las pruebas unitarias del motor. El usuario final debe iniciar sesión para actualizar datos, guardar escenarios y acceder a la interfaz de trabajo.

## Ampliación de economía, fuentes y comparación

La ampliación incorpora entradas separadas por país para TAM, SAM, SOM, margen operativo, tasa de descuento e inversión, coste y captura de ingresos por modo de entrada. Se validaron las fórmulas de TAM/SAM/SOM, ROI simple, NPV y recuperación con dos pruebas unitarias: los valores completos producen métricas reproducibles y los datos faltantes devuelven el estado `insufficient_data` sin sustituirlos por cero. El total de pruebas ha quedado en cinco, todas satisfactorias; TypeScript y la compilación de producción también finalizaron sin errores.

Los conectores externos se probaron contra datos actuales de Alemania. La descarga oficial WGI 2025 devolvió puntuaciones completas de los cinco componentes utilizados y año de observación 2024. La serie de IED originada en UNCTAD, distribuida por World Bank Open Data, devolvió flujo neto entrante y flujo sobre PIB con disponibilidad completa y año de observación 2025. El conector WGI mantiene una caché de 24 horas y bloquea descargas duplicadas concurrentes para limitar carga y consumo de memoria.

## Ampliación del caso de inversión y del informe PDF

El motor financiero se amplió con impuestos, variación de capital de trabajo, conversión de moneda y valor terminal por perpetuidad. Las fórmulas se implementan como `FCF = EBIT − impuestos − Δcapital de trabajo` y `TV = FCF(n+1) / (r − g)`. La alternativa se marca como no significativa si la tasa de descuento no supera el crecimiento terminal. El ROI se calcula sobre el flujo libre acumulado y excluye el valor terminal, mientras que el NPV incorpora ambos componentes.

Se añadieron siete pruebas unitarias para el motor financiero: cálculo de impuestos, capital de trabajo y valor terminal; conversión FX; datos faltantes; prevención de una perpetuidad inválida; y las tres decisiones de umbral. La suite completa contiene diez pruebas satisfactorias. TypeScript y la compilación de producción finalizaron correctamente. El botón de PDF carga el generador únicamente bajo demanda y prepara un informe local con comparativa, política de umbrales, resultado por país, flujo anual, alternativas y fuentes.

La captura de la interfaz autenticada confirma que las seis fases conservan su jerarquía visual y que la exportación se identifica claramente con el botón `PDF`, inicialmente deshabilitado hasta que exista una evaluación. La revisión de navegador no pudo acceder al contenido de trabajo por la ausencia de una sesión OAuth en el navegador compartido; la captura gestionada de WebDev confirmó el espacio autenticado. Se generó una muestra de informe de cuatro páginas para la revisión de maquetación posterior.

La revisión visual de la muestra PDF confirma una portada legible y coherente con la identidad de la aplicación, y una página financiera con puntuación, señal de decisión, supuestos de divisa, TAM/SAM/SOM, impuestos, capital de trabajo, alternativas, NPV, valor terminal y flujo de caja anual. Las tablas se mantienen dentro del área de página en el caso de prueba. Se sustituirá el símbolo griego de variación en la cabecera del flujo por texto ASCII para evitar una sustitución de glifo en fuentes PDF estándar.

La inspección de las dos páginas restantes confirmó la inclusión del resumen comparativo, mandato, política de umbrales, metodología, fuentes y caveats. La estructura completa se aprecia con lectura clara y sin desbordamiento observable. Se harán dos mejoras antes de entrega: etiquetas de umbrales comprensibles en vez de claves de implementación y contraste explícito blanco en las cabeceras de tabla para reforzar la lectura en el PDF.

## Sensibilidad, fuentes fiscales, guía y gates

Se incorporaron tres casos financieros: base, optimista y conservador. El motor modifica de forma independiente precio/ingreso, margen operativo expresado en puntos porcentuales y tipo de cambio a moneda de reporte; después recalcula flujo libre, ROI, NPV, recuperación y valor terminal por modo de entrada. La prueba de sensibilidad verifica que, con los mismos supuestos, el NPV optimista supera el caso base y el conservador queda por debajo; también comprueba la aplicación correcta de la variación FX.

El 9 de septiembre de 2026, la consulta en vivo para México devolvió una tasa corporativa estatutaria de 30% para 2025 desde Tax Foundation y un tipo de cambio de 0,05911 USD por MXN desde Frankfurter, con fecha de referencia 2026-09-09. Ambos conectores preservan el estado de fuente y permiten sustitución manual; los campos no se rellenan con datos inventados cuando falta una respuesta.

La captura gestionada de WebDev confirma que la guía “Cómo funciona el flujo” es visible antes del mandato, enumera el orden de uso y declara expresamente que Enter no confirma ni calcula. El panel conserva una navegación de siete etapas, incluida la nueva pestaña Gates. La muestra PDF de escenarios, renderizada a 120 dpi, muestra en la página financiera la tabla de sensibilidad de precio, margen y FX entre la tabla de alternativas y el flujo de caja anual. Las columnas permanecen dentro del área de página y los tres casos son legibles.

## Corrección de carga de indicadores en Mercados

La reproducción del flujo identificó que la primera actualización quedaba bloqueada por la descarga y lectura del archivo oficial WGI antes de actualizar el estado de la pantalla. Para Alemania, la carga conjunta tardó 72,2 segundos; era razonable interpretar durante ese intervalo que no se estaban poblando los indicadores, aunque la consulta terminase correctamente.

La corrección separa la carga en dos fases. Al añadir un país, la aplicación solicita automáticamente PIB, población, crecimiento, IED, tasa corporativa y tipo de cambio; esos indicadores se incorporan individualmente al estado de la tabla, sin borrar países añadidos previamente. WGI se solicita en segundo plano y la celda específica muestra “Cargando” hasta que llega. La reproducción posterior devolvió el conjunto macroeconómico y financiero de Alemania en 2,2–5,2 segundos y el WGI completo, sin bloquear la tabla, en 49,6 segundos. Se añadió una prueba unitaria para comprobar que la ruta de carga rápida no invoca WGI y conserva una respuesta de estado completo. La suite contiene 15 pruebas aprobadas; TypeScript y la compilación de producción también finalizaron correctamente.

## Tabla de Mercados: edición, trazabilidad y reintento WGI

La tabla ahora añade columnas para la tasa corporativa, el tipo de cambio de reporte por moneda local y la fecha de última actualización por país. El control Editar permite marcar como manuales cinco indicadores macroeconómicos, el valor agregado WGI, el impuesto y FX. Cada dato manual puede restaurarse individualmente a la fuente pública y las actualizaciones generales y programadas conservan las estimaciones manuales restantes. Si WGI termina sin datos, la fila muestra un error y ofrece un reintento que consulta solamente WGI para ese país. La compilación de producción, comprobación TypeScript y las 15 pruebas automatizadas finalizaron correctamente después de esta ampliación.
