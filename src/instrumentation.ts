import * as Sentry from '@sentry/nextjs';

// Monitorización de errores del servidor. Sin SENTRY_DSN no hace nada (no rompe local ni CI).
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
    // Nunca enviar cuerpos de petición, cookies ni cabeceras de autorización
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.cookie;
          delete event.request.headers.authorization;
        }
      }
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
