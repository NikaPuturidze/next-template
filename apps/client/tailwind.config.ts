import type { Config } from 'tailwindcss';

const config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx,css}',
  ],
} satisfies Config;

export default config;
