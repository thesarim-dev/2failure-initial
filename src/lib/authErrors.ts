export function formatOAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('unable to exchange external code') ||
    lower.includes('invalid_client') ||
    lower.includes('client secret is invalid')
  ) {
    return (
      'Google sign-in is misconfigured. In Supabase → Authentication → Providers → Google, ' +
      're-enter the Client ID and Client Secret from Google Cloud Console (Web application OAuth client). ' +
      'Google redirect URI must be: https://jfceueuzwzznbyjazhuu.supabase.co/auth/v1/callback'
    );
  }

  return message;
}
