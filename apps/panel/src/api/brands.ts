'use client';

import { useApiMutation, useApiQuery } from '@repo/shared';

import { getAccessClaims } from '@/auth/claims';
import { getDefaultPanelRoute } from '@/config/panel-routes';
import { useAuthStore } from '@/stores/auth-store';
import type { BrandContacts, BrandOverview } from '@/types/brand';

export function useMyBrand() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const canOpenBrandRoute = Boolean(getDefaultPanelRoute(getAccessClaims(accessToken)));

  return useApiQuery<BrandOverview | null, unknown, ['brand', 'me']>({
    queryKey: ['brand', 'me'],
    url: '/brands/me',
    enabled: canOpenBrandRoute,
    retry: false,
  });
}

export function useBrands(enabled = true) {
  return useApiQuery<BrandOverview[], unknown, ['brands']>({
    queryKey: ['brands'],
    url: '/brands',
    enabled,
    retry: false,
  });
}

export function useUpdateBrandDetails(brandId: number | null, onSuccess?: () => void) {
  return useApiMutation<BrandOverview, { name: string; legalName?: string | null }, unknown, unknown>({
    method: 'put',
    url: () => `/brands/${brandId}`,
    onSuccess,
  });
}

export function useUpdateBrandContacts(brandId: number | null, onSuccess?: () => void) {
  return useApiMutation<BrandContacts, BrandContacts, unknown, unknown>({
    method: 'put',
    url: () => `/brands/${brandId}/contacts`,
    onSuccess,
  });
}

export function useUpdateBrandLogo(brandId: number | null, onSuccess?: () => void) {
  return useApiMutation<BrandOverview, FormData, unknown, unknown>({
    method: 'put',
    url: () => `/brands/${brandId}/logo`,
    onSuccess,
  });
}
