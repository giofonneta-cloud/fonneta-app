import { NextRequest, NextResponse } from 'next/server';
import { getDriveService } from '@/lib/google-drive/driveService';
import { createClient } from '@/lib/supabase/server';
import { authPermissionService } from '@/features/auth/services/authPermissionService';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const canUpload = await authPermissionService.hasPermission(user.id, 'legalizaciones.view');
    if (!canUpload) {
      return NextResponse.json({ error: 'No tienes acceso a este módulo' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Selecciona un archivo' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 10MB' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF, PNG o JPG' }, { status: 400 });
    }

    const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `soporte_${user.id.slice(0, 8)}_${Date.now()}.${extension}`;

    const drive = getDriveService();
    const rootFolder = await drive.getOrCreateRootFolder('Legalizaciones');
    const dateFolder = await drive.getOrCreateDateFolder(rootFolder);
    const result = await drive.uploadFile(Buffer.from(await file.arrayBuffer()), fileName, file.type, dateFolder);

    return NextResponse.json({ success: true, fileUrl: result.webViewLink });
  } catch (error) {
    console.error('Error uploading legalizacion soporte:', error);
    return NextResponse.json({ error: 'No se pudo subir el soporte' }, { status: 500 });
  }
}
