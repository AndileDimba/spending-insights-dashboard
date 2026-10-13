// Mutation testing (#24, ADR 0003): Stryker changes the code in small ways
// and checks that a test fails each time. A mutant that survives means a
// fault the tests would not catch.

// The tests run in UTC (vite.config.ts), but Stryker runs Vitest in worker
// threads, where the test config's TZ comes too late to change the time zone.
// Set here, it is inherited by the test runner processes Stryker starts.
process.env.TZ = 'UTC'

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: { configFile: 'vite.config.ts' },
  // Money, dates, formatting, validation and the API client carry the most
  // risk (docs/testing-strategy.md).
  mutate: ['src/shared/lib/**/*.ts', 'src/shared/api/**/*.ts', '!src/**/*.test.ts'],
  // Only the tests that cover a mutant run against it.
  coverageAnalysis: 'perTest',
  // A static mutant changes a module-level constant, such as an Intl
  // formatter's options. The Vitest runner does not reload the module for each
  // mutant, so these would be reported as surviving whether or not the tests
  // catch them. They are listed as ignored instead of counted.
  ignoreStatic: true,
  // More parallel test runners than this made every mutant survive on Windows.
  concurrency: 4,
  // Set just below the first full score (100%), as docs/testing-strategy.md asks.
  thresholds: { high: 100, low: 95, break: 90 },
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  tempDirName: '.stryker-tmp',
}
