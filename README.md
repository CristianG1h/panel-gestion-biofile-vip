# Panel de gestión BIOFILE — VIP Salud Ocupacional

Panel web de **VIP Salud Ocupacional** para buscar pacientes, revisar información, enviarlos al robot de BIOFILE, registrar ingresos manuales y consultar la operación por usuario.

El proyecto es estático, se publica en **Netlify** y consume el backend `biofile-render-endpoint` alojado en Render.

> **Documentación actualizada: 12 de agosto de 2026.**

## Panel actual

La raíz del sitio y `/index.html` utilizan la versión multiusuario del panel (`app-v3.html`) mediante la configuración de `netlify.toml`.

```text
Usuario
  │
  ▼
Panel Netlify
  │
  ├── Google Apps Script: registros / órdenes / exámenes
  │
  └── API Render: autenticación, BIOFILE, edición,
                  progreso, estadísticas, usuarios y auditoría
                         │
                         ▼
                      BIOFILE
```

## Funcionalidades principales

### Inicio de sesión multiusuario

- Cada persona entra con su propio usuario y contraseña BIOFILE.
- La contraseña se usa únicamente para autenticar y **no queda almacenada en el HTML**.
- Después del login, el navegador conserva un token temporal en `sessionStorage`.
- El panel muestra el usuario conectado y utiliza su propia cola de trabajos.
- Diferentes usuarios pueden enviar pacientes simultáneamente sin compartir la misma sesión BIOFILE.

### Búsqueda y gestión de pacientes

- Consulta de registros disponibles desde Google Sheets/Apps Script.
- Búsqueda por identificación y datos visibles del paciente.
- Consulta visual de los exámenes asociados desde el Sheet Maestro.
- Envío individual a BIOFILE.
- Envío masivo de registros seleccionados.
- Prevención desde el backend para evitar dos trabajos activos sobre el mismo documento.
- Historial operativo por usuario.
- Paginación del panel principal para trabajar con bases grandes sin cargar todo visualmente de una sola vez.

### Progreso detallado del robot

Mientras un paciente está siendo procesado, el panel puede mostrar:

- etapa actual;
- porcentaje de avance;
- estado del trabajo;
- usuario responsable;
- número de **OS** generado en BIOFILE cuando ya está disponible;
- mensaje final o error si el proceso falla.

Esto facilita saber si el robot está iniciando sesión, llenando información, cargando imágenes, guardando o finalizando.

### Ingreso manual

El panel mantiene el flujo de ingreso manual con:

- datos completos del paciente;
- foto;
- firma;
- copia rápida de información;
- edición mediante el ícono de lápiz;
- actualización directa de campos permitidos en Google Sheets;
- `Estrato = 1` cuando el valor requerido está vacío;
- marcado del registro como ingreso manual;
- selección/atribución del responsable real del ingreso cuando corresponde.

Las tarjetas de pacientes ingresados muestran el **usuario responsable** para mejorar la trazabilidad de la operación.

### Eliminados

Se incorporó el manejo de registros eliminados para separar pacientes que no deben continuar dentro del flujo normal.

El sistema permite conservar:

- quién envió el registro a eliminados;
- fecha;
- motivo;
- trazabilidad en auditoría.

Los eliminados se diferencian de los ingresos normales y el backend los excluye de las estadísticas operativas de producción.

## Roles

| Rol | Funciones |
|---|---|
| `user` | Operación diaria: pacientes, edición permitida, envíos e ingresos manuales. |
| `admin` | Operación + dashboard administrativo y estadísticas. |
| `superadmin` | Operación + dashboard + administración de usuarios y auditoría. |

### Superadministración

El panel incluye acceso específico de **Super Admin** para gestionar usuarios sin tener que modificar manualmente Render cada vez.

El superadministrador puede:

- consultar usuarios administrados;
- crear nuevos usuarios con rol `user` o `admin`;
- modificar nombre, contraseña o rol;
- activar/desactivar usuarios;
- consultar auditoría de acciones.

Los usuarios `superadmin` no se crean desde esta interfaz: permanecen protegidos en las variables seguras de Render.

## Dashboard administrativo

Disponible para `admin` y `superadmin`.

Incluye filtros:

```text
Hoy
Semana
Mes
Personalizado
```

El dashboard conserva el historial; el contador de “Hoy” cambia según la fecha consultada, pero la información anterior continúa disponible.

Entre la información operativa se encuentra:

- producción por usuario;
- ingresos automáticos y manuales;
- atribución del responsable;
- historial de actividad;
- colas/trabajos cuando corresponde;
- filtros por rango de fechas;
- reporte Excel por empresa.

Los registros anteriores a la activación de la arquitectura multiusuario pueden no tener `USUARIO_BIOFILE`, porque esa trazabilidad todavía no existía en esas filas.

## Mejoras de interfaz recientes

- Paginación corregida y aplicada al panel principal.
- Historial paginado por usuario.
- Tema oscuro mejorado.
- Preferencia de tema conservada por usuario en ese navegador.
- Horas presentadas con referencia de **Colombia (`America/Bogota`)**.
- Visualización del usuario responsable en registros ya ingresados.
- Detalle de progreso, porcentaje y OS durante la automatización.
- Separación visual/operativa de eliminados.
- Acceso a dashboard y Super Admin según permisos.

## Seguridad

- No existen contraseñas BIOFILE incrustadas en este repositorio.
- El login se envía al backend mediante HTTPS.
- Después del login, el panel conserva únicamente un token temporal.
- Los permisos sensibles se validan nuevamente en el backend; ocultar un botón no es el mecanismo de seguridad.
- Las credenciales administradas están protegidas por el servicio `biofile-render-endpoint` y Google Sheets.
- Las variables privadas y `BIOFILE_ENCRYPTION_KEY` deben permanecer exclusivamente en Render.

## Servicios utilizados

### Robot/API

```text
https://biofile-render-endpoint.onrender.com
```

Responsable de autenticación, colas, automatización BIOFILE, edición, progreso, estadísticas, usuarios y auditoría.

### Google Apps Script

El panel utiliza Apps Script para consultar los registros y la información complementaria de órdenes/exámenes. La consulta de exámenes no sustituye al backend BIOFILE; son componentes diferentes del flujo.

### Netlify

El sitio no requiere compilación de frontend.

Configuración general:

```text
Rama de producción: main
Directorio de publicación: .
Configuración: netlify.toml
```

Los cambios enviados a `main` pueden publicarse automáticamente mediante la integración GitHub → Netlify.

## Archivos principales

```text
index.html        Entrada/compatibilidad del sitio
app-v3.html       Panel multiusuario actual
netlify.toml      Reglas y publicación en Netlify
_headers          Cabeceras del sitio
logo-vip.png      Identidad visual
favicon-*         Iconos del sitio
docs/             Documentación complementaria
README.md         Documentación general
```

## Cambios recientes consolidados

### 11–12 de agosto de 2026

- Panel BIOFILE multiusuario activado en la raíz.
- Dashboard por usuario y edición directa de datos.
- Superadministración de usuarios y roles.
- Permisos diferenciados para `admin` y `superadmin`.
- Historial por usuario.
- Paginación del panel principal e historial.
- Tema oscuro y presentación horaria de Colombia mejorados.
- Progreso por etapas, porcentaje y número de OS.
- Sección/flujo de eliminados.
- Atribución de ingresos manuales.
- Visualización del responsable de cada ingreso.
- Correcciones finales de paginación para la versión desplegada en Netlify.

---

**VIP Salud Ocupacional — Panel de gestión BIOFILE**
