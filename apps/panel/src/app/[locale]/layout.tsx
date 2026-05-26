import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { interFont } from '@repo/ui';
import { QueryProvider } from '@repo/shared';
import { cn } from '@repo/shared/lib/utils';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';
import { AuthHttpProvider } from './auth-http-provider';

import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

type RootLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Pick<RootLayoutProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'AppShell' });

  return {
    title: t('title'),
    description: t('title'),
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={cn(interFont.variable, 'font-sans', inter.variable)}>
      <body>
        <NextIntlClientProvider>
          <QueryProvider>
            <AuthHttpProvider>
              <main>{children}</main>
            </AuthHttpProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
