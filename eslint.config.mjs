import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Recommended Next.js 16 ESLint flat config (create-next-app equivalent).
// `next lint` was removed in Next 16 — run `npm run lint` (eslint .) instead.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Default ignores of eslint-config-next are preserved below.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;