# Panel de gestión BIOFILE — VIP Salud Ocupacional

Panel estático para buscar pacientes registrados, enviarlos al robot de BIOFILE o realizar el ingreso manual.

## Funciones

- Consulta registros desde Google Sheets.
- Envío automático al endpoint de BIOFILE en Render.
- Ingreso manual con foto, firma y copia de datos.
- Consulta visual de exámenes asociados desde el Sheet Maestro.
- Recordatorio para rectificar los exámenes con el correo original.

## Importante sobre los exámenes

Los exámenes se muestran solo como ayuda para recepción. No se agregan a `CAMPOS_BIOFILE`, no se copian con “Copiar todo” y no se envían al robot. Deben rectificarse con el correo original y luego digitarse directamente en BIOFILE.

## Servicios configurados

- Receptor de registros: Google Apps Script v3.
- Consulta de órdenes/exámenes: Google Apps Script v4 (`accion=buscarPersona`).
- Robot: `https://biofile-render-endpoint.onrender.com`.

## Publicación

Es un sitio estático. En Netlify deje el comando de compilación vacío y use `.` como directorio de publicación.
