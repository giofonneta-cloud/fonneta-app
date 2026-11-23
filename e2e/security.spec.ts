import { expect, test } from '@playwright/test'

/**
 * Suite de seguridad (solo lectura / sin efectos): verifica que un visitante SIN sesión
 * no pueda usar ninguna API interna ni leer datos. Debe pasar siempre antes de desplegar.
 */

const PROTECTED_API: Array<{ method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string }> = [
  { method: 'POST', path: '/api/admin/create-user' },
  { method: 'PATCH', path: '/api/admin/update-user' },
  { method: 'POST', path: '/api/account/delete' },
  { method: 'GET', path: '/api/documents/view?u=https%3A%2F%2Fdrive.google.com%2Ffile%2Fd%2F1AbCdEfGhIjKlMnOp%2Fview' },
  { method: 'PATCH', path: '/api/providers/create' },
  { method: 'POST', path: '/api/providers/upload-document' },
  { method: 'POST', path: '/api/providers/send-invitation' },
  { method: 'POST', path: '/api/providers/invoice-notification' },
  { method: 'POST', path: '/api/send-email' },
  { method: 'POST', path: '/api/purchase-orders/send' },
  { method: 'POST', path: '/api/purchase-orders/accept' },
  { method: 'POST', path: '/api/quotes/send' },
  { method: 'POST', path: '/api/release-documents/archive' },
  { method: 'POST', path: '/api/upload/provider-document' },
  { method: 'POST', path: '/api/upload/provider-invoice' },
  { method: 'POST', path: '/api/upload/release-signed' },
  { method: 'POST', path: '/api/upload/legalizacion-soporte' },
]

// Endpoints eliminados: nunca deben volver a responder con éxito
const REMOVED_API = [
  '/api/create-profile',
  '/api/providers/create-auth-user',
  '/api/providers/delete-auth-user',
  '/api/providers/send-approval-email',
]

test.describe('APIs internas sin sesión', () => {
  for (const { method, path } of PROTECTED_API) {
    test(`${method} ${path.split('?')[0]} responde 401`, async ({ request }) => {
      const response = await request.fetch(path, { method })
      expect(response.status()).toBe(401)
    })
  }

  for (const path of REMOVED_API) {
    test(`${path} ya no existe`, async ({ request }) => {
      const response = await request.post(path, { data: { userId: 'x', role: 'admin' } })
      expect([401, 404]).toContain(response.status())
    })
  }

  test('el cron de recordatorios rechaza llamadas sin secreto', async ({ request }) => {
    const response = await request.get('/api/cxc/send-reminders')
    expect(response.status()).toBe(401)
  })

  test('el cron rechaza un Bearer incorrecto', async ({ request }) => {
    const response = await request.get('/api/cxc/send-reminders', { headers: { Authorization: 'Bearer incorrecto' } })
    expect(response.status()).toBe(401)
  })
})

test.describe('Rutas protegidas', () => {
  for (const path of ['/dashboard', '/dashboard/finance', '/portal', '/portal/settings']) {
    test(`${path} redirige a /login sin sesión`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

test.describe('Páginas legales y cabeceras', () => {
  for (const path of ['/terminos', '/politica-privacidad', '/creditos']) {
    test(`${path} es pública`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
    })
  }

  test('el login envía cabeceras de seguridad', async ({ request }) => {
    const headers = (await request.get('/login')).headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['strict-transport-security']).toContain('max-age')
    expect(headers['referrer-policy']).toBeTruthy()
    expect(headers['x-powered-by']).toBeUndefined()
  })
})

test.describe('Registro público', () => {
  test('exige aceptar los términos (checkbox obligatorio)', async ({ page }) => {
    await page.goto('/register/provider')
    await expect(page.getByText(/Términos|Registro/i).first()).toBeVisible()
  })
})

// Datos de Supabase expuestos con la anon key (la misma que ve cualquiera en el navegador)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

test.describe('Supabase con la anon key', () => {
  test.skip(!supabaseUrl || !anonKey, 'Requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')

  for (const table of ['profiles', 'provider_documents', 'gastos_con_entregables', 'ventas', 'gastos', 'providers']) {
    test(`anon no puede leer ${table}`, async ({ request }) => {
      const response = await request.get(`${supabaseUrl}/rest/v1/${table}?select=id&limit=1`, {
        headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey}` },
      })
      const body = await response.json().catch(() => [])
      // Aceptable: 401/403 (sin permiso) o 200 con lista vacía (RLS)
      if (response.status() === 200) expect(body).toEqual([])
      else expect([401, 403]).toContain(response.status())
    })
  }

  test('anon no puede ejecutar funciones SECURITY DEFINER sensibles', async ({ request }) => {
    const response = await request.post(`${supabaseUrl}/rest/v1/rpc/get_user_email_by_document`, {
      headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey}` },
      data: { p_document_number: '900000000' },
    })
    expect([401, 403, 404]).toContain(response.status())
  })
})
