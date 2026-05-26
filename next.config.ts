import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@repo/shared', '@repo/ui'],
};

export default nextConfig;
