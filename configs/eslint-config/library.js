import js from '@eslint/js';
import ts from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

import globals from 'globals';
import { resolve } from 'node:path';

import eslintConfigPrettier from 'eslint-config-prettier';
import turboConfig from 'eslint-config-turbo/flat';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores(['node_modules/', 'dist/']),
  {
    files: ['**/*.ts?(x)'],
    plugins: {
      import: importPlugin,
      '@typescript-eslint': ts.plugin,
    },
    extends: [js.configs.recommended, ts.configs.recommended],
    settings: {
      'import/resolver': {
        typescript: {
          project: resolve(process.cwd(), 'tsconfig.json'),
        },
      },
    },
  },
  {
    files: ['**/*.js?(x)'],
    extends: [js.configs.recommended],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier,
  ...turboConfig,
]);
