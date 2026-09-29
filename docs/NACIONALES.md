# Verificación del panel Nacionales

Actualización: el listado se organiza en **Pendiente, Error, Ingresado y Eliminado** con contadores. Los parciales aparecen en Error conservando su O.S. Los ingresados no ofrecen un nuevo envío ordinario. Eliminar mueve el concepto a Eliminado y permite restaurarlo sin borrar su historial. El panel evita consultas de historial simultáneas y deja de consultar mientras la pestaña está oculta.

El botón **🌎 Nacionales** está integrado en `app-v3.html` y reutiliza la sesión actual. Los roles user, admin y superadmin tienen acceso; solo Super Admin modifica mapeos. No se añade otro login ni otro rol.

## Cambios

| Archivo | Cambio | Verificación |
|---|---|---|
| app-v3.html | Progreso real, duración, restauración de trabajos persistentes y botón Nacionales. | Recargue mientras hay trabajo y compare estado con backend. |
| assets/js/nacionales.js | Carga múltiple, revisión, selección, exclusión, procesamiento, historial y configuración. | Revise un concepto, complete mapeos y envíe un registro autorizado. |
| assets/css/nacionales.css | Diálogo responsive integrado con los estilos existentes. | Abra el módulo desde móvil y escritorio. |
| admin.html, superadmin.html | Funcionalidades previas consolidadas desde los patches del despliegue. | Compruebe Centro VIP, directorio y laboratorio. |
| netlify.toml, .github/workflows/ci.yml | Build y CI verifican fuentes sin reescribirlas con patches. | Compruebe resultado del build. |
| scripts/verify-build.mjs | Valida sintaxis e integración y evita volver al porcentaje calculado por tiempo. | Ejecute `node scripts/verify-build.mjs`. |

Los scripts históricos de patches permanecen como referencia; no deben volver a ejecutarse sobre el código consolidado.

## Antes de operar

Configure empresas y productos exactos en el módulo. El catálogo contiene 1008 productos del Excel, pero no inventa prestadores ni equivalencias ciudad/examen. Sin configuración o revisión no permite enviar. Verifique datos extraídos: detectar texto no garantiza interpretación correcta, especialmente nombres, fechas y pruebas marcadas en casillas.

Un registro PARCIAL conserva su orden. La opción de reintentar productos solo se ofrece si el backend tiene selectores de búsqueda verificados. Un guardado incierto necesita conciliación; no vuelva a crear la orden por su cuenta.

## Pruebas

Se ejecutaron verificadores de sintaxis, protecciones v7.3 y directorio v7.4. Se comprobó el módulo con Playwright en escritorio y ancho móvil, datos sintéticos y API simulada. La prueba no crea órdenes reales. El backend contiene las instrucciones de despliegue, variables, limitaciones y pruebas de productos.

Consulte [operación Nacionales](https://github.com/CristianG1h/biofile-render-endpoint/blob/main/docs/NACIONALES.md) y [despliegue y recuperación](https://github.com/CristianG1h/biofile-render-endpoint/blob/main/docs/DESPLIEGUE-Y-RECUPERACION.md).
# Revisión de carga — 29 de septiembre de 2026

Los errores de análisis aparecen en una lista persistente por archivo, además del contador del lote. El mensaje incluye la etapa que devuelve el servidor. Para reintentar, seleccione nuevamente el mismo archivo; el selector se limpia al terminar. La carga abre la sección del concepto recibido y restablece el filtro para que el resultado sea visible. Los errores se limpian al iniciar una nueva carga o cerrar sesión.
