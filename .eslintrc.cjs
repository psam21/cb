/**
 * ESLint configuration
 * Foundation task F1: coding standards + a11y + prettier integration.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jsx-a11y', 'prettier'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': ['error'],
  // QW12: Enforce large file detection (raised threshold to 600 lines per request; future refactors can lower again)
  'max-lines': ['warn', { max: 600, skipBlankLines: true, skipComments: true }],
    'jsx-a11y/alt-text': ['warn'],
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],
      env: { jest: true },
    },
  ],
};
