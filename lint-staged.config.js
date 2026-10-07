/** Runs on staged files from .githooks/pre-commit. CI runs the full checks. */
export default {
  '*.{ts,tsx,js}': ['eslint --max-warnings 0 --fix', 'prettier --write'],
  // tsc checks the whole program, so it ignores the staged file list.
  '*.{ts,tsx}': () => 'tsc -b',
  '*.{json,css,html,yml,yaml}': 'prettier --write',
}
