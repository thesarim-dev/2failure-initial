/**
 * Product analytics with PostHog: funnels like sign-in drop-off, guest
 * conversion, tour completion and the first-set "aha". Off unless
 * VITE_POSTHOG_KEY is set; the SDK loads lazily and events fired before it is
 * ready are queued. No emails, workout details or camera data are sent:
 * only event names and a few small properties.
 */
type PostHog = (typeof import('posthog-js'))['default'];

let client: PostHog | null = null;
let loading: Promise<void> | null = null;
const queue: Array<(ph: PostHog) => void> = [];

function enabled(): boolean {
  return typeof window !== 'undefined' && !!import.meta.env.VITE_POSTHOG_KEY;
}

function load(): Promise<void> {
  if (!enabled()) return Promise.resolve();
  if (!loading) {
    loading = import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY as string, {
          api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com',
          person_profiles: 'identified_only',
          autocapture: false,
          capture_pageview: true,
          disable_session_recording: true,
          persistence: 'localStorage'
        });
        client = posthog;
        queue.splice(0).forEach((fn) => fn(posthog));
      })
      .catch(() => {
        // Analytics must never break the app.
      });
  }
  return loading;
}

function run(fn: (ph: PostHog) => void) {
  if (!enabled()) return;
  if (client) fn(client);
  else {
    queue.push(fn);
    void load();
  }
}

export function initAnalytics(): void {
  void load();
}

/** Record an event. Keep properties small and free of personal data. */
export function track(event: string, props?: Record<string, string | number | boolean | null | undefined>): void {
  run((ph) => ph.capture(event, props));
}

/** Link events to the account id (never the email). */
export function identify(userId: string, props?: { guest?: boolean }): void {
  run((ph) => ph.identify(userId, props));
}

export function resetAnalytics(): void {
  run((ph) => ph.reset());
}
