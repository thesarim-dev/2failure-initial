/**
 * Crash and error reporting with Sentry. Off unless VITE_SENTRY_DSN is set, and
 * the SDK is loaded lazily so it never slows the first paint. Only technical
 * error details are sent: no workout data, and never camera images.
 */
type SentryModule = typeof import('@sentry/react');

let sentry: SentryModule | null = null;

export async function initErrorTracking(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || typeof window === 'undefined') return;
  try {
    sentry = await import('@sentry/react');
    sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? undefined,
      // Errors only; no performance tracing or session replay (keeps it free and private).
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend(event) {
        // Never send emails or other user details.
        if (event.user) event.user = { id: event.user.id };
        return event;
      }
    });
  } catch {
    // Reporting must never break the app.
  }
}

/** Attach the signed-in account id (not the email) to error reports. */
export function setErrorUser(id: string | null): void {
  sentry?.setUser(id ? { id } : null);
}

/** Report a handled error (e.g. a failed save) without crashing. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  sentry?.captureException(error, context ? { extra: context } : undefined);
}
