/**
 * Revoca los permisos públicos ("cualquier persona con el enlace") de TODO el árbol de
 * Google Drive de Fonneta. Hasta ahora la app creaba carpetas y archivos con permiso
 * `anyone: reader`; desde PRP-001 los documentos se sirven por /api/documents/view.
 *
 * Uso (dry-run por defecto; no cambia nada):
 *   npx tsx scripts/revoke-drive-public.ts
 * Aplicar cambios:
 *   npx tsx scripts/revoke-drive-public.ts --apply
 *
 * Requiere GOOGLE_SERVICE_ACCOUNT_KEY y GOOGLE_DRIVE_ROOT_FOLDER_ID en .env.local.
 * EJECUTAR SOLO DESPUÉS de desplegar la versión que usa /api/documents/view,
 * o los enlaces antiguos dejarán de abrir para el personal.
 */
import { config } from 'dotenv';
import { google, type drive_v3 } from 'googleapis';

config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');

function getDrive(): drive_v3.Drive {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY no está definido');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(key),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function listChildren(drive: drive_v3.Drive, parentId: string): Promise<drive_v3.Schema$File[]> {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    files.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return files;
}

async function revokePublic(drive: drive_v3.Drive, file: drive_v3.Schema$File): Promise<boolean> {
  const res = await drive.permissions.list({
    fileId: file.id!,
    fields: 'permissions(id, type, role)',
    supportsAllDrives: true,
  });
  const publicPerms = (res.data.permissions ?? []).filter((p) => p.type === 'anyone');
  if (publicPerms.length === 0) return false;

  for (const perm of publicPerms) {
    if (APPLY) {
      await drive.permissions.delete({ fileId: file.id!, permissionId: perm.id!, supportsAllDrives: true });
    }
  }
  return true;
}

const CONCURRENCY = 8;

async function inChunks<T>(items: T[], size: number, task: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(task));
  }
}

async function main(): Promise<void> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID no está definido');

  const drive = getDrive();
  const queue: string[] = [rootId];
  let scanned = 0;
  let publicFound = 0;

  while (queue.length > 0) {
    const folderId = queue.shift()!;
    const children = await listChildren(drive, folderId);

    await inChunks(children, CONCURRENCY, async (file) => {
      scanned++;
      if (await revokePublic(drive, file)) publicFound++;
      if (file.mimeType === 'application/vnd.google-apps.folder') queue.push(file.id!);
    });

    if (scanned % 100 < children.length) {
      console.log(`... revisados ${scanned}, con enlace público ${publicFound}, carpetas pendientes ${queue.length}`);
    }
  }

  console.log(`Elementos revisados: ${scanned}`);
  console.log(`Con enlace público: ${publicFound}`);
  console.log(APPLY ? 'Permisos públicos REVOCADOS.' : 'Dry-run: no se cambió nada. Usa --apply para revocar.');
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
