# Seguridad de Fonnetapp

> Resumen vivo de controles y riesgos aceptados. Origen: PRP-001 (auditoría 2026-11-23).

## Controles vigentes

- **Autenticación/rol en servidor:** `src/lib/auth/guard.ts` (`requireUser/requireStaff/requireAdmin/hasValidCronSecret`). Todo `route.ts` de `/api` lo usa, o figura en la lista blanca pública de `src/lib/supabase/proxy.ts` (`register`, `send-reminders` con `CRON_SECRET`, `health`). El proxy devuelve 401 a cualquier `/api/*` sin sesión que no esté en la lista.
- **El rol nunca viene del cliente.** Registro de proveedor 100 % servidor (`/api/providers/register`); `profiles.role` protegido por trigger (`profiles_protect_privileged_columns`) y por RLS.
- **RLS en todas las tablas.** Helpers `is_admin()`/`is_staff()`. Finanzas (`ventas`, `gastos`, `cxc_seguimiento`) y proyectos solo para personal interno. Vista `gastos_con_entregables` con `security_invoker`.
- **Funciones SECURITY DEFINER:** `search_path` fijo y sin `EXECUTE` para `anon`.
- **Documentos:** Drive y bucket `providers` privados; se sirven por `/api/documents/view` tras validar sesión y propiedad. Subidas validadas por firma real del archivo (no solo MIME) y límite de 10 MB.
- **Rate limiting persistente** (`api_rate_limits` + `rate_limit_hit`): registro (5/h por IP, 3/h por NIT), invitaciones, borrado de cuenta.
- **Cabeceras:** HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy y CSP en modo Report-Only.
- **Contraseñas:** mínimo 10 caracteres (servidor), hash gestionado por Supabase Auth.
- **Sin PII en logs** (proxy, invitaciones, órdenes de compra, email service).
- **CI:** Gitleaks, typecheck, pruebas, build, `npm audit`; Dependabot semanal.

## Riesgos aceptados / pendientes

| Riesgo | Motivo | Mitigación |
|--------|--------|------------|
| `xlsx` (SheetJS) sin parche en npm | Solo se usa para **escribir** el Excel de exportación (`ProvidersList.tsx`); las vulnerabilidades afectan al **parseo** de archivos no confiables | No importar archivos con `xlsx.read`; revisar si se publica la versión parcheada |
| CSP en Report-Only | Next.js inyecta scripts inline | Revisar consola, ajustar y promover a `Content-Security-Policy` |
| `get_user_email_by_document` | Ya no es ejecutable por `anon`/`authenticated` | — |
| Enumeración de correos en registro (409 "ya registrado") | Necesario para guiar al usuario | Rate limit por IP y por NIT |

## Acciones manuales (no automatizables desde el código)

1. Supabase → Auth → **Sign In / Providers → desactivar "Allow new users to sign up"** (los usuarios los crea un admin o el endpoint de registro).
2. Supabase → Auth → Password → **activar "Leaked password protection"** y longitud mínima 10.
3. Supabase → Auth → URL Configuration: solo `https://fonneta-app.vercel.app` como Site URL / redirects.
4. Rotar claves expuestas históricamente (token GitHub, service role, SMTP, service account de Google, OIDC de Vercel).
5. Crear cuentas de Sentry y UptimeRobot y cargar `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` en Vercel; monitor sobre `/api/health`.
6. Configurar `SUPABASE_DB_URL` y `BACKUP_PASSPHRASE` en GitHub Actions (ver `RUNBOOK_BACKUP.md`).

## Reglas para código nuevo (Auto-Blindaje)

- Toda ruta `/api` nueva: guard al inicio + validación Zod + sin `error.message` crudo al cliente.
- Nunca aceptar `role`, `userId` ni destinatarios de correo desde el cliente.
- Política RLS nueva: nunca `USING (true)` para `anon`/`public`; en tablas de negocio, `is_staff()`.
- Vista nueva: `security_invoker = true`. Función `SECURITY DEFINER`: `SET search_path` + `REVOKE EXECUTE … FROM anon, public`.
- No versionar `.env*` salvo `.env.local.example`. Ejecutar la suite `npm run test:e2e` antes de desplegar.
