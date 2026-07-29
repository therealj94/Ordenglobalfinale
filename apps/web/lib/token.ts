/**
 * Reads the `scope` claim out of a stored JWT without verifying it.
 *
 * Only ever used to decide how the UI should behave — never to authorize
 * anything. The server verifies the signature; a tampered scope here can only
 * change which screen the user sees, not what they're allowed to do.
 */
export function tokenScope(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.scope ?? null;
  } catch {
    return null;
  }
}

/**
 * True while the browser is holding the short-lived token issued at
 * registration, i.e. the user is mid-onboarding and has no full session yet.
 *
 * That token deliberately only authorizes the KYC endpoints, so a 401 from
 * anything else is the expected answer — not a dead session. Treating it as
 * one logs the user out in the middle of verifying and strands their account
 * as unverified forever.
 */
export function isOnboardingToken(token?: string | null): boolean {
  const value = token ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  return tokenScope(value) === 'onboarding';
}
