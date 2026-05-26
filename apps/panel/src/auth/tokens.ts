import type { AuthTokens, PanelAuthResponse } from '@/types/auth';

export function extractAuthTokens(response: PanelAuthResponse): AuthTokens {
  const { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt } = response;

  if (!accessToken || !accessTokenExpiresAt || !refreshToken || !refreshTokenExpiresAt) {
    throw new Error('Login response did not include auth tokens.');
  }

  return { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt };
}
