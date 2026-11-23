import { google } from 'googleapis';
import { Readable } from 'stream';

/** Escapa un valor para usarlo dentro de una consulta `q` de Drive (entre comillas simples). */
function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
}

export interface ProviderFolders {
  documentsFolder: string;
  invoicesFolder: string;
}

export class DriveStorageService {
  private drive;
  private rootFolderId: string;

  constructor() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
    }

    if (!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable is required');
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  }

  /**
   * Buscar carpeta por nombre dentro de un parent
   */
  private async findFolder(name: string, parentId: string): Promise<string | null> {
    try {
      const response = await this.drive.files.list({
        q: `name='${escapeDriveQueryValue(name)}' and '${escapeDriveQueryValue(parentId)}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const folders = response.data.files || [];
      return folders.length > 0 ? folders[0].id! : null;
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  }

  /**
   * Crear carpeta en Google Drive
   */
  private async createFolder(name: string, parentId: string): Promise<string> {
    try {
      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
        supportsAllDrives: true,
      });

      // Las carpetas son privadas: el acceso a los documentos se sirve desde la app
      // (/api/documents/view) tras validar sesión y propiedad.
      return response.data.id!;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${name}`);
    }
  }

  /**
   * Obtener o crear carpeta con formato YYYYMMDD dentro de un parent
   */
  async getOrCreateDateFolder(parentId: string): Promise<string> {
    const now = new Date();
    const dateString = now.getFullYear().toString() + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + 
                      now.getDate().toString().padStart(2, '0');
    
    let dateFolder = await this.findFolder(dateString, parentId);
    if (!dateFolder) {
      dateFolder = await this.createFolder(dateString, parentId);
    }
    return dateFolder;
  }

  /**
   * Obtener o crear carpeta con nombre arbitrario dentro de un parent
   * (a diferencia de getOrCreateDateFolder, que fija el nombre a YYYYMMDD)
   */
  async getOrCreateNamedFolder(name: string, parentId: string): Promise<string> {
    let folder = await this.findFolder(name, parentId);
    if (!folder) {
      folder = await this.createFolder(name, parentId);
    }
    return folder;
  }

  /**
   * Obtener o crear una carpeta directamente bajo la carpeta raíz de la app
   */
  async getOrCreateRootFolder(name: string): Promise<string> {
    return this.getOrCreateNamedFolder(name, this.rootFolderId);
  }

  /**
   * Obtener o crear estructura de carpetas para un proveedor
   * Estructura: Fonneta/Proveedores/{NIT_NOMBRE}/Documentos e Invoices
   */
  async getOrCreateProviderFolders(providerId: string, providerName: string, providerNIT?: string): Promise<ProviderFolders> {
    try {
      // 1. Buscar o crear carpeta "Proveedores"
      let proveedoresFolder = await this.findFolder('Proveedores', this.rootFolderId);
      if (!proveedoresFolder) {
        proveedoresFolder = await this.createFolder('Proveedores', this.rootFolderId);
      }

      // 2. Construir nombre de carpeta: [NIT]_[NOMBRE]
      // Sanitizar nombre para evitar caracteres inválidos
      const safeName = providerName.replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ._-]/g, '').trim();
      const nit = providerNIT || 'SIN-NIT';
      const providerFolderName = `${nit}_${safeName}`; // Ejemplo: 900123456_Empresa SAS

      // Buscar o crear carpeta del proveedor
      let providerFolder = await this.findFolder(providerFolderName, proveedoresFolder);
      if (!providerFolder) {
        providerFolder = await this.createFolder(providerFolderName, proveedoresFolder);
      }

      // 3. Buscar o crear subcarpetas "Documentos" e "Invoices"
      let documentsFolder = await this.findFolder('Documentos', providerFolder);
      if (!documentsFolder) {
        documentsFolder = await this.createFolder('Documentos', providerFolder);
      }

      let invoicesFolder = await this.findFolder('Facturas', providerFolder);
      if (!invoicesFolder) {
        invoicesFolder = await this.createFolder('Facturas', providerFolder);
      }

      return {
        documentsFolder,
        invoicesFolder,
      };
    } catch (error) {
      console.error('Error getting/creating provider folders:', error);
      throw new Error('Failed to setup provider folder structure');
    }
  }

  /**
   * Subir archivo a Google Drive
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string
  ): Promise<DriveUploadResult> {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType,
        body: Readable.from(fileBuffer),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, webViewLink, webContentLink',
        supportsAllDrives: true,
      });

      return {
        fileId: response.data.id!,
        webViewLink: response.data.webViewLink!,
        webContentLink: response.data.webContentLink!,
      };
    } catch (error) {
      console.error('Error uploading file to Drive:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }


  /**
   * Metadatos mínimos de un archivo (nombre y tipo) para servirlo desde la app.
   */
  async getFileMeta(fileId: string): Promise<{ name: string; mimeType: string; size: number }> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'name, mimeType, size',
      supportsAllDrives: true,
    });
    return {
      name: response.data.name ?? 'documento',
      mimeType: response.data.mimeType ?? 'application/octet-stream',
      size: Number(response.data.size ?? 0),
    };
  }

  /**
   * Descarga el contenido de un archivo binario (PDF/imagen) a memoria.
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  /**
   * Envía a la papelera la carpeta de un proveedor (documentos y facturas).
   * Devuelve true si la encontró y la movió a la papelera.
   */
  async trashProviderFolder(providerName: string, providerNIT?: string): Promise<boolean> {
    const proveedoresFolder = await this.findFolder('Proveedores', this.rootFolderId);
    if (!proveedoresFolder) return false;

    const safeName = providerName.replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ._-]/g, '').trim();
    const folderName = `${providerNIT || 'SIN-NIT'}_${safeName}`;
    const providerFolder = await this.findFolder(folderName, proveedoresFolder);
    if (!providerFolder) return false;

    await this.drive.files.update({
      fileId: providerFolder,
      requestBody: { trashed: true },
      supportsAllDrives: true,
    });
    return true;
  }

  /**
   * Eliminar archivo de Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
        supportsAllDrives: true,
      });
    } catch (error) {
      console.error('Error deleting file from Drive:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }
}

// Singleton instance
let driveServiceInstance: DriveStorageService | null = null;

export function getDriveService(): DriveStorageService {
  if (!driveServiceInstance) {
    driveServiceInstance = new DriveStorageService();
  }
  return driveServiceInstance;
}
