import libraryConfig from '@repo/eslint-config/library.js';

export default [
  ...libraryConfig,
  {
    files: ['**/*.ts?(x)'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
];
