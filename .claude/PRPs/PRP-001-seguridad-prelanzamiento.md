# PRP-001: Seguridad y verificación pre-lanzamiento de Fonneta

> Origen: auditoría del 2026-11-23 (7 bloques). Dueño del requisito: Gio (giofonneta).
> Objetivo: que la app y los datos queden realmente seguros. Estado: **PENDIENTE DE APROBACIÓN**.

## Hallazgos de partida (evidencia)

| ID | Hallazgo | Evidencia |
|----|----------|-----------|
| H1 | Token de GitHub en la URL del remoto git | `git remote -v` |
| H2 | `.env.production` versionado (VERCEL_OIDC_TOKEN); posible service role key en `SETUP_GUIDE.md:62` | `git ls-files`, `git grep` |
| H3 | `create-profile` acepta `role` del cliente, sin sesión | `src/app/api/create-profile/route.ts` |
| H4 | `delete-auth-user`, `create-auth-user`, `providers/create`, `upload-document` sin sesión | `src/app/api/providers/*` |
| H5 | `send-email`, `send-approval-email`, `send-invitation` sin sesión (SMTP abierto + datos de facturas) | `src/app/api/send-email`, `providers/send-*` |
| H6 | `profiles`: SELECT público (246 filas visibles para `anon`) y UPDATE propio sin `WITH CHECK` ni trigger → escalada de rol | `pg_policies`, consulta con rol `anon` |
| H7 | `provider_documents`: políticas `*_public` con `true` (664 filas, CRUD anónimo) | `pg_policies` |
| H8 | Vista `gastos_con_entregables` SECURITY DEFINER: 468 gastos legibles por `anon` | advisor + consulta `anon` |
| H9 | `ventas` y `gastos`: `USING true` para cualquier autenticado; 243 de 246 usuarios son `proveedor` | `pg_policies`, `profiles` |
| H10 | Bucket `providers` público, sin límite de tamaño ni MIME | `storage.buckets` |
| H11 | 5 funciones SECURITY DEFINER ejecutables por `anon`, 17 por `authenticated` | advisor |
| H12 | Protección de contraseñas filtradas desactivada | advisor |
| H13 | `npm audit`: 25 vulns (2 críticas: `next`, `proxy-addr`); `xlsx` sin parche | `npm audit --omit=dev` |
| H14 | Sin tests, sin CI, sin Sentry/uptime, sin rate limiting, sin cabeceras de seguridad | revisión de repo |
| H15 | Sin Términos de uso, sin checkbox de aceptación, sin borrado de cuenta, sin LICENSE/créditos | revisión de repo |
| H16 | `experimental.mcpServer: true` en `next.config.ts`; `console.log` de correos/roles en `proxy.ts` | código |

## Restricciones descubiertas (condicionan el orden)

- `/register/provider` es **público**: `ProviderOnboarding.tsx` llama desde el navegador, sin sesión, a `create-auth-user` → `create-profile` → `providers/create` → `upload-document` y, si falla, a `delete-auth-user` (rollback). **No se pueden cerrar esas rutas hasta que exista un reemplazo servidor-a-servidor.** Ya existe `src/lib/providers/provisionProviderAccess.ts` que puede servir de base.
- `get_user_email_by_document` devuelve el email sintético `{nit}@fonneta.com` para cualquier NIT existente: permite enumerar proveedores (aceptado por ahora, mitigar con rate limit).
- La app tiene permisos granulares (`user_app_roles`, `user_has_permission`) y proveedores con permiso `quotes.view` / legalizaciones acceden a rutas de `/dashboard`. Las políticas nuevas de finanzas NO pueden ser simplemente `role <> 'proveedor'` sin revisar esto.
- El bucket `providers` no aparece en ningún `storage.from(...)` del código (los documentos van a Google Drive). Verificar si tiene objetos antes de hacerlo privado.

## Decisiones que necesito del humano (bloquean fases concretas)

1. ¿El repo `giofonneta-cloud/fonneta-app` es privado? (decide si hay que purgar el historial git).
2. ¿Qué roles deben ver y editar Ventas/Gastos/CXC/CXP/OC? Propuesta: `admin`, `pm`, `administrativo` + quien tenga el permiso granular correspondiente. (Fase 2)
3. ¿Plan de Supabase actual (Free/Pro)? Define si hay backups diarios/PITR o hay que montar un dump propio. (Fase 5)
4. ¿Autorizas crear cuenta en Sentry y UptimeRobot (planes gratuitos)? (Fase 5)
5. Política de borrado de cuenta: propuesta = **anonimizar** (no borrar) los registros contables ligados al usuario, por obligaciones de conservación contable; borrar documentos, perfil y acceso. Confirmar con tu contador/abogado.

---

## FASE 0 — Contención (acciones del humano, 30–60 min) — BLOQUEANTE

Yo no puedo ni debo hacerlas por ti (credenciales de tus cuentas).

- [ ] Revocar el token `ghp_r2IH…` en GitHub → Settings → Developer settings → Tokens.
- [ ] Rotar en Supabase: service_role key (y regenerar JWT si es posible), `SUPABASE_ACCESS_TOKEN`.
- [ ] Rotar contraseña SMTP (Gmail app password) y `CRON_SECRET`.
- [ ] Rotar la clave de la service account de Google (Drive) y revisar con quién está compartida la carpeta raíz.
- [ ] Revocar/regenerar `VERCEL_OIDC_TOKEN` y actualizar variables en Vercel (Production + Preview).
- [ ] Revisar en Supabase → Auth → Users y `profiles` si hay usuarios `admin`/`pm` que no reconozcas (solo hay 2 admin y 1 pm hoy). Revisar logs de Auth por llamadas sospechosas a `create-profile`.

**Yo hago (tras tu confirmación):**
- [ ] `git remote set-url origin https://github.com/giofonneta-cloud/fonneta-app.git` (sin token).
- [ ] `git rm --cached .env.production`; añadir `.env.production` y `.env*.check` al `.gitignore`.
- [ ] Reemplazar la clave real de `SETUP_GUIDE.md` por un placeholder.
- [ ] Si el repo NO es privado (decisión 1): purgar historial con `git filter-repo` y force-push (requiere tu OK explícito, es destructivo).
- [ ] Mover las variables a Vercel env; dejar solo `.env.local.example` en el repo.

**Verificación:** `git grep -nE "eyJ|sbp_|ghp_|BEGIN PRIVATE"` sin resultados; `git remote -v` limpio; la app sigue desplegando con las claves nuevas.

---

## FASE 1 — Endurecimiento de BD que NO rompe la app (migración 1)

Migración: `supabase/migrations/20261123_01_security_hardening_safe.sql`. Se aplica primero en una **branch de Supabase** (MCP `create_branch`), se prueba y luego se hace `merge_branch`.

1. **H7** — `DROP POLICY provider_docs_{select,insert,update,delete}_public`. Ya existe `Staff or provider owner can manage docs`; el código solo accede vía API con service role o sesión del dueño.
2. **H8** — `ALTER VIEW gastos_con_entregables SET (security_invoker = true)`. Con esto la vista respeta RLS de `gastos`. Revisar las demás vistas.
3. **H6a** — Blindar `role`: `REVOKE UPDATE (role) ON profiles FROM authenticated, anon` (más trigger `BEFORE UPDATE` que rechace cambios de `role` si el llamante no es admin según `auth.uid()`, como defensa en profundidad). Eliminar la política duplicada `Users can update own profile.` (rol `public`, sin check). `admin/update-user` sigue funcionando porque usa service role.
4. **H6b** — Eliminar `profiles_insert_own` o forzar `role = 'proveedor'`/`'usuario'` en `WITH CHECK`; el alta legítima pasa por el servidor.
5. **H11** — `REVOKE EXECUTE … FROM anon, public` en las 5 funciones; `SET search_path = public` en las 3 con search_path mutable. Para las 17 de `authenticated`: revisar una a una que validen internamente `auth.uid()`/rol (`legalizacion_aprobar`, `anticipo_marcar_pagado`, `anticipo_decidir`, `completar_proyecto(p_user_id)` → no confiar en `p_user_id` del cliente). Las funciones de trigger (`handle_new_server`, `*_notificar_*`, `*_sync_*`) se revocan completamente.
6. **H10** — Verificar objetos en el bucket `providers`; si está vacío o sin uso → `public = false`, `file_size_limit = 10MB`, `allowed_mime_types = {pdf, png, jpeg}`.
7. **H12** — Activar *Leaked password protection* (Dashboard → Auth → Providers → Password) y subir longitud mínima a 10.

**Verificación (automatizable con MCP `execute_sql`, rol `anon` y rol `authenticated`-proveedor simulados con `set local role` + `request.jwt.claims`, siempre dentro de `begin … rollback`):**
- `anon` → 0 filas en `profiles`, `provider_documents`, `gastos_con_entregables`.
- Un proveedor NO puede `update profiles set role='admin'` (error esperado).
- `get_advisors(security)` ya no lista H8, H11-anon ni el search_path.

**Rollback:** migración inversa guardada junto a la primera (`…_01_rollback.sql`).

---

## FASE 2 — Cierre de las APIs y RLS de finanzas

Esta fase tiene dependencias: primero el reemplazo, luego el cierre.

### 2.1 Guard común de API (`src/lib/auth/guard.ts`)
- `requireUser()`: `createServerClient().auth.getUser()` → 401 si no hay sesión.
- `requireRole(roles[])` y `requirePermission(perm)`: usa `profiles.role` y `user_has_permission` → 403.
- `requireCron()`: compara `Authorization: Bearer ${CRON_SECRET}` con `timingSafeEqual`.
- `parseBody(schema)`: Zod; respuestas de error genéricas (no devolver `error.message` de Supabase/Drive/SMTP).
- Test unitario de cada helper (AAA).

### 2.2 Nuevo registro de proveedor 100 % servidor
- Crear `POST /api/providers/register` (público, **único** endpoint anónimo de escritura). Hace en el servidor y en una sola petición: validar con Zod → crear usuario Auth con `role` **fijo** `proveedor` → perfil → `providers` → subir documentos a Drive → rollback interno si algo falla. Reutiliza `provisionProviderAccess.ts`.
- Protecciones: rate limit por IP + por NIT (Upstash Redis vía Vercel Marketplace, o tabla `rate_limits` en Supabase si prefieres no sumar proveedor), Cloudflare Turnstile en el formulario, límite de tamaño y lista blanca de MIME en archivos, `documentNumber` normalizado.
- Refactor de `ProviderOnboarding.tsx` para llamar solo a este endpoint.

### 2.3 Cerrar/arreglar cada ruta
| Ruta | Acción |
|------|--------|
| `create-profile` | **Eliminar** (lo cubre `register` + trigger de perfiles) |
| `providers/create-auth-user` | **Eliminar** |
| `providers/delete-auth-user` | **Eliminar** del cliente; rollback pasa a ser interno |
| `providers/create` (POST/PATCH) | `requireRole(admin, administrativo)` o dueño del `providerId` verificando `providers.user_id = user.id` |
| `providers/upload-document` | `requireUser` + dueño/staff; o absorbida por `register` |
| `send-email`, `send-approval-email` | `requireRole(admin, administrativo)`; destinatario **fijo** a contabilidad desde env, nunca del body; datos de factura leídos por servidor y verificando que `invoiceId` pertenezca a `providerId`. Consolidar en una sola (borrar la legacy). |
| `send-invitation` | `requireRole(admin, administrativo)` + rate limit |
| `invoice-status-change` | `requireRole` + `createAdminClient()`; hoy solo hace `console.log`, evaluar eliminarla |
| `cxc/send-reminders` | Ya valida cron o usuario: confirmar que el usuario sea staff, no cualquier autenticado |
| `purchase-orders/*`, `quotes/send`, `release-documents/archive`, `upload/*` | Auditar rol + propiedad del recurso (IDOR): ¿un proveedor puede pasar el `id` de otro? |
| `admin/update-user` | Whitelist de campos en `updates` (hoy acepta cualquier columna); impedir que un admin se quite el último admin |

### 2.4 RLS de finanzas (migración 2: `20261123_02_finance_rls.sql`)
- Crear `public.is_staff()` (SECURITY DEFINER, `search_path` fijo, `STABLE`) = rol en `admin, pm, administrativo` **o** `user_has_permission('finance.view')` según decisión 2.
- Reemplazar `USING true` de `ventas`, `gastos`, `gasto_entregables`, `invoices`, `purchase_orders(+items)`, `cxc_seguimiento`, `tarifario`, `comerciales`, `marcas`, `productos`, `system_config`, `audit_logs`, etc. por `is_staff()` (lectura) y roles de escritura más estrictos (borrado solo admin).
- Proveedores conservan acceso solo a lo propio (`providers`, `provider_invoices`, `provider_documents`, sus legalizaciones/anticipos).
- `profiles` SELECT: staff ve todos; el resto solo el suyo (+ `chat` si requiere nombres: crear vista `profiles_public(id, full_name)` limitada a staff).

### 2.5 Verificación fase 2
- Matriz E2E (ver Fase 6): anónimo / proveedor / pm / administrativo / admin × cada endpoint y tabla → 401/403/200 esperado.
- Prueba manual con Playwright MCP del flujo completo de registro de proveedor, login por NIT, subir factura, aprobar factura (correo llega a contabilidad), orden de compra, cotización, legalización.
- `npm run typecheck` + `npm run build` local antes de push (regla de CLAUDE.md).

**Riesgo principal:** que una política nueva oculte datos a un rol legítimo. Mitigación: aplicar en branch de Supabase, recorrer la matriz de roles, y desplegar en horario de baja actividad con la migración de rollback lista.

---

## FASE 3 — Endurecimiento de plataforma

- [ ] `npm audit fix` (next, zod, ws, proxy-addr, sharp…) → `npm run build` y prueba; actualizar `next` a la última 16.x parcheada.
- [ ] Sustituir `xlsx` por `exceljs` (o aislar su uso: solo parsear archivos de staff, nunca de proveedores).
- [ ] Cabeceras en `next.config.ts` → `headers()`: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (cámara/geo/mic desactivados), y CSP (empezar en `Content-Security-Policy-Report-Only`).
- [ ] `experimental.mcpServer` solo en desarrollo.
- [ ] Quitar `console.log` con emails/roles del `proxy.ts` y otros 32 (logger con niveles, sin PII).
- [ ] Proxy: añadir verificación de `/api/*` (401 por defecto salvo lista blanca `register`, cron con secreto).
- [ ] Restringir `Authorization` de CRON_SECRET y verificar `NEXT_PUBLIC_*` (solo URL y anon key).
- [ ] Dependabot + Gitleaks en GitHub Actions (`.github/workflows/security.yml`): `npm audit --omit=dev`, `gitleaks`, `typecheck`, `build`.
- [ ] Supabase Auth: redirect URLs solo `fonneta-app.vercel.app`, JWT expiry 1 h, refresh rotation activado, confirmación de email revisada.

**Verificación:** `securityheaders.com` ≥ A; `npm audit --omit=dev` sin high/critical; OWASP ZAP baseline contra preview.

---

## FASE 4 — Legal, consentimiento y propiedad intelectual

- [ ] **Términos de uso**: `src/app/terminos/page.tsx` (borrador generado con TermsFeed/iubenda-style; **revisión legal tuya**). Incluir uso aceptable, responsabilidad, carga de documentos y canal de reporte (`contacto` + enlace "Reportar" en documentos).
- [ ] **Checkbox** de aceptación de Términos + Política de privacidad en `/register/provider` (obligatorio, con timestamp guardado en `providers.terms_accepted_at` y versión).
- [ ] **Política de privacidad** (`/politica-privacidad`, ya existe): revisar que mencione Habeas Data (Ley 1581/2012), terceros (Supabase, Vercel, Google Drive, SMTP), finalidades, retención y derechos ARCO.
- [ ] **Borrado de cuenta**: ruta `/portal/cuenta` con "Eliminar mi cuenta" → `POST /api/account/delete` (sesión obligatoria, reautenticación con contraseña): borra archivos en Drive, anonimiza `providers`/`profiles`, conserva registros contables anonimizados, elimina el usuario Auth. Para staff: solo admin lo hace desde el panel. (Decisión 5.)
- [ ] **Inventario de datos y terceros**: `docs/DATA_INVENTORY.md` (qué datos, dónde, base legal, retención, terceros/SDKs).
- [ ] **Consentimiento**: la app hoy no usa cookies de terceros, geolocalización, cámara ni notificaciones. Si se añaden analíticas (Vercel Analytics, etc.), poner banner (Termly/Cookiebot) antes de cargarlas. Documentarlo.
- [ ] **Licencias**: `npx license-checker --production --summary`; marcar GPL/AGPL/"UNLICENSED"; crear `/creditos` con atribuciones (Radix, lucide, recharts, Next, etc.) y `THIRD_PARTY_LICENSES.md`; revisar licencia de `html2pdf.js`, fuentes (Google Fonts → OFL) y de `Logo fucsia y soho.png` y demás assets (confirmar que son tuyos). Añadir `LICENSE` propio (propietario) al repo.

**Verificación:** registro sin marcar checkbox es rechazado en cliente **y** servidor; el borrado de cuenta de un proveedor de prueba deja 0 PII y no rompe reportes financieros.

---

## FASE 5 — Backups, monitorización y alertas

- [ ] **Backups** (decisión 3): si Pro → activar PITR/backups diarios y **hacer una restauración de prueba** en una branch; si Free → GitHub Action nocturna con `pg_dump` cifrado (y `storage`/Drive), retención 30 días, en un destino fuera de Supabase. Documentar el runbook de restauración (`docs/RUNBOOK_BACKUP.md`).
- [ ] **Sentry** (`@sentry/nextjs`): errores de cliente, servidor y API routes; scrubbing de PII; alertas por email a Gio.
- [ ] **UptimeRobot** (o Better Stack): monitores sobre `/login`, `/api/health` (nuevo, sin datos sensibles) y el cron semanal de CXC (heartbeat).
- [ ] Alertas de Vercel (fallos de build/deploy) y de Supabase (CPU/conexiones, errores de Auth).
- [ ] Log de auditoría: confirmar que `audit_logs` captura cambios de rol, borrados y aprobaciones.

**Verificación:** provocar un error controlado y recibir alerta; apagar el endpoint de salud en preview y recibir aviso de caída; restauración de prueba completada con éxito.

---

## FASE 6 — Pruebas y compatibilidad

- [ ] Instalar Vitest (unitarias: guard, validadores Zod, utilidades de periodo/KPIs) y Playwright (E2E).
- [ ] **Suite de seguridad E2E** (la más importante): usuarios de prueba `proveedor`, `administrativo`, `admin`; verificar para cada ruta `/api/*` y cada tabla clave los códigos 401/403/200; intento de escalada de rol; IDOR entre dos proveedores; subida de archivo con MIME no permitido; rate limit del registro.
- [ ] **E2E funcionales**: registro de proveedor, login, factura, aprobación + correo, OC, cotización, legalización.
- [ ] **Compatibilidad**: proyectos Playwright `chromium`, `firefox`, `webkit` (Safari) + emulación iPhone 14; prueba real en un iPhone (PDF con `html2pdf.js`, subida de archivos, tablas redimensionables).
- [ ] **Lighthouse** CI (rendimiento, accesibilidad, buenas prácticas) en `/login` y `/register/provider`.
- [ ] CI en GitHub Actions: typecheck + lint + unit + E2E contra preview de Vercel en cada PR.

**Criterio de salida:** suite verde en CI y 0 hallazgos críticos en Lighthouse/ZAP.

---

## FASE 7 — Cierre

- [ ] Re-auditar los 7 bloques y entregar el informe Cumple/Pendiente/Riesgo con evidencia.
- [ ] Re-ejecutar `get_advisors` (security + performance) → sin ERROR/WARN relevantes.
- [ ] Actualizar `CLAUDE.md` con las reglas de Auto-Blindaje de abajo y `MEMORY.md`.
- [ ] Documentar en `CHANGELOG.md` y `README.md` (variables requeridas, runbooks).

## Auto-Blindaje a registrar al terminar (CLAUDE.md)

- Todo `route.ts` en `/api` llama a `requireUser/requireRole/requireCron` o está en la lista blanca documentada de endpoints públicos.
- Nunca recibir `role`, `userId` ni destinatarios de correo desde el cliente.
- Ninguna política RLS con `USING true` para `anon`/`public`; en tablas de negocio, `is_staff()`.
- Toda vista nueva con `security_invoker = true`; toda función SECURITY DEFINER con `search_path` fijo y `REVOKE EXECUTE … FROM anon, public`.
- No versionar `.env*` salvo `.env.local.example`; ejecutar Gitleaks antes de cada push.
- Todo cambio de RLS se prueba primero en branch de Supabase con la matriz de roles.

## Orden de ejecución y dependencias

```
F0 (humano) ─► F1 ─► F2.1 ─► F2.2 ─► F2.3 ─► F2.4 ─► F6 (matriz de roles) ─► deploy
                  └► F3 en paralelo ─► F4 ─► F5 ─► F7
```
- F2.3 (cerrar rutas) **no se despliega** antes de F2.2 (nuevo registro) o se rompe el alta de proveedores.
- F2.4 (RLS de finanzas) **no se aplica en producción** sin haber pasado la matriz de roles en branch.

## Qué NO haré sin tu confirmación explícita

Aplicar migraciones en producción, force-push/purga de historial, borrar rutas de producción, crear cuentas en servicios externos, o enviar correos de prueba reales.
