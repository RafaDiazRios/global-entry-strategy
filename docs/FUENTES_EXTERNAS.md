# Fuentes externas verificadas para la ampliación

## UNCTAD

La búsqueda de fuentes oficiales identificó la tabla **Foreign direct investment: Inward and outward flows and stock** en el Centro de Datos de UNCTAD. La tabla se encuentra en https://unctadstat.unctad.org/datacentre/reportInfo/US.FdiFlowsStock y señala que los flujos y stocks de inversión extranjera directa (IED) están expresados en millones de dólares. El visor de datos asociado es https://unctadstat.unctad.org/datacentre/dataviewer/US.FDIFlowsStock. UNCTAD Data Hub indica disponibilidad de más de 150 indicadores y series para prácticamente todas las economías: https://unctadstat.unctad.org/.

La primera integración utilizará el indicador World Bank `BX.KLT.DINV.CD.WD` (IED neta entrante, US$ corrientes), cuya fuente primaria declarada por el Banco Mundial es UNCTAD. Esto permite una actualización estructurada y reproducible para el motor sin depender de una interfaz de descarga no documentada de UNCTAD. En la interfaz y manifiesto del dato se identificará expresamente como dato originado en UNCTAD, distribuido mediante World Bank Open Data. La tabla oficial de UNCTAD seguirá enlazada como fuente de verificación y ampliación.

## Worldwide Governance Indicators (WGI)

La búsqueda oficial confirmó que los Worldwide Governance Indicators ofrecen indicadores anuales de gobernanza para más de 200 economías en seis dimensiones: voz y rendición de cuentas; estabilidad política y ausencia de violencia; eficacia gubernamental; calidad regulatoria; estado de derecho; y control de corrupción. Fuentes: https://www.worldbank.org/en/publication/worldwide-governance-indicators/interactive-data-access y https://databank.worldbank.org/source/worldwide-governance-indicators.

La documentación del API de Indicadores del Banco Mundial confirma la estructura de consultas por país e identificador de indicador: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation y https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries. Una verificación directa comprobó que los antiguos códigos `PV.EST` ya no se resuelven en el API general, por lo que la integración se apoya en la descarga oficial actualizada de WGI en lugar de tratar un código archivado como fuente activa.

La página oficial publica la descarga **WGI 2025 Revision: Governance Estimates and Absolute Scores (1996–2024)** en formato Excel: https://www.worldbank.org/content/dam/sites/govindicators/doc/wgidataset_with_sourcedata-2025.xlsx. La aplicación descargará y leerá este archivo oficial, identificará cada economía por código ISO3 y utilizará las puntuaciones absolutas WGI de 0–100 para estabilidad política, eficacia gubernamental, calidad regulatoria, estado de derecho y control de corrupción. Se conservará el año de observación y la puntuación original, sin una normalización artificial.

## Verificación de acceso

El 9 de septiembre de 2026 se comprobó una respuesta válida del API V2 del Banco Mundial para Alemania y el indicador de PIB corriente. Esta misma infraestructura se usará para los indicadores WGI y la IED de fuente UNCTAD a través de World Bank Open Data.
