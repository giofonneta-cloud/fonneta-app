// Cargar variables de entorno
import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Verificando variables de entorno...\n');

const requiredVars = [
  'GOOGLE_SERVICE_ACCOUNT_KEY',
  'GOOGLE_DRIVE_ROOT_FOLDER_ID',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'NOTIFICATION_FROM_EMAIL',
  'ADMIN_EMAIL',
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mostrar solo los primeros caracteres para seguridad
    const display = varName.includes('PASSWORD') || varName.includes('KEY')
      ? `${value.substring(0, 10)}...`
      : value.length > 50
      ? `${value.substring(0, 50)}...`
      : value;
    console.log(`✅ ${varName}: ${display}`);
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`);
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allPresent) {
  console.log('✅ Todas las variables de entorno están configuradas');
} else {
  console.log('❌ Faltan variables de entorno');
  console.log('   Revisa el archivo .env.local');
}

console.log('='.repeat(60));
