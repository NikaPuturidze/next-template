'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { useRouter } from '@/i18n/navigation';
import { getAccessClaims } from '@/auth/claims';
import {
  clearStoredAuthRedirectError,
  getAuthRedirectErrorFromSearchParams,
  storeAuthRedirectError,
} from '@/auth/redirect-errors';
import { extractAuthTokens } from '@/auth/tokens';
import { getDefaultPanelRoute } from '@/config/panel-routes';
import { useAuthStore } from '@/stores/auth-store';
import type { PanelAuthResponse } from '@/types/auth';

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const error = getAuthRedirectErrorFromSearchParams(searchParams, 'external');

    if (error) {
      storeAuthRedirectError(error);
      router.replace('/login');
      return;
    }

    clearStoredAuthRedirectError();

    const response = getAuthResponseFromSearchParams(searchParams);

    if (response) {
      try {
        const tokens = extractAuthTokens(response);
        setSession({ tokens, user: response.user });
        router.replace(getDefaultPanelRoute(getAccessClaims(tokens.accessToken)) ?? '/login');
        return;
      } catch {
        storeAuthRedirectError({ code: 'InvalidExternalLogin', source: 'external' });
      }
    }

    router.replace('/login');
  }, [router, searchParams, setSession]);

  return null;
}

function getAuthResponseFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
): PanelAuthResponse | null {
  const response = {
    accessToken: searchParams.get('accessToken') ?? undefined,
    accessTokenExpiresAt: searchParams.get('accessTokenExpiresAt') ?? undefined,
    refreshToken: searchParams.get('refreshToken') ?? undefined,
    refreshTokenExpiresAt: searchParams.get('refreshTokenExpiresAt') ?? undefined,
  };

  return response.accessToken ? (response as PanelAuthResponse) : null;
}
