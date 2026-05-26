import { createAdminClient } from '@/lib/supabase/admin';
import { generateProviderInvitationEmail } from '@/lib/email-templates/provider-invitation';
import nodemailer from 'nodemailer';

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

    // Configurar transporte SMTP para Gmail
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // TLS, no SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // Debe ser App Password para Gmail
      },
    });

    // Enviar email con headers optimizados para evitar spam
    const result = await transporter.sendMail({
      from: process.env.SMTP_USER,
      replyTo: 'noreply@fonneta.com',
      to: email,
      subject: 'Invitación a Fonnettapp - Portal de Proveedores',
      html: htmlContent,
      text: `Invitación a Fonnettapp\n\nHas sido invitado a registrarte como proveedor en Fonnettapp.\n\nPara completar tu registro, haz clic en el siguiente enlace:\n${inviteLink}\n\nSaludos,\nEquipo Fonnettapp`,
      headers: {
        'X-Mailer': 'Fonnettapp',
        'X-Priority': '3 (Normal)',
        'Importance': 'normal',
      },
      priority: 'normal',
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
