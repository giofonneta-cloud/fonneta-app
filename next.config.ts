import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

// CSP en modo Report-Only: no bloquea nada, pero el navegador reporta violaciones en
// consola. Cuando esté limpia se promueve a `Content-Security-Policy`.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // MCP server de desarrollo (/_next/mcp): nunca expuesto en producción
  experimental: {
    mcpServer: isDev,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
