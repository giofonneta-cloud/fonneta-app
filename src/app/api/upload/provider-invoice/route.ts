import { NextRequest, NextResponse } from 'next/server';
import { getDriveService } from '@/lib/google-drive/driveService';
import { getEmailService } from '@/lib/email/emailService';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];

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
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const amount = parseFloat(formData.get('amount') as string);

    if (!file || !providerId || !invoiceNumber) {
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
        { error: 'Solo se permiten archivos PDF para facturas' },
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
      provider.business_name,
      provider.document_number
    );

    // Crear subcarpeta por fecha (YYYYMMDD) dentro de Facturas
    const dateFolderId = await driveService.getOrCreateDateFolder(folders.invoicesFolder);

    // 7. Generar nombre de archivo único
    const timestamp = Date.now();
    const fileName = `${invoiceNumber}_${timestamp}.pdf`;

    // 8. Subir a Google Drive (en la carpeta de fecha)
    const uploadResult = await driveService.uploadFile(
      buffer,
      fileName,
      file.type,
      dateFolderId
    );

    // 9. Enviar notificaciones
    try {
      const emailService = getEmailService();
      const now = new Date();
      const dateStr = now.getFullYear().toString() + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + 
                      now.getDate().toString().padStart(2, '0');
      const radicado = `RAD-${dateStr}-${invoiceNumber}`;
      
      // Notificar al proveedor (Informativo, sin adjuntos, con radicado)
      if (provider.contact_email) {
        await emailService.sendProviderInvoiceReceived(
          provider.contact_email,
          provider.business_name,
          invoiceNumber,
          radicado
        );
      }

      // Notificar al admin
      if (amount) {
        await emailService.sendAdminInvoiceReview(
          uploadResult.webViewLink,
          provider.business_name,
          invoiceNumber,
          amount
        );
      }
    } catch (emailError) {
      // Log pero no fallar la request si el email falla
      console.error('Error sending notification emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      fileUrl: uploadResult.webViewLink,
    });

  } catch (error) {
    console.error('Error uploading invoice document:', error);
    return NextResponse.json(
      { error: 'Error al subir la factura' },
      { status: 500 }
    );
  }
}
