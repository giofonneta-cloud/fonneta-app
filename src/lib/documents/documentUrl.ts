/**
 * Utilidades para URLs de documentos almacenados en Google Drive o en el
 * bucket `providers` de Supabase. Seguras para cliente y servidor.
 */

const DRIVE_HOSTS = ['drive.google.com', 'docs.google.com'];

export type DocumentTarget =
  | { kind: 'drive'; fileId: string }
  | { kind: 'storage'; bucket: string; path: string };

export function parseDocumentUrl(rawUrl: string, supabaseUrl?: string): DocumentTarget | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;

  if (DRIVE_HOSTS.includes(url.hostname)) {
    const pathMatch = url.pathname.match(/\/d\/([A-Za-z0-9_-]{10,})/);
    const id = pathMatch?.[1] ?? url.searchParams.get('id');
    return id && /^[A-Za-z0-9_-]{10,}$/.test(id) ? { kind: 'drive', fileId: id } : null;
  }

  if (supabaseUrl && url.hostname === new URL(supabaseUrl).hostname) {
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (match) return { kind: 'storage', bucket: match[1], path: decodeURIComponent(match[2]) };
  }

  return null;
}

/** ¿Es una URL de documento que debe servirse a través de la app? */
export function isManagedDocumentUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    if (DRIVE_HOSTS.includes(hostname)) return true;
    return pathname.startsWith('/storage/v1/object/') && hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

/**
 * Convierte la URL almacenada en una URL de la app que valida sesión y
 * propiedad antes de entregar el archivo. Las URLs externas se dejan igual.
 */
export function secureDocUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return isManagedDocumentUrl(url) ? `/api/documents/view?u=${encodeURIComponent(url)}` : url;
}
