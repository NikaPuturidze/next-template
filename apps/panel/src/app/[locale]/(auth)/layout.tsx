import { GuestGuard } from './guest-guard';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <div className="flex h-screen w-full items-center justify-center">{children}</div>
    </GuestGuard>
  );
}
