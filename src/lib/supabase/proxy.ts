import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Roles que pueden acceder al dashboard administrativo
const ADMIN_ROLES = ['admin', 'pm', 'administrativo']

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
                setAll(cookiesToSet: any[]) {
                    cookiesToSet.forEach(({ name, value }: any) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }: any) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Clasificación de rutas
    const pathname = request.nextUrl.pathname
    const isDashboardRoute = pathname.startsWith('/dashboard')
    const isPortalRoute = pathname.startsWith('/portal')
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
    const isPublicProviderRoute = pathname.startsWith('/register/provider')

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
            .single()

        if (profile?.role === 'proveedor') {
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
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role || ''

        // Proveedor intentando acceder al dashboard admin
        if (isDashboardRoute && userRole === 'proveedor') {
            return NextResponse.redirect(new URL('/portal', request.url))
        }

        // Admin/PM/Administrativo intentando acceder al portal de proveedores
        if (isPortalRoute && ADMIN_ROLES.includes(userRole)) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}
