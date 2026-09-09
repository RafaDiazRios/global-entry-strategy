# Metodología de Global Entry Strategy Studio

## Propósito y principio de diseño

**Global Entry Strategy Studio** estructura la decisión de entrada en un país o *cluster* geográfico para una empresa concreta. No pretende generar un “ranking universal” de países, porque la atractividad no existe de manera independiente de la industria, la propuesta de valor, el objetivo estratégico, las capacidades de la empresa y su tolerancia al riesgo. La herramienta hace explícitos los supuestos, combina evidencia cuantitativa y cualitativa y permite volver a revisar una decisión cuando cambian los datos o la estrategia.

El diseño se deriva de los capítulos 5 a 8 de *Global Strategic Management*, quinta edición. El marco considera cuatro dimensiones: **ambición global**, **posicionamiento y atractividad geográfica**, **modo y ritmo de entrada**, y, cuando sea pertinente, **alianzas, adquisiciones e integración**.[^1]

## Unidad de análisis

Cada escenario corresponde a una empresa o proyecto, un país base, una industria o subindustria, un modelo de negocio, una propuesta de valor, un objetivo de entrada y un horizonte temporal. La herramienta permite comparar de uno a doce países. Los *clusters* no se puntúan como agregados ficticios: se crean como una cartera de países comparables y se interpretan a partir de los resultados país por país.

| Decisión | Pregunta que la herramienta ordena | Marco aplicado |
|---|---|---|
| Ambición | ¿Qué papel debe cumplir el mercado en la estrategia global? | Objetivos de mercado, recursos, capacidades y coordinación |
| Selección | ¿Qué países superan los requisitos mínimos y ofrecen mejor equilibrio entre oportunidad y exposición? | Atractividad de país, competencia, CAGE y riesgo |
| Secuencia | ¿Entrar, entrar gradualmente o mantener una posición de observación? | Ventana de oportunidad, primer entrante y opción real |
| Modo | ¿Con qué nivel de control y compromiso debe entrar la empresa? | Filial, adquisición, JV/alianza, licencia/franquicia, distribuidor u oficina |
| Ejecución | ¿Qué debe validarse antes de comprometer capital? | Viabilidad, encaje de socio, debida diligencia e integración |

## Flujo de análisis

### 1. Mandato y objetivo de entrada

El usuario define si la entrada busca **desarrollo de mercado**, **acceso a recursos**, **aprendizaje/captura de capacidades** o **coordinación regional**. Estos objetivos se basan en los motivos de internacionalización de búsqueda de mercado, recursos y capacidades, ampliados en el capítulo 7 con el objetivo de coordinación.[^2] La elección no altera datos factuals; orienta la interpretación del modo de entrada y evita confundir una plataforma logística con un mercado de crecimiento.

### 2. Construcción del universo y filtros explícitos

El usuario incorpora un conjunto inicial de países de un catálogo regional y puede excluir jurisdicciones por código ISO, tamaño de población, tamaño de PIB o crecimiento real. Los filtros no sustituyen la evaluación. Son un mecanismo transparente para reducir un universo amplio a alternativas que merecen análisis estratégico. Una exclusión se conserva visible para que pueda cuestionarse o revertirse.

### 3. Evidencia pública actualizable

La primera conexión automática utiliza **World Bank Open Data** para obtener los últimos valores disponibles de PIB corriente, PIB por habitante, crecimiento del PIB real, población, urbanización, usuarios de internet, comercio sobre PIB e inversión bruta sobre PIB.[^3] Estos indicadores cubren la familia de variables macroeconómicas, sociológicas, demográficas e institucionales sugerida para una evaluación inicial de mercado.[^4]

La herramienta muestra datos faltantes de manera explícita. No inventa valores ni interpreta la falta de disponibilidad como desempeño bajo. Las integraciones propuestas, pero no conectadas en la primera versión, son UNCTADstat para IED y comercio, los Worldwide Governance Indicators para dimensiones de gobernanza y riesgo, y ILOSTAT para capacidades y coste laboral. Estas fuentes pueden activarse posteriormente si sus definiciones, periodicidad y licencias encajan con el caso de uso.

### 4. Calibración cualitativa y trazabilidad

El responsable del análisis valora en escala de 0–100 factores que no pueden inferirse automáticamente de la macroeconomía. Cada puntuación debe documentarse con una fuente, observación, entrevista, prueba de mercado, asesor local o supuesto verificable.

| Bloque | Factores | Lectura de 100 |
|---|---|---|
| Oportunidad | Calidad de demanda, encaje de recursos, contexto competitivo, apertura e incentivos | Máxima oportunidad o encaje |
| Distancia y riesgo | Distancia CAGE; riesgo político, económico, competitivo y operativo | Máxima exposición; el motor invierte la puntuación para construir encaje y seguridad |
| Entrada | Capacidad interna, presión temporal, necesidad de control y sensibilidad de IP | Máxima intensidad del factor indicado |

La evaluación competitiva corresponde a rivalidad, barreras de entrada, poder de proveedores y compradores, sustitutos y política pública; se usa el enfoque de cinco fuerzas ampliado con intervención gubernamental.[^5] La distancia CAGE distingue dimensiones culturales, administrativas, geográficas y económicas, comparadas desde el país base de la empresa.[^6] El riesgo de país se organiza como riesgo político, económico, competitivo y operativo.[^7]

### 5. Puntuaciones y pesos

La herramienta calcula seis puntuaciones parciales: **mercado**, **recursos**, **competencia**, **gobierno**, **encaje CAGE** y **seguridad**. La puntuación de mercado combina indicadores macroeconómicos normalizados con la valoración de calidad de demanda. La de recursos combina conectividad, inversión, apertura comercial, urbanización y encaje de recursos. La seguridad es el complemento de la exposición media a riesgos político, económico, competitivo y operativo.

La **atractividad** combina mercado, recursos, competencia, gobierno y encaje CAGE. La **puntuación ajustada por riesgo** combina atractividad y seguridad. Los pesos predeterminados, modificables por el usuario, son mercado 28%, recursos 16%, competencia 16%, gobierno 10%, encaje CAGE 10% y seguridad/riesgo 20%. El motor normaliza cualquier conjunto de pesos; por ello no exige que sumen exactamente 100.

> La puntuación es una representación de preferencias y evidencia disponible, no una predicción de retorno ni una recomendación de inversión autónoma.

La confianza de evidencia no indica probabilidad de éxito. Refleja la cobertura de los indicadores públicos y el grado de especificación de los factores cualitativos. Una puntuación alta con baja confianza debe llevar a más investigación, no a más compromiso.

### 6. Timing y modo de entrada

El modelo clasifica la situación en tres lecturas: **actuar**, **entrada gradual como opción real** u **observar y aprender**. La lógica reconoce que una entrada de bajo compromiso puede ser una inversión de aprendizaje que conserva la opción de ampliar, transformar o detener la presencia según evolucione la evidencia.[^8]

Después presenta tres modos iniciales por país, ordenados por encaje relativo:

| Modo | Cuando suele ser más pertinente | Principal contrapartida |
|---|---|---|
| Filial propia / *greenfield* | Alta necesidad de control, capacidad interna y riesgo tolerable | Alto compromiso de recursos y exposición |
| Adquisición | Ventana competitiva cerrada o necesidad de activos y clientes inmediatos | Precio, integración y riesgo de valoración |
| *Joint venture* o alianza | Necesidad de legitimidad local, recursos complementarios o restricciones regulatorias | Dependencia, gobierno y posible fuga de conocimiento |
| Licencia o franquicia | Bajo compromiso, riesgo alto o transferencia controlable | Menor control, conocimiento de cliente e IP |
| Agente o distribuidor | Prueba de mercado o escala limitada | Dependencia de canal y contacto indirecto con el mercado |
| Oficina / observatorio | Necesidad de aprender, relacionarse o preparar una entrada futura | No sustituye una capacidad operativa |
| Entrada digital o híbrida | Oferta desplegable digitalmente, con localización y cumplimiento viables | Regulación, datos, pagos y eventual necesidad de socios/operación física |

La recomendación no cierra una decisión. Un modo de alto compromiso exige, como mínimo, un caso financiero, revisión regulatoria, prueba de demanda, análisis de capacidad de ejecución y, en adquisiciones o alianzas, debida diligencia y encaje estratégico, operacional, cultural y organizativo.[^9]

## Actualización y gobierno del dato

Los escenarios guardados conservan las entradas, los resultados y la fecha de última actualización. La aplicación incluye una ruta segura para una actualización programada de los indicadores públicos de todos los escenarios. Esa tarea debe activarse tras publicar la aplicación; una frecuencia mensual suele ser suficiente para macroindicadores, salvo que una industria o evento requiera una revisión más corta. El usuario puede actualizar manualmente en cualquier momento.

Las reglas de gobierno recomendadas son sencillas: conservar la fuente y fecha de cada afirmación importante; separar hechos de supuestos; revisar pesos cuando cambie el mandato; y documentar los criterios para subir el nivel de compromiso o abandonar una opción. Las puntuaciones no deben utilizarse para aprobar automáticamente inversión, adquisiciones o entrada en jurisdicciones sensibles.

## Límites de la primera versión

La versión inicial está diseñada para la etapa de filtrado y diseño de estrategia. No calcula TAM/SAM/SOM, proyecciones de ingresos, coste de entrada, WACC, NPV, ROI ni valoración de una adquisición. Tampoco descarga automáticamente inteligencia competitiva sectorial, requisitos regulatorios específicos o perfiles de socios. Estas extensiones requieren definir primero la industria, la unidad económica, la fuente de datos y los criterios de decisión que el usuario autorice.

## Referencias

[^1]: Philippe Lasserre y Felipe Monteiro, *Global Strategic Management*, 5.ª ed. (Bloomsbury Academic, 2023), capítulos 5–8, pp. 175–350.
[^2]: Ibid., capítulo 5, pp. 180–182; capítulo 7, pp. 257–260.
[^3]: [World Bank Open Data](https://data.worldbank.org/).
[^4]: Lasserre y Monteiro, *Global Strategic Management*, 5.ª ed., tabla 6.1, p. 231.
[^5]: Ibid., tabla 6.4, pp. 238–239.
[^6]: Ibid., figura 6.11, pp. 243–244; Pankaj Ghemawat, *Redefining Global Strategy* (Harvard Business School Press, 2007).
[^7]: Lasserre y Monteiro, *Global Strategic Management*, 5.ª ed., figura 6.12, pp. 244–246.
[^8]: Ibid., pp. 261–270.
[^9]: Ibid., capítulos 7 y 8, pp. 263–350.
