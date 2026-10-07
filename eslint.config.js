// @ts-check
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', 'reports']),

  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: false },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': 'error',
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      // Threat model T1: React escapes text; this is the escape hatch we never use.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML is banned: render untrusted data as text (threat T1).',
        },
      ],
      // NFR PR2: financial data is never persisted in the browser.
      'no-restricted-globals': [
        'error',
        ...['localStorage', 'sessionStorage', 'indexedDB'].map((name) => ({
          name,
          message: 'Financial data must not be persisted in the browser (NFR PR2).',
        })),
      ],
      'no-restricted-properties': [
        'error',
        ...['localStorage', 'sessionStorage', 'indexedDB'].map((property) => ({
          object: 'window',
          property,
          message: 'Financial data must not be persisted in the browser (NFR PR2).',
        })),
      ],
    },
  },

  {
    files: ['src/**/*.tsx'],
    extends: [jsxA11y.flatConfigs.strict, reactRefresh.configs.vite],
  },

  // Last, so it switches off every stylistic rule that Prettier owns.
  prettier,
])
