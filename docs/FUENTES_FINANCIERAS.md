# Fuentes públicas financieras

## Tasa corporativa estatutaria

La herramienta descarga la serie 2025 de **Tax Foundation — Corporate Tax Rates Around the World** desde su archivo CSV público: <https://taxfoundation.org/wp-content/uploads/2025/12/rates_final-1.csv>. La publicación de referencia está disponible en <https://taxfoundation.org/data/all/global/corporate-tax-rates-by-country-2025/>.

La fuente abarca 226 Estados soberanos y territorios dependientes identificados por códigos ISO y emplea la tasa máxima corporativa estatutaria estándar y combinada. No representa regímenes especiales, incentivos sectoriales, pérdidas fiscales, tasas para no residentes, retenciones ni la estructura fiscal específica de la empresa. La herramienta etiqueta esta cifra como dato público editable y conserva la fecha de recuperación junto con la fuente.

## Tipo de cambio

La herramienta identifica la moneda ISO 4217 de los países disponibles en su catálogo y obtiene un tipo de cambio de referencia de **Frankfurter** (<https://frankfurter.dev/>). Frankfurter publica una API sin clave en <https://api.frankfurter.dev>, con referencias actuales e históricas de 205 monedas de 94 bancos centrales. El endpoint utilizado expresa unidades de moneda de reporte por una unidad de moneda local.

El valor es una referencia de cierre, no una cotización ejecutable, previsión de divisa ni cobertura. Para mantener consistencia entre una cifra pública y el modelo de la empresa, cualquier usuario puede sustituir el tipo o la tasa fiscal manualmente. Una sobrescritura manual conserva la fuente informativa, pero se marca claramente como valor manual en el escenario.

## Actualización y límites

Los datos se solicitan al pulsar **Actualizar datos de mercado y fiscal** y también se incorporan al proceso de actualización programada ya disponible para escenarios guardados. Las respuestas de fuentes se conservan en memoria durante un máximo de 24 horas por instancia para limitar llamadas repetidas. Si una fuente no aporta un valor, el sistema deja el campo vacío y solicita una edición manual; nunca lo rellena con un valor supuesto.
