import { NextRequest, NextResponse } from 'next/server';
import { getDriveService } from '@/lib/google-drive/driveService';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];

/**
 * API Route para subir el PDF firmado de un Release Document y marcarlo como firmado.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const releaseDocumentId = formData.get('releaseDocumentId') as string;

    if (!file || !releaseDocumentId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // 3. Validar archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 10MB' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'El release firmado debe ser un archivo PDF' }, { status: 400 });
    }

    // 4. Obtener el release document y su proveedor
    const { data: rd, error: rdError } = await supabase
      .from('release_documents')
      .select('release_number, provider_id, providers:provider_id (business_name, document_number)')
      .eq('id', releaseDocumentId)
      .single();

    if (rdError || !rd) {
      return NextResponse.json({ error: 'Documento de release no encontrado' }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${rd.release_number}_FIRMADO_${Date.now()}.pdf`;

    // 5. Subir a Google Drive (si el release tiene proveedor asociado)
    let fileUrl: string | undefined;
    const providerInfo = rd.providers as unknown as { business_name: string; document_number: string | null } | null;
    if (rd.provider_id && providerInfo) {
      try {
        const driveService = getDriveService();
        const folders = await driveService.getOrCreateProviderFolders(
          rd.provider_id,
          providerInfo.business_name,
          providerInfo.document_number ?? undefined
        );
        const releasesFolder = await driveService.getOrCreateNamedFolder('Releases', folders.documentsFolder);
        const firmadosFolder = await driveService.getOrCreateNamedFolder('Firmados', releasesFolder);
        const uploadResult = await driveService.uploadFile(buffer, fileName, 'application/pdf', firmadosFolder);
        fileUrl = uploadResult.webViewLink;
      } catch (driveErr) {
        console.error('Error uploading signed release to Drive (non-blocking):', driveErr);
      }
    }

    // 6. Marcar el release como firmado
    const { error: updateError } = await supabase
      .from('release_documents')
      .update({
        status: 'firmado',
        ...(fileUrl ? { signed_document_url: fileUrl } : {}),
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', releaseDocumentId);

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el estado del release' }, { status: 500 });
    }

    return NextResponse.json({ success: true, fileUrl });
  } catch (error) {
    console.error('Error uploading signed release document:', error);
    return NextResponse.json({ error: 'Error al subir el release firmado' }, { status: 500 });
  }
}
