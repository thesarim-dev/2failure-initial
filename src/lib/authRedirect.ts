/** OAuth return URL — use VITE_SITE_URL on Vercel production; runtime origin elsewhere. */
export function getAuthRedirectUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return window.location.origin;
}
