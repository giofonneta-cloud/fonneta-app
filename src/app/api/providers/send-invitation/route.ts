import { createAdminClient } from '@/lib/supabase/admin';
import { generateProviderInvitationEmail } from '@/lib/email-templates/provider-invitation';
import { getEmailService } from '@/lib/email/emailService';

export async function POST(req: Request) {
  try {
    const { email, providerName } = await req.json();

    if (!email || !providerName) {
      return Response.json(
        { error: 'Email y nombre del proveedor son requeridos' },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar variables de entorno SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('Missing SMTP environment variables');
      return Response.json(
        { error: 'Error de configuración del servidor de correo' },
        { status: 500 }
      );
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fonneta-app.vercel.app'}/register/provider`;
    const htmlContent = generateProviderInvitationEmail(providerName, inviteLink);

    // Envío a través del servicio compartido: headers anti-spam (List-Unsubscribe,
    // Auto-Submitted) y remitente con nombre formateado ya resueltos ahí mismo.
    const result = await getEmailService().sendEmail({
      to: email,
      replyTo: 'administrativo@fonneta.com',
      subject: 'Invitación a Fonnettapp - Portal de Proveedores y Clientes',
      html: htmlContent,
      text: `Invitación a Fonnettapp\n\nHas sido invitado a registrarte en Fonnettapp, nuestro portal de gestión para proveedores y clientes.\n\nPara completar tu registro, ingresa al siguiente enlace:\n${inviteLink}\n\nSaludos,\nEquipo Fonneta Comunicaciones`,
    });

    console.log(`Invitación enviada a ${email}:`, result.messageId);

    // Guardar log en BD (opcional - crear tabla si no existe)
    const supabase = createAdminClient();
    try {
      await supabase
        .from('provider_invitations')
        .insert({
          email,
          provider_name: providerName,
          invitation_link: inviteLink,
          status: 'enviado',
          sent_at: new Date().toISOString(),
        });
    } catch (err) {
      console.error('Error guardando log de invitación:', err);
      // No fallar si no se puede guardar el log
    }

    return Response.json({
      success: true,
      message: `Invitación enviada exitosamente a ${email}`,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error en send-invitation:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
