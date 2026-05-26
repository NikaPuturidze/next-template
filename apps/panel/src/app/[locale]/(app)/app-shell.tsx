'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Button,
  ChevronRightIcon,
  LogOutIcon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  ShieldIcon,
  StoreIcon,
} from '@repo/ui';
import { cn } from '@repo/shared/lib/utils';
import { useTranslations } from 'next-intl';

import { getAccessClaims } from '@/auth/claims';
import { canAccessPolicy, PANEL_ROUTES } from '@/config/panel-routes';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const t = useTranslations('AppShell');
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const accessClaims = getAccessClaims(accessToken);
  const visibleRoutes = PANEL_ROUTES.filter(
    (item) => item.showInSidebar && canAccessPolicy(item.access, accessClaims),
  );
  const rootRoutes = visibleRoutes.filter((item) => !item.sidebarGroup);
  const adminRoutes = visibleRoutes.filter((item) => item.sidebarGroup === 'admin');
  const isAdminRouteActive = adminRoutes.some((item) => isRouteActive(pathname, item.href));
  const [isAdminOpen, setIsAdminOpen] = useState(isAdminRouteActive);

  useEffect(() => {
    if (isAdminRouteActive) {
      setIsAdminOpen(true);
    }
  }, [isAdminRouteActive]);

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-10 text-foreground">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <StoreIcon className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('title')}</span>
                  <span className="truncate text-xs text-muted-foreground">{t('subtitle')}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {rootRoutes.length ? (
            <SidebarGroup>
              <SidebarGroupLabel>{t('sections.panel')}</SidebarGroupLabel>
              <SidebarMenu>
                {rootRoutes.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isRouteActive(pathname, item.href)}>
                      <Link href={item.href}>
                        <StoreIcon />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ) : null}

          {adminRoutes.length ? (
            <SidebarGroup>
              <SidebarGroupLabel>{t('sections.admin')}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="button"
                    isActive={isAdminRouteActive}
                    onClick={() => setIsAdminOpen((value) => !value)}
                  >
                    <ShieldIcon />
                    <span>{t('sections.admin')}</span>
                    <ChevronRightIcon
                      className={cn(
                        'ml-auto transition-transform duration-200',
                        isAdminOpen && 'rotate-90',
                      )}
                    />
                  </SidebarMenuButton>
                  {isAdminOpen ? (
                    <SidebarMenuSub>
                      {adminRoutes.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isRouteActive(pathname, item.href)}
                          >
                            <Link href={item.href}>
                              <span>{t(item.labelKey)}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          ) : null}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton type="button" onClick={handleLogout}>
                <LogOutIcon />
                <span>{t('logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-[#e2e8f0] bg-white px-6">
          <h1 className="text-sm font-semibold">{t('title')}</h1>
        </header>
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
