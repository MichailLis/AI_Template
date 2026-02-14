import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  { ignores: ['dist', 'src/shared/api/generated'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      react,
      'jsx-a11y': jsxA11y,
      sonarjs,
      unicorn,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...(react.configs.recommended.rules ?? {}),
      ...(jsxA11y.configs.recommended.rules ?? {}),
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }],

      // СТРОГИЕ ПРАВИЛА ДЛЯ ПРОДАКШН-КОДА
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../app/**',
                '../pages/**',
                '../widgets/**',
                '../features/**',
                '../entities/**',
                '../shared/**',
              ],
              message:
                'Please use absolute paths with aliases (e.g. @/shared/ui/...) instead of relative paths when importing from other layers.',
            },
          ],
        },
      ],

      'no-nested-ternary': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],

      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-autofocus': 'warn',

      'sonarjs/cognitive-complexity': ['warn', 18],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/void-use': 'off',
      'sonarjs/slow-regex': 'warn',
      'sonarjs/pseudo-random': 'off',

      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/no-null': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/prefer-export-from': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-type-error': 'off',
      'unicorn/consistent-existence-index-check': 'off',
      'unicorn/no-negated-condition': 'off',
      'unicorn/no-nested-ternary': 'off',
    },
  },
);
