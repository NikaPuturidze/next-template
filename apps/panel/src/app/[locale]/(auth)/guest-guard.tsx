'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { getAccessClaims } from '@/auth/claims';
import { getDefaultPanelRoute } from '@/config/panel-routes';
import { getPersistedAccessToken } from '@/stores/auth-store';

type GuestGuardProps = {
  children: ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const [canShowAuth, setCanShowAuth] = useState(false);

  useEffect(() => {
    const accessToken = getPersistedAccessToken();

    if (accessToken) {
      router.replace(getDefaultPanelRoute(getAccessClaims(accessToken)) ?? '/login');
      return;
    }

    setCanShowAuth(true);
  }, [router]);

  if (!canShowAuth) {
    return null;
  }

  return children;
}
