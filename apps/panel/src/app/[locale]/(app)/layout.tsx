import { AuthGuard } from './auth-guard';
import { AppShell } from './app-shell';
import { RouteAccessGuard } from './route-access-guard';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <RouteAccessGuard>{children}</RouteAccessGuard>
      </AppShell>
    </AuthGuard>
  );
}
