import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from '@eslint-react/eslint-plugin';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
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
      'import-x': importPlugin,
      '@eslint-react': reactPlugin,
      'jsx-a11y-x': jsxA11y,
      sonarjs,
      unicorn,
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.app.json',
        }),
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...(jsxA11y.configs.recommended.rules ?? {}),
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // eslint-plugin-react was replaced by @eslint-react (ESLint 10 support). These are the
      // rules the old react/recommended set enabled, mapped to their @eslint-react counterparts.
      '@eslint-react/no-missing-component-display-name': 'error', // react/display-name
      '@eslint-react/no-missing-key': 'error', // react/jsx-key
      '@eslint-react/jsx-no-comment-textnodes': 'error', // react/jsx-no-comment-textnodes
      '@eslint-react/dom-no-unsafe-target-blank': 'error', // react/jsx-no-target-blank
      '@eslint-react/jsx-no-children-prop': 'error', // react/no-children-prop
      '@eslint-react/dom-no-dangerously-set-innerhtml-with-children': 'error', // react/no-danger-with-children
      '@eslint-react/no-direct-mutation-state': 'error', // react/no-direct-mutation-state
      '@eslint-react/dom-no-find-dom-node': 'error', // react/no-find-dom-node
      '@eslint-react/dom-no-render-return-value': 'error', // react/no-render-return-value
      // react/no-deprecated: the deprecated and removed React APIs it covered
      '@eslint-react/dom-no-render': 'error',
      '@eslint-react/dom-no-hydrate': 'error',
      '@eslint-react/no-component-will-mount': 'error',
      '@eslint-react/no-component-will-receive-props': 'error',
      '@eslint-react/no-component-will-update': 'error',
      '@eslint-react/dom-no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }], // react/no-unknown-property

      // СТРОГИЕ ПРАВИЛА ДЛЯ ПРОДАКШН-КОДА
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      'import-x/order': [
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

      // No @eslint-react / ESLint 10 counterpart exists for react/jsx-boolean-value ('never'),
      // react/self-closing-comp and react/jsx-max-depth (max 6), so the same constraints are
      // expressed as syntax selectors. jsx-max-depth was a warning; a single rule entry has one
      // severity, so all three are errors here.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute > JSXExpressionContainer > Literal[value=true]',
          message:
            'Omit the value of a boolean JSX prop that is set to true (react/jsx-boolean-value "never").',
        },
        {
          selector:
            'JSXElement[children.length=0]:not([openingElement.selfClosing=true]), JSXElement[children.length=1][children.0.type="JSXText"][children.0.value=/^\\s*\\n\\s*$/]:not([openingElement.selfClosing=true])',
          message:
            'Use a self-closing tag for an element without children (react/self-closing-comp).',
        },
        {
          selector: Array.from({ length: 8 }, () => ':matches(JSXElement, JSXFragment)').join(
            ' > ',
          ),
          message:
            'JSX is nested more than 6 levels deep (react/jsx-max-depth). Extract a component.',
        },
      ],
      'no-nested-ternary': 'error',
      'max-lines': ['warn', { max: 350, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'warn',
        { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      'max-params': ['warn', 5],
      'max-depth': ['warn', 4],
      'max-len': ['warn', { code: 160, ignoreStrings: true, ignoreTemplateLiterals: true }],
      '@eslint-react/jsx-no-useless-fragment': 'error', // react/jsx-no-useless-fragment
      '@eslint-react/no-nested-component-definitions': 'error', // react/no-unstable-nested-components

      'jsx-a11y-x/alt-text': 'error',
      'jsx-a11y-x/anchor-is-valid': 'error',
      'jsx-a11y-x/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y-x/click-events-have-key-events': 'warn',
      'jsx-a11y-x/no-autofocus': 'warn',

      'sonarjs/cognitive-complexity': ['warn', 15],
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
  {
    files: ['src/shared/api/model/**/*.ts'],
    rules: {
      'max-len': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
);
