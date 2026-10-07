// @ts-check
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import testingLibrary from 'eslint-plugin-testing-library'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const TEST_FILES = ['src/**/*.test.{ts,tsx}', 'src/test/**']

/*
 * Architecture boundaries (ADR 0006), enforced with the built-in
 * no-restricted-imports rule so they need no extra dependencies.
 *
 * Two rules together cover both kinds of import:
 * 1. A relative import never climbs out of its own area (one feature, one
 *    shared segment, app or mocks). Crossing areas must use the @/ alias.
 * 2. Alias imports are restricted per area, so dependencies only flow
 *    app -> features -> shared.
 */
const forbid = {
  app: { regex: '^@/app(/|$)', message: 'Only the app layer may import from app (ADR 0006).' },
  features: {
    regex: '^@/features(/|$)',
    message: 'Shared code must not depend on features (ADR 0006).',
  },
  featureInternals: {
    regex: '^@/features/[^/]+/',
    message: "Import another feature through its index.ts, e.g. '@/features/goals' (ADR 0006).",
  },
  mocks: {
    regex: '^@/mocks(/|$)',
    message: 'Mocks are only used by the app bootstrap and tests (ADR 0008).',
  },
  anySrc: {
    regex: '^@/',
    message: 'shared/lib holds pure utilities and imports nothing else from src (ADR 0006).',
  },
}

/** @type {{ root: string, forbidden: (keyof typeof forbid)[] }[]} */
const AREAS = [
  { root: 'src/app', forbidden: ['mocks', 'featureInternals'] },
  { root: 'src/features/*', forbidden: ['app', 'mocks', 'featureInternals'] },
  { root: 'src/shared/*', forbidden: ['app', 'features', 'mocks'] },
  // After src/shared/* so that it takes precedence for shared/lib files.
  { root: 'src/shared/lib', forbidden: ['anySrc'] },
  { root: 'src/mocks', forbidden: ['app', 'features'] },
]

// Deepest folder nesting inside an area that the relative-import rule covers.
const MAX_DEPTH = 6

function boundaryConfigs() {
  return AREAS.flatMap(({ root, forbidden }) =>
    Array.from({ length: MAX_DEPTH + 1 }, (_, depth) => {
      const files = [`${root}/${'*/'.repeat(depth)}*.{ts,tsx}`]
      const leavesArea = {
        regex: `^(\\.\\./){${String(depth + 1)}}`,
        message: 'Relative imports must stay inside their own area. Use the @/ alias instead.',
      }
      const patterns = (/** @type {boolean} */ isTest) => [
        leavesArea,
        ...forbidden.filter((key) => !(isTest && key === 'mocks')).map((key) => forbid[key]),
      ]
      return [
        {
          files,
          ignores: TEST_FILES,
          rules: { 'no-restricted-imports': ['error', { patterns: patterns(false) }] },
        },
        {
          files: files.map((glob) => glob.replace('*.{ts,tsx}', '*.test.{ts,tsx}')),
          rules: { 'no-restricted-imports': ['error', { patterns: patterns(true) }] },
        },
      ]
    }).flat(),
  )
}

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

  {
    // Enforces the query and async conventions in docs/testing-strategy.md.
    files: TEST_FILES,
    extends: [testingLibrary.configs['flat/react']],
  },

  ...boundaryConfigs(),

  // Last, so it switches off every stylistic rule that Prettier owns.
  prettier,
])
