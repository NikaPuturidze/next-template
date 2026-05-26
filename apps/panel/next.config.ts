import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import sharedNextConfig from '../../next.config';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  ...sharedNextConfig,
  images: {
    ...sharedNextConfig.images,
    remotePatterns: [
      ...(sharedNextConfig.images?.remotePatterns ?? []),
      {
        protocol: 'https',
        hostname: '**.storage.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
