
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';

async function diagnoseStructureDeep() {
    try {
        const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
        if (!key || !rootFolderId) throw new Error('Credenciales faltantes');

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(key),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        console.log(`\n📂 Root ID: ${rootFolderId}`);

        // 1. Obtener "Proveedores"
        console.log('🔍 Buscando carpeta "Proveedores"...');
        const listRes = await drive.files.list({
            q: `name='Proveedores' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const proveedoresId = listRes.data.files?.[0]?.id;
        if (!proveedoresId) {
            console.error('❌ "Proveedores" no encontrada. Corre el script anterior primero.');
            return;
        }
        console.log(`✅ ID de "Proveedores": ${proveedoresId}`);

        // 2. Intentar crear subcarpeta
        const subFolderName = '900123456';
        console.log(`📝 Intentando crear subcarpeta "${subFolderName}" en ${proveedoresId}...`);
        
        const createRes = await drive.files.create({
            requestBody: {
                name: subFolderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [proveedoresId]
            },
            fields: 'id',
            supportsAllDrives: true
        });
        console.log(`✅ Subcarpeta creada: ${createRes.data.id}`);

        // 3. Intentar subir archivo
        console.log('📄 Intentando subir archivo...');
        await drive.files.create({
            requestBody: {
                name: 'test_file.txt',
                parents: [createRes.data.id!]
            },
            media: {
                mimeType: 'text/plain',
                body: 'Contenido de prueba'
            },
            supportsAllDrives: true
        });
        console.log('✅ Archivo subido exitosamente.');

        // Limpieza
        console.log('🧹 Limpiando...');
        await drive.files.delete({ fileId: createRes.data.id!, supportsAllDrives: true });
        console.log('✅ Limpieza completada.');

    } catch (e: any) {
        console.error('❌ ERROR DETALLADO:');
        console.error(e.message);
        if (e.response?.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        }
    }
}
diagnoseStructureDeep();
