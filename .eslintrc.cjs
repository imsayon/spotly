module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    '.turbo/',
    'next-env.d.ts',
  ],
  overrides: [
    {
      files: ['apps/api/**/*.ts', 'packages/**/*.ts', 'packages/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    },
    {
      files: ['apps/consumer/**/*.{ts,tsx}', 'apps/merchant/**/*.{ts,tsx}'],
      rules: {
        '@next/next/no-img-element': 'off',
        '@next/next/no-html-link-for-pages': 'off',
        'react/no-unescaped-entities': 'off',
      },
    },
  ],
};
