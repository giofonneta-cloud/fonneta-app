
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';

async function diagnose() {
    try {
        const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
        if (!key || !folderId) throw new Error('Credenciales faltantes');

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(key),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        console.log(`\n📂 Verificando carpeta: ${folderId}`);
        const res = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, driveId, mimeType, capabilities',
            supportsAllDrives: true
        });

        console.log('✅ Metadata obtenida:');
        console.log(`   Nombre: ${res.data.name}`);
        console.log(`   Tipo: ${res.data.mimeType}`);
        console.log(`   Drive ID (Shared Drive): ${res.data.driveId || '❌ UNDEFINED (Es carpeta personal)'}`);
        console.log(`   Permisos (AddChildren): ${res.data.capabilities?.canAddChildren}`);

        if (!res.data.driveId) {
            console.log('\n⚠️ DIAGNÓSTICO: La carpeta NO está en una Unidad Compartida (Shared Drive).');
            console.log('   Por eso falla la escritura (cuota de Service Account = 0).');
        } else {
            console.log('\n✅ DIAGNÓSTICO: Es una Unidad Compartida.');
            // Try write
            console.log('📝 Intentando escritura...');
            await drive.files.create({
                requestBody: { name: 'test_write.txt', parents: [folderId] },
                media: { mimeType: 'text/plain', body: 'test' },
                supportsAllDrives: true
            });
            console.log('✅ Escritura exitosa.');
        }

    } catch (e: any) {
        console.error('❌ ERROR:', e.message);
        if (e.response?.data?.error) console.error(JSON.stringify(e.response.data.error, null, 2));
    }
}
diagnose();
