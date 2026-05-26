import type { AccessClaims } from '@/types/auth';

export function getAccessClaims(accessToken: string | null | undefined): AccessClaims {
  if (!accessToken) {
    return { isBrandOwner: false, isSuperAdmin: false };
  }

  try {
    const [, payload] = accessToken.split('.');

    if (!payload) {
      return { isBrandOwner: false, isSuperAdmin: false };
    }

    const claims = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;

    return {
      isBrandOwner: isTruthyClaim(claims.bo),
      isSuperAdmin: isTruthyClaim(claims.sa) || claims.al === '2' || claims.al === 2,
    };
  } catch {
    return { isBrandOwner: false, isSuperAdmin: false };
  }
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  return atob(paddedBase64);
}

function isTruthyClaim(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'True';
}
