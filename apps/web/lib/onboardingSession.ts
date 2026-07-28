import { apiClient } from './apiClient';

function tokenScope(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.scope ?? null;
  } catch {
    return null;
  }
}

/**
 * If the browser is holding the short-lived onboarding token issued at
 * registration, trade it for a real session now that the user is verified.
 *
 * The onboarding token deliberately only authorizes the KYC endpoints, so
 * without this step a freshly-verified user would be bounced back to the
 * login screen the moment they reached the dashboard. Safe to call when the
 * stored token is already a normal access token — it's a no-op then.
 */
export async function upgradeOnboardingSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('accessToken');
  if (!token || tokenScope(token) !== 'onboarding') return false;

  try {
    const { data } = await apiClient.post('/auth/exchange-onboarding', { onboardingToken: token });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    // Still unverified, or the token expired — the caller's own auth guard
    // takes it from here (login screen), rather than failing loudly.
    return false;
  }
}
