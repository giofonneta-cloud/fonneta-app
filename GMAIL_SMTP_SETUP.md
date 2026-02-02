# Configuración de Gmail para SMTP

Para que las notificaciones por email funcionen, necesitas configurar una **contraseña de aplicación** en Gmail.

## Pasos para configurar Gmail SMTP

### 1. Habilitar Verificación en Dos Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, selecciona **Seguridad**
3. Busca **Verificación en dos pasos**
4. Si no está habilitada, haz clic en **Empezar** y sigue los pasos

### 2. Generar Contraseña de Aplicación

1. Una vez habilitada la verificación en dos pasos, regresa a **Seguridad**
2. Busca **Contraseñas de aplicaciones** (puede estar en la sección "Cómo inicias sesión en Google")
3. Haz clic en **Contraseñas de aplicaciones**
4. Es posible que te pida tu contraseña de nuevo
5. En "Selecciona la app", elige **Correo**
6. En "Selecciona el dispositivo", elige **Otro (nombre personalizado)**
7. Escribe: `Fonneta App`
8. Haz clic en **Generar**
9. Google te mostrará una contraseña de 16 caracteres (ejemplo: `abcd efgh ijkl mnop`)
10. **Copia esta contraseña**

### 3. Actualizar .env.local

Reemplaza la línea en tu archivo `.env.local`:

```bash
# Antes (contraseña de aplicación antigua - REVOCADA)
SMTP_PASSWORD=old-password-here

# Después (usa la contraseña generada por Google, SIN espacios)
SMTP_PASSWORD=your-16-char-app-password
```

### 4. Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciarlo
npm run dev
```

## Verificación

Para probar que todo funciona, puedes crear un archivo de prueba:

**`test-email.ts`**:

```typescript
import { getEmailService } from "@/lib/email/emailService";

async function testEmail() {
  const emailService = getEmailService();

  await emailService.sendEmail({
    to: "tu-email@ejemplo.com", // Cambia esto por tu email
    subject: "Prueba de Fonneta",
    html: "<h1>¡El sistema de notificaciones funciona!</h1>",
  });

  console.log("Email enviado exitosamente");
}

testEmail().catch(console.error);
```

Ejecuta:

```bash
npx tsx test-email.ts
```

## Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solución**: Asegúrate de:

1. Haber habilitado la verificación en dos pasos
2. Usar la contraseña de aplicación (no tu contraseña normal)
3. Copiar la contraseña SIN espacios

### Error: "Connection timeout"

**Solución**:

1. Verifica tu conexión a internet
2. Asegúrate de que el puerto 587 no esté bloqueado por firewall
3. Intenta cambiar el puerto a 465 y `secure: true` en `emailService.ts`

### No recibo emails

**Solución**:

1. Revisa la carpeta de spam
2. Verifica que el email del destinatario sea correcto
3. Revisa los logs del servidor para ver si hay errores

## Seguridad

⚠️ **IMPORTANTE**:

- NUNCA compartas tu contraseña de aplicación
- NUNCA la subas a GitHub (el archivo `.env.local` está en `.gitignore`)
- Puedes revocar contraseñas de aplicación en cualquier momento desde tu cuenta de Google
- Si crees que la contraseña fue comprometida, revócala y genera una nueva

## Alternativa: Usar otro servicio SMTP

Si prefieres no usar Gmail, puedes usar otros servicios como:

- **SendGrid**: Hasta 100 emails/día gratis
- **Mailgun**: Hasta 5,000 emails/mes gratis
- **Amazon SES**: Muy económico para alto volumen

Solo necesitas cambiar las variables `SMTP_*` en `.env.local`.
