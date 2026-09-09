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
