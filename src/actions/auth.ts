'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getEmailService } from '@/lib/email/emailService'

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

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/check-email')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function resetPassword(formData: FormData) {
    const email = (formData.get('email') as string)?.trim()

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Configuración del servidor incompleta' }
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generar link de recovery con admin API — sin rate limit de Supabase
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
            redirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/login\/?$/, '')}/login/update-password`,
        },
    })

    if (linkError || !linkData?.properties?.action_link) {
        // No revelar si el correo existe o no (seguridad)
        return { success: true }
    }

    // Buscar nombre del usuario para el correo
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('email', email)
        .single()

    const displayName = profile?.full_name || email

    // Enviar via SMTP propio (nodemailer) — sin límite de Supabase
    try {
        const emailService = getEmailService()
        await emailService.sendPasswordResetProvider(
            email,
            displayName,
            linkData.properties.action_link
        )
    } catch (emailError) {
        console.error('Error sending reset email:', emailError)
        return { error: 'No se pudo enviar el correo. Por favor contacta al administrador.' }
    }

    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

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
