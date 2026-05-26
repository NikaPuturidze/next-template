'use client';

import { useEffect, type ReactNode } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { getAccessClaims } from '@/auth/claims';
import { canAccessPolicy, findPanelRoute, getDefaultPanelRoute } from '@/config/panel-routes';
import { useAuthStore } from '@/stores/auth-store';

type RouteAccessGuardProps = {
  children: ReactNode;
};

export function RouteAccessGuard({ children }: RouteAccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const accessClaims = getAccessClaims(accessToken);
  const route = findPanelRoute(pathname);
  const canAccessRoute = canAccessPolicy(route?.access, accessClaims);
  const redirectTarget = getDefaultPanelRoute(accessClaims) ?? '/login';

  useEffect(() => {
    if (!canAccessRoute) {
      router.replace(redirectTarget);
    }
  }, [canAccessRoute, redirectTarget, router]);

  if (!canAccessRoute) {
    return null;
  }

  return children;
}
