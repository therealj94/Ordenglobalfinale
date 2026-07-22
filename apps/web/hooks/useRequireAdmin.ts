import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';

/**
 * Guards admin pages: redirects to /auth/login if not authenticated,
 * or /dashboard if authenticated but not an admin.
 */
export const useRequireAdmin = () => {
  const router = useRouter();
  const { user, fetchProfile } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const profile = user || (await fetchProfile());

      if (!profile) {
        router.replace('/auth/login');
        return;
      }

      if (profile.role !== 'admin') {
        router.replace('/dashboard');
        return;
      }

      setChecking(false);
    };

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { checking, user };
};
