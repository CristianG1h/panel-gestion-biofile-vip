# Panel de gestión BIOFILE — VIP Salud Ocupacional

Panel estático publicado en Netlify para buscar pacientes, enviarlos al robot de BIOFILE o completar un ingreso manual.

## Panel v3

La raíz del sitio y `/index.html` sirven `app-v3.html` mediante `netlify.toml`.

El panel v3 incluye:

- inicio de sesión con usuario y contraseña BIOFILE;
- token temporal de sesión en el navegador, sin guardar la contraseña;
- cola de trabajos asociada al usuario conectado;
- tema claro/oscuro guardado por usuario en ese navegador;
- envío individual y masivo;
- consulta de exámenes asociados;
- ingreso manual con foto, firma y copia de datos;
- lápiz para editar los campos y guardarlos directamente en Google Sheets;
- `Estrato = 1` cuando el registro está vacío;
- marcado de ingresos manuales en Google Sheets;
- dashboard exclusivo para el administrador con filtros Hoy, Semana, Mes y Personalizado;
- reporte Excel por empresa.

## Dashboard

El dashboard no elimina información al cambiar de día. Por defecto consulta únicamente la fecha de hoy, por lo que el contador diario comienza de nuevo de forma natural, mientras el historial permanece disponible para semana, mes o rangos personalizados.

Las estadísticas por usuario empiezan a ser atribuibles desde la activación del sistema multiusuario porque los registros históricos anteriores no contienen `USUARIO_BIOFILE`.

## Seguridad

Las credenciales BIOFILE no están dentro de este repositorio. Deben configurarse en las variables de entorno del servicio `biofile-render-endpoint` en Render.

La contraseña se envía únicamente durante el inicio de sesión por HTTPS. Después, el panel conserva solo un token temporal en `sessionStorage`.

## Servicios

- Receptor/listado de registros: Google Apps Script.
- Consulta de órdenes/exámenes: Google Apps Script (`accion=buscarPersona`).
- Robot/API: `https://biofile-render-endpoint.onrender.com`.
- Publicación: Netlify, directorio `.`.
