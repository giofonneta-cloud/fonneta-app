# Configuración de Google Drive y Notificaciones

Este documento explica cómo configurar Google Drive y el sistema de notificaciones por email.

## 1. Configurar Google Drive Service Account

### Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "Fonneta Storage"

### Paso 2: Habilitar Google Drive API

1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google Drive API"
3. Haz clic en "Habilitar"

### Paso 3: Crear Service Account

1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "Cuenta de servicio"
3. Nombre: `fonneta-storage`
4. Descripción: "Service account para almacenamiento de archivos"
5. Haz clic en "Crear y continuar"
6. Rol: "Editor" (o puedes crear un rol personalizado con solo permisos de Drive)
7. Haz clic en "Continuar" y luego "Listo"

### Paso 4: Generar clave JSON

1. En la lista de cuentas de servicio, haz clic en la que acabas de crear
2. Ve a la pestaña "Claves"
3. Haz clic en "Agregar clave" > "Crear clave nueva"
4. Selecciona "JSON" y haz clic en "Crear"
5. Se descargará un archivo JSON - **guárdalo de forma segura**

### Paso 5: Configurar carpeta en Google Drive

1. Inicia sesión en Google Drive con la cuenta `norificacionesfonneta@gmail.com`
2. Crea una carpeta llamada "Fonneta" (o el nombre que prefieras)
3. Haz clic derecho en la carpeta > "Compartir"
4. Agrega el email del Service Account (está en el JSON descargado, campo `client_email`)
5. Dale permisos de "Editor"
6. Copia el ID de la carpeta desde la URL:
   ```
   https://drive.google.com/drive/folders/[ESTE_ES_EL_ID]
   ```

## 2. Configurar Variables de Entorno

Crea o actualiza el archivo `.env.local` en la raíz del proyecto:

```bash
# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...} # Pega todo el contenido del JSON
GOOGLE_DRIVE_ROOT_FOLDER_ID=1abc...xyz # ID de la carpeta que creaste

# Email / SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=norificacionesfonneta@gmail.com
SMTP_PASSWORD=Notif2026*
NOTIFICATION_FROM_EMAIL=norificacionesfonneta@gmail.com
NOTIFICATION_FROM_NAME=Fonneta
ADMIN_EMAIL=admin@fonneta.com # Email del administrador
```

## 3. Configurar Gmail para SMTP

### Opción A: Contraseña de aplicación (Recomendado)

1. Inicia sesión en la cuenta de Gmail
2. Ve a [Configuración de seguridad](https://myaccount.google.com/security)
3. Habilita "Verificación en dos pasos" si no está habilitada
4. Ve a "Contraseñas de aplicaciones"
5. Genera una nueva contraseña para "Correo"
6. Usa esta contraseña en `SMTP_PASSWORD`

### Opción B: Permitir aplicaciones menos seguras (No recomendado)

1. Ve a [Configuración de cuenta](https://myaccount.google.com/)
2. Seguridad > Acceso de aplicaciones menos seguras
3. Activa "Permitir aplicaciones menos seguras"

**Nota**: Google recomienda usar contraseñas de aplicación en lugar de esta opción.

## 4. Verificar la Configuración

### Test de Google Drive

Puedes crear un script de prueba:

```typescript
import { getDriveService } from "@/lib/google-drive/driveService";

async function testDrive() {
  const drive = getDriveService();
  const folders = await drive.getOrCreateProviderFolders(
    "test-provider",
    "NIT123",
  );
  console.log("Folders created:", folders);
}

testDrive();
```

### Test de Email

```typescript
import { getEmailService } from "@/lib/email/emailService";

async function testEmail() {
  const email = getEmailService();
  await email.sendEmail({
    to: "tu-email@ejemplo.com",
    subject: "Test de Fonneta",
    html: "<h1>Funciona!</h1>",
  });
}

testEmail();
```

## 5. Estructura de Carpetas en Drive

Una vez configurado, el sistema creará automáticamente esta estructura:

```
Fonneta/
└── Proveedores/
    └── [NIT o ID del proveedor]/
        ├── Documentos/
        │   ├── RUT_timestamp.pdf
        │   ├── Cedula_timestamp.pdf
        │   └── ...
        └── Facturas/
            ├── FAC001_timestamp.pdf
            └── FAC002_timestamp.pdf
```

## 6. Seguridad

### Importante:

1. **NUNCA** commitees el archivo `.env.local` a Git
2. El archivo `.gitignore` ya incluye `.env.local`
3. Rota las credenciales periódicamente
4. Usa contraseñas de aplicación en lugar de la contraseña real de Gmail
5. Limita los permisos del Service Account solo a lo necesario

## 7. Troubleshooting

### Error: "GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required"

- Verifica que el archivo `.env.local` existe
- Verifica que la variable está correctamente formateada (JSON válido)
- Reinicia el servidor de desarrollo después de agregar variables

### Error: "Failed to upload file to Google Drive"

- Verifica que el Service Account tiene permisos de Editor en la carpeta
- Verifica que la Google Drive API está habilitada
- Revisa los logs para más detalles

### Error al enviar emails

- Verifica las credenciales SMTP
- Si usas Gmail, asegúrate de tener una contraseña de aplicación
- Verifica que el puerto 587 no esté bloqueado por firewall

## 8. Migración de Archivos Existentes

Si ya tienes archivos en Supabase Storage, ejecuta el script de migración:

```bash
npm run migrate:to-drive
```

Este script:

1. Lista todos los archivos en Supabase Storage
2. Los descarga
3. Los sube a Google Drive
4. Actualiza las URLs en la base de datos
5. Genera un log de la migración

**Importante**: Haz un backup completo antes de ejecutar la migración.
