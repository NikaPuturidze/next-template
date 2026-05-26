import type { AccessClaims } from '@/types/auth';

export type AccessRole = 'brandOwner' | 'superAdmin';

export type RouteAccessPolicy = {
  anyOf?: AccessRole[];
};

export type PanelRoute = {
  href: string;
  labelKey: string;
  access?: RouteAccessPolicy;
  showInSidebar: boolean;
  sidebarGroup?: 'admin';
};

export const PANEL_ROUTES: PanelRoute[] = [
  {
    href: '/brands',
    labelKey: 'navigation.brands',
    access: { anyOf: ['superAdmin'] },
    showInSidebar: true,
    sidebarGroup: 'admin',
  },
  {
    href: '/categories',
    labelKey: 'navigation.categories',
    access: { anyOf: ['superAdmin'] },
    showInSidebar: true,
    sidebarGroup: 'admin',
  },
  {
    href: '/attributes',
    labelKey: 'navigation.attributes',
    access: { anyOf: ['superAdmin'] },
    showInSidebar: true,
    sidebarGroup: 'admin',
  },
  {
    href: '/brand',
    labelKey: 'navigation.brand',
    access: { anyOf: ['brandOwner', 'superAdmin'] },
    showInSidebar: true,
  },
];

export function findPanelRoute(pathname: string) {
  return PANEL_ROUTES
    .filter((route) => pathname === route.href || pathname.startsWith(`${route.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];
}

export function getDefaultPanelRoute(claims: AccessClaims) {
  return PANEL_ROUTES.find((route) => canAccessPolicy(route.access, claims))?.href ?? null;
}

export function canAccessPolicy(policy: RouteAccessPolicy | undefined, claims: AccessClaims) {
  if (!policy?.anyOf?.length) {
    return true;
  }

  return policy.anyOf.some((role) => hasRole(role, claims));
}

function hasRole(role: AccessRole, claims: AccessClaims) {
  switch (role) {
    case 'brandOwner':
      return claims.isBrandOwner;
    case 'superAdmin':
      return claims.isSuperAdmin;
  }
}
