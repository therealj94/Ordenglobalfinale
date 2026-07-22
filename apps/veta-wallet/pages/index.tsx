import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vetaWalletToken') : null;
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return null;
}
