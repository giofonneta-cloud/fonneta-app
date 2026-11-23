# Inventario de datos, terceros y consentimientos

> Última revisión: 2026-11-23. Actualizar cada vez que se añada un campo personal, un SDK o un script de terceros.

## 1. Datos personales que recopila la app

| Dato | Quién | Dónde se guarda | Finalidad | Retención |
|------|-------|-----------------|-----------|-----------|
| Nombre, correo, teléfono, cargo | Personal interno | Supabase `profiles` | Acceso y operación | Mientras dure la relación |
| Razón social, NIT/cédula, dirección, ciudad | Proveedores/clientes | Supabase `providers` | Vinculación y pagos | Vinculación + conservación contable |
| RUT, cédula, cámara de comercio, certificación bancaria | Proveedores | Google Drive (carpeta privada) + `provider_documents` | Validación documental | Se eliminan al borrar la cuenta |
| Facturas, cuentas de cobro, soportes | Proveedores | Google Drive + `provider_invoices` | Pagos y contabilidad | **Se conservan anonimizadas** (obligación contable) |
| Aceptación de Términos / datos (fecha y versión) | Proveedores | `providers.terms_accepted_at`, `terms_version` | Evidencia de consentimiento | Con el registro |
| IP (solo contador de rate limit) | Visitantes | `api_rate_limits` (clave temporal) | Anti-abuso | ≤ 24 h (limpieza automática) |
| Contraseña | Todos | Supabase Auth (hash bcrypt) | Autenticación | Mientras exista la cuenta |

No se recopilan: ubicación, cámara, micrófono, notificaciones push ni cookies de analítica/publicidad.
Cookies/almacenamiento: solo cookies de sesión de Supabase (necesarias) y `localStorage` para filtros de proyectos.

## 2. Terceros / SDKs

| Tercero | Para qué | Datos que recibe | Notas |
|---------|----------|------------------|-------|
| Supabase | BD, Auth | Todos los datos de la app | RLS en todas las tablas |
| Vercel | Hosting y cron | Tráfico, logs de ejecución | Logs sin datos personales (PRP-001) |
| Google Drive (service account) | Documentos | RUT, cédulas, facturas | Carpetas privadas; acceso vía `/api/documents/view` |
| Gmail SMTP (nodemailer) | Correos transaccionales | Correo y contenido de la notificación | Remitente `NOTIFICATION_FROM_EMAIL` |
| Sentry (opcional, si hay DSN) | Errores | Stack traces; sin cuerpos de petición ni cookies | PII desactivado por defecto |

## 3. Consentimiento

- Registro de proveedor: casilla obligatoria de **Términos de uso + Política de Tratamiento de Datos** (validada en servidor, se guarda fecha y versión).
- Si se añaden analíticas o cookies no esenciales: banner de consentimiento (Termly/Cookiebot) **antes** de cargar el script.
- Si se añade geolocalización/cámara/notificaciones: pedir permiso en el momento exacto en que la función se necesite.

## 4. Derechos del titular

- Acceso/rectificación: Portal → Perfil.
- Supresión: Portal → Ajustes → "Eliminar mi cuenta" (`POST /api/account/delete`).
- Reclamos: administrativo@fonneta.com.
