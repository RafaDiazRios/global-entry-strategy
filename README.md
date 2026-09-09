# Global Entry Strategy Studio

Aplicación personal para diseñar y evaluar estrategias de entrada internacional. Combina los capítulos 5–8 de *Global Strategic Management* de Philippe Lasserre y Felipe Monteiro con indicadores públicos actualizables y supuestos explícitos del responsable de estrategia.

## Qué resuelve

La herramienta no asigna un “mejor país” universal. Estructura una decisión para una empresa y una industria concretas mediante siete etapas: mandato, selección de mercados, calibración estratégica, caso económico TAM/SAM/SOM, comparación lado a lado, decisión de entrada y gates de aprobación.

| Módulo | Funcionalidad |
|---|---|
| Mandato | Empresa, país base, industria, modelo de negocio, propuesta de valor, objetivo y horizonte |
| Mercados | Catálogo de países, filtros de exclusión, PIB, crecimiento y población |
| Datos externos | World Bank Open Data, IED de fuente UNCTAD y gobernanza WGI 2025 |
| Estrategia | Atractividad, riesgo, distancia CAGE, pesos configurables y modos de entrada |
| Finanzas | TAM, SAM, SOM, impuestos, capital de trabajo, tipo de cambio, ROI sobre flujo libre, NPV, valor terminal y recuperación por alternativa |
| Sensibilidad | Casos base, optimista y conservador para variaciones de precio/ingreso, margen operativo y tipo de cambio |
| Comparación | Panel lado a lado de hasta cuatro países con evidencia, resultado y economía de entrada |
| Gobierno de inversión | Umbrales configurables que clasifican cada alternativa como Avanzar, Probar, Descartar o Completar evidencia |
| Gates | Hitos editables, responsables y fecha de revisión para decisiones de Probar o Avanzar vinculadas a un escenario guardado |
| Historial y reporte | Escenarios personales autenticados, informe PDF detallado y actualización de datos |

## Fuentes conectadas

- **World Bank Open Data:** PIB, población, crecimiento, urbanización, conectividad, comercio e inversión doméstica.
- **UNCTAD:** flujos netos de IED entrante y IED como porcentaje de PIB. Se consume la serie `BX.KLT.DINV.CD.WD` y `BX.KLT.DINV.WD.GD.ZS` distribuida por World Bank Open Data, cuya fuente declarada es UNCTAD. La tabla de referencia es [UNCTAD FDI flows and stock](https://unctadstat.unctad.org/datacentre/reportInfo/US.FdiFlowsStock).
- **Worldwide Governance Indicators:** estabilidad política, eficacia gubernamental, calidad regulatoria, estado de derecho y control de corrupción. Se consume la descarga oficial [WGI 2025 Revision](https://www.worldbank.org/content/dam/sites/govindicators/doc/wgidataset_with_sourcedata-2025.xlsx), con puntuaciones absolutas 0–100 para datos de 1996–2024.
- **Tax Foundation:** tasa corporativa estatutaria estándar por jurisdicción a partir del archivo público de [Corporate Tax Rates Around the World, 2025](https://taxfoundation.org/data/all/global/corporate-tax-rates-by-country-2025/). Es una cifra inicial editable, no una posición fiscal individual.
- **Frankfurter:** tipo de cambio de referencia de bancos centrales para convertir la moneda local a la moneda de reporte. La [API pública](https://frankfurter.dev/) devuelve referencias actuales e históricas; no proporciona un precio ejecutable ni una cobertura de divisa.

Los datos públicos son señales de contexto. La aplicación no genera de forma automática tamaño de mercado, rentabilidad, regulación o demanda sectorial. Esos elementos se introducen como supuestos y deben respaldarse con fuentes, pruebas de mercado o investigación local.

## Convenciones financieras

Todos los supuestos de una comparación por país deben introducirse en una única moneda y en importes anuales. La herramienta calcula lo siguiente:

- `TAM horizonte = TAM año 1 × (1 + crecimiento anual)^(horizonte − 1)`
- `SAM = TAM × % SAM`
- `SOM ingresos = SAM × % SOM`
- `FCF_t = EBIT_t − impuestos_t − Δcapital de trabajo_t`
- `ROI acumulado = (FCF acumulado − inversión inicial) / inversión inicial`; no incluye valor terminal.
- `NPV = −inversión inicial + Σ(FCF_t / (1 + tasa de descuento)^t) + VP(valor terminal)`
- `Valor terminal = FCF_(n+1) / (tasa de descuento − crecimiento terminal)`; el modelo falla de forma explícita si la tasa de descuento no es superior al crecimiento terminal.
- Cuando la moneda local y de reporte difieren, todos los importes del flujo se multiplican por el tipo de cambio introducido, expresado como unidades de moneda de reporte por una unidad de moneda local.

El modelo no incluye financiación, depreciación, amortización, valor residual alternativo, cambios fiscales futuros, costes de integración ni coberturas de divisa. Deben añadirse en un modelo corporativo completo cuando sean materiales. El ROI se muestra como estimación y nunca como una aprobación de inversión.

## Escenarios de sensibilidad

El caso **base** utiliza directamente los supuestos introducidos. Los casos **optimista** y **conservador** aplican tres modificaciones editables: variación porcentual de precio/ingreso, variación del margen operativo en puntos porcentuales y variación porcentual del tipo de cambio reportado. La herramienta recalcula flujos de caja, ROI, NPV, valor terminal y recuperación de cada alternativa en cada caso. Si falta una de las tres sensibilidades, el caso se muestra como incompleto en lugar de inventar un resultado.

## Flujo de aprobación

Un gate se crea desde la séptima fase para mercados cuya señal sea **Probar** o **Avanzar**, después de guardar el escenario. El usuario asigna responsable, revisor, fecha de revisión y alcance. El sistema propone cuatro hitos editables previos a la fecha de gate y permite actualizar el estado del gate o marcar hitos como completados. El flujo documenta el trabajo de decisión; no autoriza gasto, adquisición ni ninguna operación financiera.

## Uso para personas nuevas

La banda “Cómo funciona el flujo” muestra las cinco acciones principales y sirve como navegación. Los campos se incorporan al borrador al editarse: **no hay que pulsar Enter para confirmar**. La actualización de fuentes se ejecuta con **Actualizar mercado y fiscal**; el análisis con **Generar evaluación**; la persistencia con **Guardar**; y los gates con **Crear gate**. Si cambia un supuesto tras guardar, el gate queda desvinculado para evitar que una aprobación se aplique a una versión distinta del escenario.

## Política de umbrales

La política está visible y es modificable dentro de cada escenario. **Avanzar** exige que la alternativa con mejor NPV supere el riesgo ajustado, confianza de evidencia, NPV, ROI y recuperación máxima definidos. **Probar** permite una entrada reversible si supera los criterios mínimos de prueba y, opcionalmente, el límite de inversión. **Descartar** significa que no se cumple el mínimo de prueba. **Completar evidencia** se muestra cuando faltan supuestos financieros obligatorios o existe una inconsistencia entre la moneda de umbrales y la moneda de reporte. La herramienta no autoriza gastos ni sustituye a la debida diligencia.

## Informe PDF

El botón **PDF** genera localmente un informe detallado que incluye mandato, tabla comparativa, política de umbrales, puntuaciones, recomendación por mercado, supuestos financieros, alternativas, flujos de caja anuales, NPV, valor terminal, alertas, metodología y fuentes. El archivo no se transmite a terceros ni se guarda fuera del navegador por esta función.

## Desarrollo local

### Requisitos

- Node.js 22+
- pnpm 10+
- Una base de datos MySQL/TiDB y las variables de entorno de Manus para autenticación si se requiere historial de escenarios.

### Comandos

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
```

### Migraciones de base de datos

La tabla `strategyScenarios` almacena escenarios y resultados. Para cambios de esquema:

```bash
pnpm drizzle-kit generate
# Revise la migración SQL generada antes de aplicarla.
pnpm drizzle-kit migrate
```

## Arquitectura

```text
client/src/pages/Home.tsx            Interfaz, supuestos, comparación y exportación
client/src/components/OnboardingGuide.tsx  Guía de primera evaluación y estados de progreso
client/src/components/ApprovalWorkspace.tsx Gates, responsables e hitos de revisión
server/strategy/engine.ts            Motor de atractividad, riesgo, modos y combinación financiera
server/strategy/financialEngine.ts   TAM/SAM/SOM, escenarios, ROI, NPV y recuperación
server/strategy/worldBank.ts         Indicadores macro e IED de fuente UNCTAD
server/strategy/wgi.ts               Descarga, lectura y caché de WGI 2025
server/strategy/countryFinancialData.ts  Impuesto corporativo y tipos de cambio públicos
server/scheduledRefresh.ts           Actualización segura de escenarios guardados
server/routers.ts                    Contratos tRPC y validación de entradas
drizzle/schema.ts                    Definición de persistencia
```

## Actualización de datos

La aplicación permite actualización manual en el panel de mercados. También expone una ruta `POST /api/scheduled/refresh-scenarios`, protegida exclusivamente para tareas cron autenticadas de Manus, que actualiza los datos públicos y reevalúa todos los escenarios guardados. Configure la tarea solo después de publicar la aplicación. Para los datos macroeconómicos y de gobernanza, una frecuencia mensual es normalmente suficiente.

## Límites y principios de gobierno

1. No trate una puntuación como una recomendación autónoma de inversión o adquisición.
2. Mantenga separadas la evidencia pública, las hipótesis, los cálculos y el juicio directivo.
3. Revise la definición de TAM/SAM/SOM y la moneda antes de comparar países.
4. Documente las razones de cualquier cambio de peso, modo de entrada o escala de compromiso.
5. Para alianzas y adquisiciones, realice debida diligencia financiera, legal, operativa, cultural y de socio antes de comprometer capital.

## Licencia

Pendiente de definir por el propietario del repositorio.
