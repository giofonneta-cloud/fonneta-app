export function generateProviderInvitationEmail(providerName: string, inviteLink: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a Fonnettapp</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; background-color: #f5f7fa; padding-top: 20px; padding-bottom: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background-color: #5b4b9d; padding: 40px 30px; text-align: center; border-bottom: 1px solid #4a3a8a;">
      <div style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 8px; letter-spacing: 0;">FONNETTAPP</div>
      <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 0; font-weight: 400;">Portal de Gestión para Proveedores</p>
    </div>

    <!-- Content -->
    <div style="padding: 50px 30px;">

      <!-- Greeting -->
      <h1 style="color: #1a202c; font-size: 24px; margin: 0 0 10px 0; font-weight: 900;">Buenas tardes ${providerName}</h1>
      <p style="color: #4a5568; font-size: 16px; margin: 0 0 30px 0; line-height: 1.6;">
        <strong>Cordial saludo,</strong>
      </p>

      <!-- Main message -->
      <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
        <p style="color: #2d3748; font-size: 15px; margin: 0; line-height: 1.8;">
          Solicitamos realizar tu registro como <strong>proveedor en nuestro sistema Fonnettapp</strong>.
          Esto te permitirá gestionar órdenes de compra, radicaciones de facturas y pagos de forma segura y eficiente.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #667eea; color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 900; font-size: 15px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 8px 20px rgba(102,126,234,0.3);">
          COMPLETAR REGISTRO
        </a>
      </div>

      <!-- Documents Section -->
      <div style="margin: 40px 0;">
        <h3 style="color: #1a202c; font-size: 16px; font-weight: 900; margin: 0 0 20px 0;">Documentos Requeridos</h3>

        <div style="margin-bottom: 25px;">
          <h4 style="color: #2d3748; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">Personas Naturales</h4>
          <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px;">
            <li style="margin-bottom: 6px;">RUT actualizado (con actividad del servicio)</li>
            <li style="margin-bottom: 6px;">Certificación bancaria</li>
            <li>Copia de cédula de ciudadanía</li>
          </ul>
        </div>

        <div>
          <h4 style="color: #2d3748; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">Personas Jurídicas</h4>
          <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px;">
            <li style="margin-bottom: 6px;">RUT actualizado</li>
            <li style="margin-bottom: 6px;">Certificado de Cámara de Comercio</li>
            <li style="margin-bottom: 6px;">Certificación bancaria</li>
            <li>Copia de cédula del representante legal</li>
          </ul>
        </div>
      </div>

      <!-- Process Section -->
      <div style="background: #edf2f7; padding: 25px; border-radius: 10px; margin: 30px 0;">
        <h3 style="color: #1a202c; font-size: 16px; font-weight: 900; margin: 0 0 20px 0;">Proceso de Facturación y Pago</h3>

        <div style="color: #2d3748; font-size: 14px; line-height: 1.8;">
          <p style="margin: 0 0 15px 0; font-weight: 600;">1. Orden de Compra</p>
          <p style="margin: 0 0 20px 0; color: #4a5568; padding-left: 10px;">Recibirás una orden de compra al correo registrado (es indispensable estar registrado)</p>

          <p style="margin: 0 0 15px 0; font-weight: 600;">2. Release</p>
          <p style="margin: 0 0 20px 0; color: #4a5568; padding-left: 10px;">Deberás diligenciar y firmar el documento "Release" que viene adjunto</p>

          <p style="margin: 0 0 15px 0; font-weight: 600;">3. Términos y Condiciones</p>
          <p style="margin: 0 0 20px 0; color: #4a5568; padding-left: 10px;">Revisa la hoja dos de la OC: "TÉRMINOS Y CONDICIONES GENERALES"</p>

          <p style="margin: 0 0 15px 0; font-weight: 600;">4. Cuenta de Cobro</p>
          <p style="margin: 0 0 20px 0; color: #4a5568; padding-left: 10px;">Incluye obligatoriamente el número de la orden de compra recibida</p>

          <p style="margin: 0 0 15px 0; font-weight: 600;">5. Radicación en el Portal</p>
          <p style="margin: 0 0 20px 0; color: #4a5568; padding-left: 10px;">Carga los documentos en el portal con tu usuario y contraseña</p>

          <p style="margin: 0 0 15px 0; font-weight: 600;">6. Documentos Requeridos</p>
          <p style="margin: 0 0 20px 0; color: #4a5568; padding-left: 10px;">
            Adjunta: Cuenta de cobro, Release, OC, y planilla de seguridad social pagada del mes en que prestaste el servicio (la base de cotización debe cubrir el valor del pago)
          </p>

          <p style="margin: 0 0 15px 0; font-weight: 600;">7. Pago</p>
          <p style="margin: 0; color: #4a5568; padding-left: 10px;">Los pagos se realizan a 30 días calendario desde la radicación exitosa en el portal</p>
        </div>
      </div>

      <!-- Support -->
      <div style="background: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <p style="color: #22543d; font-size: 14px; margin: 0; font-weight: 500;">
          <strong>Agradecemos tu pronta gestión.</strong> Quedamos atentos a cualquier duda que pueda surgir.
          <br/><br/>
          Nuestro equipo te asistirá en todo el proceso.
        </p>
      </div>

      <!-- CTA Button Again -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #667eea; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: 900; font-size: 13px; transition: transform 0.2s;">
          REGISTRATE AQUÍ
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #718096; font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">
        <strong>Fonnettapp</strong> — Sistema integral de gestión para proveedores y clientes
      </p>
      <p style="color: #a0aec0; font-size: 11px; margin: 0;">
        © 2026 Fonneta. Todos los derechos reservados.
        <br/>
        Este correo fue enviado porque fuiste invitado a registrarte como proveedor.
      </p>
    </div>

  </div>
</body>
</html>
  `;
}
