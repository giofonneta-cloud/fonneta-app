import Link from 'next/link'
import { LoginForm } from '@/features/auth/components'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <img src="/logo.png" alt="Fonnetapp Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold">Bienvenido</h1>
          <p className="mt-2 text-gray-600">Ingresa con tu correo electrónico y contraseña</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-gray-600">
          ¿Eres proveedor y no tienes acceso?{' '}
          <Link href="/register/provider" className="text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
