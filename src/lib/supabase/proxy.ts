import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Roles que pueden acceder al dashboard administrativo
const ADMIN_ROLES = ['admin', 'pm', 'administrativo']

// Endpoints /api que no requieren sesión de usuario:
// - register: alta pública de proveedores (con rate limit y validación propias)
// - send-reminders: lo invoca el cron de Vercel con CRON_SECRET (validado en la ruta)
// - health: monitor de uptime, sin datos sensibles
const PUBLIC_API_PATHS = ['/api/providers/register', '/api/cxc/send-reminders', '/api/health']

function isPublicApi(pathname: string): boolean {
    return PUBLIC_API_PATHS.includes(pathname)
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Clasificación de rutas
    const pathname = request.nextUrl.pathname
    const isApiRoute = pathname.startsWith('/api/')
    const isDashboardRoute = pathname.startsWith('/dashboard')
    const isPortalRoute = pathname.startsWith('/portal')
    // Cotizaciones vive bajo /dashboard pero su control de acceso real es por
    // permiso granular (quotes.view), no por el rol simple — la propia página
    // valida el permiso y RLS protege los datos, así que un proveedor con ese
    // permiso no debe ser rebotado aquí antes de llegar a esa verificación.
    const isPermissionGatedRoute = pathname.startsWith('/dashboard/quotes') || pathname.startsWith('/dashboard/legalizaciones')
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
    const isPublicProviderRoute = pathname.startsWith('/register/provider')

    // API: sin sesión → 401 salvo endpoints públicos explícitos. Cada ruta además
    // valida rol y propiedad por su cuenta (defensa en profundidad).
    if (isApiRoute) {
        if (!user && !isPublicApi(pathname)) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        return supabaseResponse
    }

    // Rutas públicas - permitir sin autenticación
    if (isPublicProviderRoute) {
        return supabaseResponse
    }

    // Rutas de auth - redirigir si ya está autenticado
    if (isAuthRoute && user) {
        // Obtener rol para redirigir a la ruta correcta
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        // Sin perfil no hay acceso a ninguna zona: se queda en el login (evita bucles de redirección)
        if (!profile?.role) {
            return supabaseResponse
        }
        if (profile.role === 'proveedor') {
            return NextResponse.redirect(new URL('/portal', request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Rutas protegidas - requieren autenticación
    if ((isDashboardRoute || isPortalRoute) && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar roles para rutas específicas
    if (user && (isDashboardRoute || isPortalRoute)) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
            console.error('[Middleware] Profile error:', profileError.message)
        }

        const userRole = profile?.role || ''

        // Un usuario autenticado sin perfil/rol no accede a ninguna zona protegida
        if (!userRole) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Proveedor intentando acceder al dashboard admin (excepto Cotizaciones,
        // gateado por permiso granular en la propia página + RLS)
        if (isDashboardRoute && userRole === 'proveedor' && !isPermissionGatedRoute) {
            return NextResponse.redirect(new URL('/portal', request.url))
        }

        // Admin/PM/Administrativo intentando acceder al portal de proveedores
        if (isPortalRoute && ADMIN_ROLES.includes(userRole)) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}
