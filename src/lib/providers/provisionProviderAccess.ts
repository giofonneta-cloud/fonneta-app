import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProvisionedAccess {
  userId: string;
  name: string;
}

interface ProviderRow {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  billing_email: string | null;
}

const EMAIL_SHAPE = /^[^\s@,()"]+@[^\s@,()"]+\.[^\s@,()"]+$/;

async function findProviderWithoutAccess(admin: SupabaseClient, email: string): Promise<ProviderRow | null> {
  for (const column of ['contact_email', 'billing_email'] as const) {
    // ilike por prefijo tolera mayúsculas y espacios finales; la igualdad exacta se confirma abajo
    // porque "_" actúa como comodín en ilike.
    const { data } = await admin
      .from('providers')
      .select('id, business_name, contact_name, contact_email, billing_email')
      .is('user_id', null)
      .ilike(column, `${email}%`)
      .limit(5);

    const match = (data as ProviderRow[] | null)?.find((row) => row[column]?.trim().toLowerCase() === email);
    if (match) return match;
  }
  return null;
}

// Un proveedor puede estar registrado (por ejemplo, importado) sin haber tenido nunca una cuenta de
// acceso. Aquí se le crea esa cuenta y se vincula a su registro existente; no crea otro proveedor.
// Devuelve null si el correo no corresponde a ningún proveedor sin cuenta.
export async function provisionProviderAccess(admin: SupabaseClient, rawEmail: string): Promise<ProvisionedAccess | null> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_SHAPE.test(email)) return null;

  const provider = await findProviderWithoutAccess(admin, email);
  if (!provider) return null;

  const name = provider.contact_name?.trim() || provider.business_name?.trim() || email;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name, role: 'proveedor' },
  });
  if (createError || !created.user) return null;

  const userId = created.user.id;

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: userId, email, full_name: name, role: 'proveedor' }, { onConflict: 'id' });

  // El .is('user_id', null) evita pisar una vinculación hecha en paralelo.
  const { data: linked, error: linkError } = await admin
    .from('providers')
    .update({ user_id: userId })
    .eq('id', provider.id)
    .is('user_id', null)
    .select('id');

  if (profileError || linkError || !linked?.length) {
    await admin.auth.admin.deleteUser(userId);
    return null;
  }

  return { userId, name };
}
