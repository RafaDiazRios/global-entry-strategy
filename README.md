# Global Entry Strategy Studio

Aplicación personal para diseñar y evaluar estrategias de entrada internacional. Combina los capítulos 5–8 de *Global Strategic Management* de Philippe Lasserre y Felipe Monteiro con indicadores públicos actualizables y supuestos explícitos del responsable de estrategia.

## Qué resuelve

La herramienta no asigna un “mejor país” universal. Estructura una decisión para una empresa y una industria concretas mediante seis etapas: mandato, selección de mercados, calibración estratégica, caso económico TAM/SAM/SOM, comparación lado a lado y decisión de entrada.

| Módulo | Funcionalidad |
|---|---|
| Mandato | Empresa, país base, industria, modelo de negocio, propuesta de valor, objetivo y horizonte |
| Mercados | Catálogo de países, filtros de exclusión, PIB, crecimiento y población |
| Datos externos | World Bank Open Data, IED de fuente UNCTAD y gobernanza WGI 2025 |
| Estrategia | Atractividad, riesgo, distancia CAGE, pesos configurables y modos de entrada |
| Finanzas | TAM, SAM, SOM, beneficio operativo, ROI simple, NPV y año de recuperación por alternativa |
| Comparación | Panel lado a lado de hasta cuatro países con evidencia, resultado y economía de entrada |
| Historial | Escenarios personales autenticados, exportables en Markdown y actualizables |

## Fuentes conectadas

- **World Bank Open Data:** PIB, población, crecimiento, urbanización, conectividad, comercio e inversión doméstica.
- **UNCTAD:** flujos netos de IED entrante y IED como porcentaje de PIB. Se consume la serie `BX.KLT.DINV.CD.WD` y `BX.KLT.DINV.WD.GD.ZS` distribuida por World Bank Open Data, cuya fuente declarada es UNCTAD. La tabla de referencia es [UNCTAD FDI flows and stock](https://unctadstat.unctad.org/datacentre/reportInfo/US.FdiFlowsStock).
- **Worldwide Governance Indicators:** estabilidad política, eficacia gubernamental, calidad regulatoria, estado de derecho y control de corrupción. Se consume la descarga oficial [WGI 2025 Revision](https://www.worldbank.org/content/dam/sites/govindicators/doc/wgidataset_with_sourcedata-2025.xlsx), con puntuaciones absolutas 0–100 para datos de 1996–2024.

Los datos públicos son señales de contexto. La aplicación no genera de forma automática tamaño de mercado, rentabilidad, regulación o demanda sectorial. Esos elementos se introducen como supuestos y deben respaldarse con fuentes, pruebas de mercado o investigación local.

## Convenciones financieras

Todos los supuestos de una comparación por país deben introducirse en una única moneda y en importes anuales. La herramienta calcula lo siguiente:

- `TAM horizonte = TAM año 1 × (1 + crecimiento anual)^(horizonte − 1)`
- `SAM = TAM × % SAM`
- `SOM ingresos = SAM × % SOM`
- `ROI simple acumulado = (beneficio operativo acumulado − inversión inicial) / inversión inicial`
- `NPV = −inversión inicial + Σ(beneficio operativo anual / (1 + tasa de descuento)^t)`

El modelo no incluye por defecto impuestos, financiación, capital de trabajo, valor terminal, efectos de divisa ni costes de integración. Deben añadirse en un modelo corporativo completo cuando sean materiales. El ROI se muestra como estimación y nunca como una aprobación de inversión.

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
server/strategy/engine.ts            Motor de atractividad, riesgo, modos y combinación financiera
server/strategy/financialEngine.ts   TAM/SAM/SOM, ROI, NPV y recuperación
server/strategy/worldBank.ts         Indicadores macro e IED de fuente UNCTAD
server/strategy/wgi.ts               Descarga, lectura y caché de WGI 2025
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
