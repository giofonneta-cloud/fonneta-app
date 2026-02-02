
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';

async function diagnoseStructure() {
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

        // 1. Buscar carpeta "Proveedores"
        console.log('🔍 Buscando carpeta "Proveedores"...');
        const q = `name='Proveedores' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        
        const listRes = await drive.files.list({
            q,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const existing = listRes.data.files?.[0];
        
        if (existing) {
            console.log(`✅ Carpeta encontrada: ${existing.id}`);
        } else {
            console.log('⚠️ Carpeta no encontrada. Intentando crear...');
            const createRes = await drive.files.create({
                requestBody: {
                    name: 'Proveedores',
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [rootFolderId]
                },
                fields: 'id',
                supportsAllDrives: true
            });
            console.log(`✅ Carpeta creada: ${createRes.data.id}`);
        }

    } catch (e: any) {
        console.error('❌ ERROR DETALLADO:');
        console.error(e.message);
        if (e.response?.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        }
    }
}
diagnoseStructure();
