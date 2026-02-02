/**
 * Script de prueba para verificar la configuración de Google Drive y Email
 * 
 * Ejecutar: npx tsx scripts/test-integrations.ts
 */

// Cargar variables de entorno
import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDriveService } from '../src/lib/google-drive/driveService';
import { getEmailService } from '../src/lib/email/emailService';

async function testGoogleDrive() {
  console.log('\n🔍 Probando Google Drive...\n');
  
  try {
    const driveService = getDriveService();
    console.log('✅ DriveService inicializado correctamente');
    
    // Intentar crear estructura de carpetas de prueba
    console.log('📁 Creando estructura de carpetas de prueba...');
    const folders = await driveService.getOrCreateProviderFolders(
      'test-provider-sportsaes',
      'Sports AES SAS',
      '901555777'
    );
    
    console.log('✅ Carpetas creadas exitosamente:');
    console.log(`   - Documentos: ${folders.documentsFolder}`);
    console.log(`   - Facturas: ${folders.invoicesFolder}`);
    
    // Crear un archivo de prueba
    console.log('\n📄 Subiendo archivo de prueba...');
    const testContent = Buffer.from('Este es un archivo de prueba de Fonneta para Sports AES');
    const uploadResult = await driveService.uploadFile(
      testContent,
      `test_upload_${Date.now()}.txt`,
      'text/plain',
      folders.documentsFolder
    );
    
    console.log('✅ Archivo subido exitosamente:');
    console.log(`   - ID: ${uploadResult.fileId}`);
    console.log(`   - Ver: ${uploadResult.webViewLink}`);
    
    // Limpiar: eliminar archivo de prueba
    console.log('\n🧹 Limpiando archivo de prueba...');
    try {
      await driveService.deleteFile(uploadResult.fileId);
      console.log('✅ Archivo eliminado');
    } catch (cleanupError) {
      console.warn('⚠️ No se pudo eliminar el archivo de prueba (esto es normal si el Service Account no tiene permisos de Manager en Shared Drive)');
      console.warn('   El upload funcionó correctamente, así que la prueba se considera exitosa.');
      // No re-throw el error, permitimos que pase la prueba
    }

    console.log('\n✅ Google Drive configurado correctamente!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Error en Google Drive:');
    console.error(error);
    return false;
  }
}

async function testEmail() {
  console.log('\n📧 Probando Email Service...\n');
  
  try {
    const emailService = getEmailService();
    console.log('✅ EmailService inicializado correctamente');
    
    // Enviar email de prueba
    console.log('📨 Enviando email de prueba...');
    await emailService.sendEmail({
      to: 'sportsaes@gmail.com', 
      subject: '✅ Prueba de Fonneta - Sistema de Notificaciones (Sports AES)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">¡Sistema de Notificaciones Funcionando!</h1>
          <p>Este es un email de prueba del sistema Fonneta dirigido a Sports AES.</p>
          <p>Si recibiste este correo, significa que la configuración de Gmail SMTP está correcta.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Fecha: ${new Date().toLocaleString('es-CO')}
          </p>
        </div>
      `,
      text: '¡Sistema de notificaciones funcionando! Este es un email de prueba para Sports AES.',
    });
    
    console.log('✅ Email enviado exitosamente!');
    console.log('   Revisa tu bandeja de entrada en sportsaes@gmail.com');
    console.log('   (También revisa spam si no lo ves)\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ Error en Email Service:');
    console.error(error);
    console.log('\n💡 Si ves un error de autenticación:');
    console.log('   1. Asegúrate de haber configurado una contraseña de aplicación');
    console.log('   2. Revisa GMAIL_SMTP_SETUP.md para instrucciones');
    console.log('   3. Actualiza SMTP_PASSWORD en .env.local\n');
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 TEST DE INTEGRACIÓN - FONNETA');
  console.log('='.repeat(60));
  
  const driveOk = await testGoogleDrive();
  const emailOk = await testEmail();
  
  console.log('='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`Google Drive: ${driveOk ? '✅ OK' : '❌ FALLÓ'}`);
  console.log(`Email SMTP:   ${emailOk ? '✅ OK' : '❌ FALLÓ'}`);
  console.log('='.repeat(60));
  
  if (driveOk && emailOk) {
    console.log('\n🎉 ¡Todo configurado correctamente!');
    console.log('   Puedes empezar a usar el sistema de uploads.\n');
  } else {
    console.log('\n⚠️  Hay problemas de configuración.');
    console.log('   Revisa los errores arriba y las guías de configuración.\n');
  }
}

main().catch(console.error);
