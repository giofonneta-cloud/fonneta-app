# Guía de Configuración Final - Fonnetapp

## 📋 Resumen

Esta guía te ayudará a completar la configuración del sistema después de las correcciones de seguridad y el arreglo del registro de proveedores.

---

## 🔐 Paso 1: Revocar Credenciales SMTP Expuestas

**⚠️ CRÍTICO - Hacer INMEDIATAMENTE**

Las credenciales SMTP fueron expuestas accidentalmente en GitHub. Debes revocarlas y generar nuevas.

### 1.1 Revocar Contraseña de Aplicación Antigua

1. Ve a: https://myaccount.google.com/apppasswords
2. Inicia sesión con `norificacionesfonneta@gmail.com`
3. Busca la contraseña de aplicación existente (probablemente llamada "Fonneta App" o similar)
4. Haz clic en el ícono de **papelera** o **Eliminar**
5. Confirma la revocación

### 1.2 Generar Nueva Contraseña de Aplicación

1. En la misma página (https://myaccount.google.com/apppasswords)
2. Haz clic en **"Crear"** o **"Generar"**
3. Nombre: `Fonneta App 2026`
4. Google te mostrará una contraseña de 16 caracteres (ejemplo: `abcd efgh ijkl mnop`)
5. **Copia esta contraseña** (sin espacios: `abcdefghijklmnop`)

---

## 🔑 Paso 2: Obtener Service Role Key de Supabase

El sistema necesita esta clave para crear perfiles de usuario con privilegios elevados.

### 2.1 Acceder a Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/dmdhxgthekbslzehctgn/settings/api
2. Inicia sesión si es necesario

### 2.2 Copiar Service Role Key

1. En la sección **"Project API keys"**
2. Busca la fila que dice **`service_role`** (NO la `anon` key)
3. Haz clic en **"Reveal"** o el ícono de ojo
4. **Copia toda la clave** (empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

⚠️ **IMPORTANTE**: Esta clave es MUY sensible. Nunca la compartas ni la subas a GitHub.

---

## 📝 Paso 3: Actualizar Variables de Entorno

### 3.1 Abrir .env.local

1. Abre el archivo: `d:\02_apps\03_Fonneta\Fonnetapp\.env.local`
2. Busca las siguientes líneas:

```bash
SMTP_PASSWORD=mtlizfjrainhklpy
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZGh4Z3RoZWtic2x6ZWhjdGduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkzOTMxMywiZXhwIjoyMDg0NTE1MzEzfQ.QLdOdJbJODOqPJvYJvUvBBPMnrQMPJPKYOQKXPMQxrM
```

### 3.2 Reemplazar Valores

1. **SMTP_PASSWORD**: Reemplaza `mtlizfjrainhklpy` con la nueva contraseña que generaste en el Paso 1.2
2. **SUPABASE_SERVICE_ROLE_KEY**: Reemplaza todo el valor después del `=` con la clave que copiaste en el Paso 2.2

### 3.3 Guardar Archivo

1. Guarda el archivo `.env.local`
2. **NO** lo subas a GitHub (ya está en `.gitignore`)

---

## 🔄 Paso 4: Reiniciar Servidor de Desarrollo

Las variables de entorno solo se cargan al iniciar el servidor.

### 4.1 Detener Servidor Actual

1. Ve a la terminal donde está corriendo `npm run dev`
2. Presiona `Ctrl + C`
3. Espera a que el proceso termine completamente

### 4.2 Iniciar Servidor Nuevamente

```bash
npm run dev
```

Espera a que veas el mensaje:

```
✓ Ready in [tiempo]
○ Local:   http://localhost:3000
```

---

## ✅ Paso 5: Probar Registro de Proveedores

Ahora que todo está configurado, prueba el registro completo.

### 5.1 Abrir Página de Registro

1. Abre tu navegador
2. Ve a: http://localhost:3000/register/provider
3. Recarga la página (F5) para asegurar que carga el código más reciente

### 5.2 Completar Formulario

**Paso 1 - Datos:**

- Razón Social: `Proveedor Test SAS`
- Número de Documento: `900123456-7`
- Dirección: `Calle 100 # 10-20`
- Departamento: Selecciona cualquiera
- Ciudad: Selecciona cualquiera

**Paso 2 - Documentos:**

- Marca la casilla de autorización de datos
- Continúa (los documentos son opcionales para testing)

**Paso 3 - Contacto:**

- Nombre: `Juan Pérez`
- Email de Contacto: `test@example.com`
- Teléfono: `3001234567`
- Email de Facturación: `facturacion@example.com`
- Contraseña: `Test123456`
- Confirmar Contraseña: `Test123456`

### 5.3 Finalizar Registro

1. Haz clic en **"Finalizar Registro"**
2. **Espera** (puede tomar 2-3 segundos)
3. Deberías ver un mensaje de éxito

### 5.4 Verificar en Consola

Abre las DevTools del navegador (F12) y revisa la consola:

- ✅ Deberías ver: `Profile created via API: {...}`
- ✅ NO deberías ver errores de RLS o foreign key

---

## 🐛 Troubleshooting

### Error: "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"

**Causa**: El servidor no se reinició después de actualizar `.env.local`

**Solución**:

1. Detén el servidor (Ctrl+C)
2. Reinicia con `npm run dev`
3. Recarga la página de registro

### Error: "Could not find the function public.create_profile_for_new_user"

**Causa**: Falta la variable `SUPABASE_SERVICE_ROLE_KEY` o es incorrecta

**Solución**:

1. Verifica que copiaste la clave correcta de Supabase
2. Asegúrate de que es la clave `service_role`, NO la `anon`
3. Reinicia el servidor

### Error: "Error crítico: No se pudo crear el perfil de usuario"

**Causa**: La API route no puede conectarse a Supabase

**Solución**:

1. Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté correcta en `.env.local`
2. Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea válida
3. Revisa los logs del servidor en la terminal

---

## 📊 Verificación Final

Una vez completados todos los pasos:

1. ✅ Credenciales SMTP antiguas revocadas
2. ✅ Nueva contraseña de aplicación generada y configurada
3. ✅ Service Role Key de Supabase configurada
4. ✅ Servidor reiniciado
5. ✅ Registro de proveedor completado exitosamente

---

## 📞 Soporte

Si encuentras algún problema después de seguir esta guía:

1. Revisa los logs de la terminal del servidor
2. Revisa la consola del navegador (F12)
3. Verifica que todas las variables en `.env.local` estén correctas
4. Asegúrate de haber reiniciado el servidor después de cada cambio

---

**Última actualización**: 2026-02-02
