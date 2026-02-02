import { NextRequest, NextResponse } from 'next/server';
import { getDriveService } from '@/lib/google-drive/driveService';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        const providerId = formData.get('providerId') as string;
        const providerName = formData.get('providerName') as string;
        const providerNIT = formData.get('providerNIT') as string;
        const documentType = formData.get('documentType') as string;
        const file = formData.get('file') as File;

        if (!providerId || !providerName || !documentType || !file) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Obtener servicio de Drive
        const driveService = getDriveService();

        // Crear estructura de carpetas
        const folders = await driveService.getOrCreateProviderFolders(
            providerId,
            providerName,
            providerNIT
        );

        // Convertir archivo a buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExt = file.name.split('.').pop();
        const fileName = `${documentType}_${timestamp}.${fileExt}`;

        // Subir archivo a Google Drive
        const result = await driveService.uploadFile(
            fileBuffer,
            fileName,
            file.type,
            folders.documentsFolder
        );

        return NextResponse.json({
            success: true,
            fileId: result.fileId,
            webViewLink: result.webViewLink,
            webContentLink: result.webContentLink,
        });
    } catch (error: any) {
        console.error('Error uploading document to Drive:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload document' },
            { status: 500 }
        );
    }
}
