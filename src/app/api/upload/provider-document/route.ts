import { NextRequest, NextResponse } from 'next/server';
import { getDriveService } from '@/lib/google-drive/driveService';
import { getEmailService } from '@/lib/email/emailService';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const providerId = formData.get('providerId') as string;
    const documentType = formData.get('type') as string;

    if (!file || !providerId || !documentType) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // 3. Validar archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 10MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo PDF, PNG y JPG' },
        { status: 400 }
      );
    }

    // 4. Obtener información del proveedor
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('business_name, document_number, contact_email')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // 5. Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Obtener servicio de Drive y crear estructura de carpetas
    const driveService = getDriveService();
    const folders = await driveService.getOrCreateProviderFolders(
      providerId,
      provider.document_number
    );

    // 7. Generar nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${documentType}_${timestamp}.${fileExt}`;

    // 8. Subir a Google Drive
    const uploadResult = await driveService.uploadFile(
      buffer,
      fileName,
      file.type,
      folders.documentsFolder
    );

    // 9. Guardar registro en Supabase
    const { data: document, error: dbError } = await supabase
      .from('provider_documents')
      .insert({
        provider_id: providerId,
        tipo_documento: documentType,
        archivo_url: uploadResult.webViewLink,
        estado: 'en_revision',
      })
      .select()
      .single();

    // Actualizar también la columna correspondiente en la tabla providers si aplica
    const columnMap: { [key: string]: string } = {
      'RUT': 'rut_url',
      'Cedula_Rep_Legal': 'cedula_url',
      'Camara_Comercio': 'camara_comercio_url',
      'Cert_Bancaria': 'cert_bancaria_url'
    };

    if (columnMap[documentType] && !dbError) {
      await supabase
        .from('providers')
        .update({
          [columnMap[documentType]]: uploadResult.webViewLink,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);
    }

    if (dbError) {
      // Si falla la BD, intentar eliminar el archivo de Drive
      try {
        await driveService.deleteFile(uploadResult.fileId);
      } catch (deleteError) {
        console.error('Error deleting file after DB failure:', deleteError);
      }
      throw dbError;
    }

    // 10. Enviar notificaciones
    try {
      const emailService = getEmailService();
      
      // Notificar al proveedor
      if (provider.contact_email) {
        await emailService.sendProviderDocumentUploaded(
          provider.contact_email,
          provider.business_name,
          documentType
        );
      }

      // Notificar al admin
      await emailService.sendAdminDocumentReview(
        uploadResult.webViewLink,
        provider.business_name,
        documentType
      );
    } catch (emailError) {
      // Log pero no fallar la request si el email falla
      console.error('Error sending notification emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      document,
      fileUrl: uploadResult.webViewLink,
    });

  } catch (error) {
    console.error('Error uploading provider document:', error);
    return NextResponse.json(
      { error: 'Error al subir el documento' },
      { status: 500 }
    );
  }
}
