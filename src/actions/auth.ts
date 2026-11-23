'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getEmailService } from '@/lib/email/emailService'
import { provisionProviderAccess } from '@/lib/providers/provisionProviderAccess'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = (formData.get('identifier') as string)?.trim()
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        return { error: 'Correo o contraseña incorrectos.' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single()

    revalidatePath('/', 'layout')

    if (profile?.role === 'proveedor') {
        redirect('/portal')
    } else {
        redirect('/dashboard')
    }
}

// El autorregistro público está deshabilitado: los usuarios internos los crea un
// administrador (/api/admin/create-user) y los proveedores usan /register/provider.
export async function signup(_formData: FormData) {
    return { error: 'El registro público está deshabilitado. Solicita tu acceso a un administrador.' }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function resetPassword(formData: FormData) {
    const email = (formData.get('email') as string)?.trim().toLowerCase()

    if (!email) {
        return { success: true }
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Configuración del servidor incompleta' }
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // En producción nunca se usa una URL de localhost: el botón del correo llevaría a una página inexistente.
    const configuredSite = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/login\/?$/, '')
    const siteUrl =
        process.env.NODE_ENV === 'production' && (!configuredSite || /localhost|127\.0\.0\.1/.test(configuredSite))
            ? 'https://fonneta-app.vercel.app'
            : configuredSite

    // Generar link de recovery con admin API — sin rate limit de Supabase
    const generateRecoveryLink = () =>
        supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo: `${siteUrl}/login/update-password` },
        })

    let { data: linkData, error: linkError } = await generateRecoveryLink()
    let activation: { name: string } | null = null

    if (linkError || !linkData?.properties?.action_link) {
        // Proveedor registrado que nunca tuvo cuenta de acceso: se le crea y se le envía el enlace de activación.
        const provisioned = await provisionProviderAccess(supabaseAdmin, email)
        if (provisioned) {
            activation = { name: provisioned.name }
            ;({ data: linkData, error: linkError } = await generateRecoveryLink())
        }
    }

    if (linkError || !linkData?.properties?.action_link) {
        // No revelar si el correo existe o no (seguridad)
        return { success: true }
    }

    // Buscar nombre del usuario para el correo
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .ilike('email', email)
        .limit(1)
        .maybeSingle()

    const displayName = activation?.name || profile?.full_name || email

    // Enviar via SMTP propio (nodemailer) — sin límite de Supabase
    try {
        const emailService = getEmailService()
        if (activation) {
            await emailService.sendAccessActivationProvider(email, displayName, linkData.properties.action_link)
        } else {
            await emailService.sendPasswordResetProvider(email, displayName, linkData.properties.action_link)
        }
    } catch (emailError) {
        console.error('Error sending reset email:', emailError)
        return { error: 'No se pudo enviar el correo. Por favor contacta al administrador.' }
    }

    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    if (!password || password.length < 10) {
        return { error: 'La contraseña debe tener al menos 10 caracteres.' }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: formData.get('full_name') as string,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
