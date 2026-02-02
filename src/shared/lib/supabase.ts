import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente para uso en componentes del navegador (mantiene sesión de autenticación)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
