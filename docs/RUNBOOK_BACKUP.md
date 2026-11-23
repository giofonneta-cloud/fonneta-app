# Runbook: backups y restauración

## Estado esperado

| Capa | Mecanismo | Verificación |
|------|-----------|--------------|
| Base de datos | Backups de Supabase (diarios en plan Pro; PITR opcional) **+** copia nocturna `pg_dump` cifrada (`.github/workflows/backup.yml`) | Dashboard → Database → Backups |
| Documentos | Google Drive (versionado de Drive; papelera 30 días) | Drive → Papelera |
| Código | GitHub | — |

> El plan Free de Supabase **no incluye backups descargables**. Si el proyecto está en Free, el workflow de `pg_dump` es la única copia: configúralo.

## Configurar la copia nocturna (una vez)

1. Supabase → Project Settings → Database → *Connection string* (modo Session pooler, puerto 5432).
2. GitHub → Settings → Secrets and variables → Actions:
   - `SUPABASE_DB_URL` = cadena de conexión con la contraseña.
   - `BACKUP_PASSPHRASE` = frase larga (guárdala también en tu gestor de contraseñas).
3. Lanza el workflow "Backup nocturno" manualmente una vez y confirma que genera el artefacto.

## Prueba de restauración (hacer trimestralmente)

1. Descargar el artefacto `db-backup-*.sql.gpg` del run y descifrar:
   `gpg --batch --passphrase "$BACKUP_PASSPHRASE" -o backup.sql -d db-backup-AAAA-MM-DD.sql.gpg`
2. Crear una **branch de Supabase** o un proyecto temporal (nunca restaurar sobre producción para probar).
3. `psql "$TEMP_DB_URL" -f backup.sql`
4. Verificar: conteo de `profiles`, `providers`, `gastos`, `ventas` coincide con producción; login de un usuario de prueba funciona.
5. Eliminar el proyecto temporal y el `.sql` descifrado. Anotar fecha y resultado abajo.

| Fecha | Quién | Resultado |
|-------|-------|-----------|
| _pendiente_ | | |

## Recuperación ante borrado accidental

- Fila(s) concretas: restaurar desde el último backup a una branch y copiar con `INSERT … SELECT`.
- Tabla completa / corrupción: PITR (si está activo) al minuto anterior al incidente; si no, último dump.
- Archivos de Drive: recuperar de la papelera (30 días).
