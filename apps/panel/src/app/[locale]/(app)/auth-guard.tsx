'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { getPersistedAccessToken, useAuthStore } from '@/stores/auth-store';

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const requireAccessToken = () => {
      if (getPersistedAccessToken()) {
        setIsAuthorized(true);
        return;
      }

      clearSession();
      setIsAuthorized(false);
      router.replace('/login');
    };

    requireAccessToken();

    window.addEventListener('focus', requireAccessToken);
    window.addEventListener('storage', requireAccessToken);

    const intervalId = window.setInterval(requireAccessToken, 1_000);

    return () => {
      window.removeEventListener('focus', requireAccessToken);
      window.removeEventListener('storage', requireAccessToken);
      window.clearInterval(intervalId);
    };
  }, [clearSession, router]);

  if (!isAuthorized) {
    return null;
  }

  return children;
}
