/**
 * Script de prueba para verificar Supabase Storage + Email Notifications
 * 
 * Ejecutar: npx tsx scripts/test-supabase-email.ts
 */

// Cargar variables de entorno
import { config } from 'dotenv';
config({ path: '.env.local' });

import { getEmailService } from '../src/lib/email/emailService';

async function testEmailNotifications() {
  console.log('\n📧 Probando Sistema de Notificaciones...\n');
  
  try {
    const emailService = getEmailService();
    console.log('✅ EmailService inicializado correctamente');
    
    // Test 1: Notificación de documento subido
    console.log('\n📄 Test 1: Notificación de documento subido');
    await emailService.sendProviderDocumentUploaded(
      'norificacionesfonneta@gmail.com',
      'Proveedor de Prueba S.A.S',
      'RUT'
    );
    console.log('✅ Email enviado al proveedor');
    
    // Test 2: Notificación al admin
    console.log('\n👨‍💼 Test 2: Notificación al admin');
    await emailService.sendAdminDocumentReview(
      'https://example.com/document.pdf',
      'Proveedor de Prueba S.A.S',
      'RUT'
    );
    console.log('✅ Email enviado al admin');
    
    // Test 3: Notificación de factura recibida
    console.log('\n💰 Test 3: Notificación de factura recibida');
    await emailService.sendProviderInvoiceReceived(
      'norificacionesfonneta@gmail.com',
      'Proveedor de Prueba S.A.S',
      'FAC-001',
      'RAD-2026-001'
    );
    console.log('✅ Email de factura enviado al proveedor');

    // Test 4: Notificación de factura al admin
    console.log('\n📊 Test 4: Notificación de factura al admin');
    await emailService.sendAdminInvoiceReview(
      'https://example.com/invoice.pdf',
      'Proveedor de Prueba S.A.S',
      'FAC-001',
      1500000
    );
    console.log('✅ Email de factura enviado al admin');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡Todos los tests pasaron exitosamente!');
    console.log('='.repeat(60));
    console.log('\n📬 Revisa la bandeja de norificacionesfonneta@gmail.com');
    console.log('   Deberías tener 4 emails de prueba.\n');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:');
    console.error(error);
    process.exit(1);
  }
}

testEmailNotifications();
