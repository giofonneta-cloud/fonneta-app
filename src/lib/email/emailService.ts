import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP configuration environment variables are required');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        // No fallar en certificados inválidos
        rejectUnauthorized: false,
      },
    });

    this.fromEmail = process.env.NOTIFICATION_FROM_EMAIL || process.env.SMTP_USER;
    this.fromName = process.env.NOTIFICATION_FROM_NAME || 'Fonneta';
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Notificar al proveedor que su documento fue cargado exitosamente
   */
  async sendProviderDocumentUploaded(
    providerEmail: string,
    providerName: string,
    documentType: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Documento Cargado Exitosamente</h2>
        <p>Hola <strong>${providerName}</strong>,</p>
        <p>Tu documento <strong>${documentType}</strong> ha sido cargado exitosamente y está en revisión.</p>
        <p>Te notificaremos cuando haya sido validado por nuestro equipo.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Este es un mensaje automático de Fonneta. Por favor no respondas a este correo.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: providerEmail,
      subject: `Documento ${documentType} cargado exitosamente`,
      html,
      text: `Hola ${providerName}, tu documento ${documentType} ha sido cargado exitosamente y está en revisión.`,
    });
  }

  /**
   * Notificar al admin que hay un nuevo documento para revisar
   */
  async sendAdminDocumentReview(
    documentUrl: string,
    providerName: string,
    documentType: string
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.fromEmail;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nuevo Documento para Revisar</h2>
        <p>El proveedor <strong>${providerName}</strong> ha cargado un nuevo documento:</p>
        <ul>
          <li><strong>Tipo:</strong> ${documentType}</li>
          <li><strong>Proveedor:</strong> ${providerName}</li>
        </ul>
        <p>
          <a href="${documentUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Ver Documento
          </a>
        </p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Sistema de Gestión Fonneta
        </p>
      </div>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `Nuevo documento de ${providerName} - ${documentType}`,
      html,
      text: `El proveedor ${providerName} ha cargado un nuevo documento (${documentType}). Ver: ${documentUrl}`,
    });
  }

  /**
   * Notificar al proveedor que su factura fue recibida
   */
  async sendProviderInvoiceReceived(
    providerEmail: string,
    providerName: string,
    invoiceNumber: string,
    radicado?: string
  ): Promise<void> {
    const radicadoNumber = radicado || invoiceNumber;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Confirmación de Recepción</h2>
        <p>Hola <strong>${providerName}</strong>,</p>
        <p>Tu factura/cuenta de cobro con número <strong>${invoiceNumber}</strong> ha sido enviada satisfactoriamente.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0; font-size: 16px;"><strong>Número de Radicado:</strong> ${radicadoNumber}</p>
        </div>
        <p>Este documento se encuentra en proceso de revisión por parte de nuestro equipo administrativo.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Este es un mensaje automático de Fonneta. Por favor no respondas a este correo.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: providerEmail,
      subject: `Confirmación de envío - Factura ${invoiceNumber}`,
      html,
      text: `Hola ${providerName}, tu factura ${invoiceNumber} ha sido enviada satisfactoriamente. Número de radicado: ${radicadoNumber}.`,
    });
  }

  /**
   * Notificar al admin sobre nueva factura
   */
  async sendAdminInvoiceReview(
    invoiceUrl: string,
    providerName: string,
    invoiceNumber: string,
    amount: number
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.fromEmail;
    const formattedAmount = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nueva Factura para Revisar</h2>
        <p>El proveedor <strong>${providerName}</strong> ha registrado una nueva factura:</p>
        <ul>
          <li><strong>Número:</strong> ${invoiceNumber}</li>
          <li><strong>Monto:</strong> ${formattedAmount}</li>
          <li><strong>Proveedor:</strong> ${providerName}</li>
        </ul>
        <p>
          <a href="${invoiceUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Ver Factura
          </a>
        </p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Sistema de Gestión Fonneta
        </p>
      </div>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `Nueva factura de ${providerName} - ${invoiceNumber}`,
      html,
      text: `El proveedor ${providerName} ha registrado la factura ${invoiceNumber} por ${formattedAmount}. Ver: ${invoiceUrl}`,
    });
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
