/**
 * Reglas de propiedad de archivos de Drive / Storage, independientes de las URLs guardadas
 * en la BD (que un usuario podría falsificar apuntándolas a archivos ajenos).
 * La autorización se ata a la UBICACIÓN REAL del archivo.
 */

/** Cadena de nombres de Drive desde el archivo hacia arriba (sin la raíz de la app). */
export type DriveNames = readonly string[];

const PROVIDERS_FOLDER = 'Proveedores';
const LEGALIZACIONES_FOLDER = 'Legalizaciones';

/**
 * ¿La carpeta cuelga de Proveedores/ y su nombre corresponde al NIT del proveedor?
 * Acepta `NIT_Razón` (formato actual) y `SIN-NIT_NIT` (carpetas creadas por upload/provider-document).
 */
function matchesProviderFolder(folderName: string, documentNumber: string): boolean {
  return folderName.startsWith(`${documentNumber}_`) || folderName === `SIN-NIT_${documentNumber}`;
}

export interface DriveOwnershipContext {
  userId: string;
  /** document_number de los proveedores cuyo user_id es el usuario */
  providerDocumentNumbers: readonly string[];
}

export function userOwnsDriveFile(names: DriveNames, ctx: DriveOwnershipContext): boolean {
  // Archivos bajo Proveedores/<carpeta-del-proveedor>/...
  const providersIndex = names.lastIndexOf(PROVIDERS_FOLDER);
  if (providersIndex > 0 && providersIndex === names.length - 1) {
    const providerFolder = names[providersIndex - 1];
    if (ctx.providerDocumentNumbers.some((doc) => doc && matchesProviderFolder(providerFolder, doc))) {
      return true;
    }
  }

  // Soportes de legalización: Legalizaciones/<fecha>/soporte_<uid8>_<ts>.<ext>
  const last = names[names.length - 1];
  if (last === LEGALIZACIONES_FOLDER && names[0]?.startsWith(`soporte_${ctx.userId.slice(0, 8)}_`)) {
    return true;
  }

  return false;
}

/** Objetos de Storage: la primera carpeta tras `documents/` es el id de usuario o de proveedor. */
export function userOwnsStoragePath(path: string, allowedIds: readonly string[]): boolean {
  const [root, owner] = path.split('/');
  return root === 'documents' && Boolean(owner) && allowedIds.includes(owner);
}
