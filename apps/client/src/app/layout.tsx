import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My App',
  description: 'My Next.js client app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>Header</header>
        <main>{children}</main>
        <footer>Footer</footer>
      </body>
    </html>
  );
}
