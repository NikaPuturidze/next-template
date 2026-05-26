'use client';

import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';
import { getAccessClaims } from '@/auth/claims';
import { getDefaultPanelRoute } from '@/config/panel-routes';
import { getPersistedAccessToken, useAuthStore } from '@/stores/auth-store';

export default function Entry() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const accessToken = getPersistedAccessToken();

    if (accessToken) {
      router.replace(getDefaultPanelRoute(getAccessClaims(accessToken)) ?? '/login');
      return;
    }

    clearSession();
    router.replace('/login');
  }, [clearSession, router]);

  return null;
}
