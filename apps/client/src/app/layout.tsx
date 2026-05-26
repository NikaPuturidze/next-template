import type { Metadata } from 'next';
import './globals.css';
import { interFont } from '@repo/ui';

export const metadata: Metadata = {
  title: 'My App',
  description: 'My Next.js client app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={interFont.variable}>
      <body>
        <header>Header</header>
        <main>{children}</main>
        <footer>Footer</footer>
      </body>
    </html>
  );
}
