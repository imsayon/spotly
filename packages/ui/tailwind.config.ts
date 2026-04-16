import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        spotly: {
          emerald: 'var(--emerald-primary)',
          'emerald-light': 'var(--emerald-light)',
          golden: 'var(--golden-primary)',
          'golden-light': 'var(--golden-light)',
          surface: 'var(--surface-color)',
          border: 'var(--border-color)',
        },
      },
    },
  },
  plugins: [],
};
export default config;
