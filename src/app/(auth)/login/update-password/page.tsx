'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/actions/auth'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.')
            return
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.set('password', password)
        const result = await updatePassword(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="w-full max-w-md space-y-8 p-8">
                {/* Logo */}
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <img src="/logo.png" alt="Fonnettapp Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Nueva contraseña
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Ingresa y confirma tu nueva contraseña de acceso
                    </p>
                </div>

                {success ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center space-y-4">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h2 className="text-lg font-black text-slate-800">¡Contraseña actualizada!</h2>
                        <p className="text-sm text-slate-500">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                        <Link
                            href="/login"
                            className="inline-block mt-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
                        >
                            Ir al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
                        {/* Nueva contraseña */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                Nueva contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    required
                                    placeholder="Repite la contraseña"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Indicador de coincidencia */}
                        {confirm.length > 0 && (
                            <p className={`text-xs font-semibold ${password === confirm ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {password === confirm ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                            </p>
                        )}

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                                <p className="text-xs font-semibold text-rose-600">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-xl transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                        </button>

                        <p className="text-center text-xs text-slate-400">
                            <Link href="/login" className="hover:text-slate-600 font-semibold transition-colors">
                                Volver al inicio de sesión
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    )
}
