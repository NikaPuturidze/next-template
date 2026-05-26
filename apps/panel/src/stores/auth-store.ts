'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthTokens, PanelAuthUser } from '@/types/auth';

type AuthState = {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  user: PanelAuthUser | null;
  setSession: (session: { tokens: AuthTokens; user?: PanelAuthUser | null }) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: PanelAuthUser | null) => void;
  clearSession: () => void;
};

export const AUTH_STORAGE_KEY = 'panel-auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      accessTokenExpiresAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      user: null,
      setSession: ({ tokens, user }) =>
        set({
          accessToken: tokens.accessToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshToken: tokens.refreshToken,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          user: user ?? null,
        }),
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshToken: tokens.refreshToken,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        }),
      setUser: (user) => set({ user }),
      clearSession: () =>
        set({
          accessToken: null,
          accessTokenExpiresAt: null,
          refreshToken: null,
          refreshTokenExpiresAt: null,
          user: null,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
    },
  ),
);

export function getPersistedAccessToken() {
  const persistedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!persistedAuth) {
    return null;
  }

  try {
    const parsed = JSON.parse(persistedAuth) as { state?: Pick<AuthState, 'accessToken'> };

    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}
