import * as Sentry from '@sentry/nextjs';

// Errores del navegador (incluye Safari/iPhone). Sin NEXT_PUBLIC_SENTRY_DSN no hace nada.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
