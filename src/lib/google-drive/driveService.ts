import { google } from 'googleapis';
import { Readable } from 'stream';

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
        q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
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

      // Intentar hacer la carpeta pública (puede fallar en Shared Drives restringidos)
      try {
        await this.drive.permissions.create({
          fileId: response.data.id!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true,
        });
      } catch (permError) {
        console.warn(`Warning: Could not make folder ${name} public. Checks Shared Drive settings.`, permError);
        // No lanzamos error para no detener el proceso
      }

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

      // Intentar hacer el archivo público (puede fallar en Shared Drives restringidos)
      try {
        await this.drive.permissions.create({
          fileId: response.data.id!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true,
        });
      } catch (permError) {
        console.warn(`Warning: Could not make file ${fileName} public. Check Shared Drive settings.`, permError);
      }

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
