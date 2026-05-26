'use client';

import { useEffect, type ReactNode } from 'react';
import { configureAxiosAuth } from '@repo/shared';

import { useAuthStore } from '@/stores/auth-store';

type AuthHttpProviderProps = {
  children: ReactNode;
};

export function AuthHttpProvider({ children }: AuthHttpProviderProps) {
  useEffect(() => {
    configureAxiosAuth({
      clearTokens: () => useAuthStore.getState().clearSession(),
      getTokens: () => {
        const state = useAuthStore.getState();

        return {
          accessToken: state.accessToken,
          accessTokenExpiresAt: state.accessTokenExpiresAt,
          refreshToken: state.refreshToken,
          refreshTokenExpiresAt: state.refreshTokenExpiresAt,
        };
      },
      setTokens: (tokens) => {
        if (!tokens.accessTokenExpiresAt || !tokens.refreshTokenExpiresAt) {
          useAuthStore.getState().clearSession();
          return;
        }

        useAuthStore.getState().setTokens({
          accessToken: tokens.accessToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshToken: tokens.refreshToken,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        });
      },
    });
  }, []);

  return children;
}
