import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/features/auth/components/AuthProvider'

export const metadata: Metadata = {
  title: 'Fonnetapp - Gestión Integrada',
  description: 'Sistema de gestión para agencias y editoriales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
