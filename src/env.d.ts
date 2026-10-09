interface ImportMetaEnv {
  /**
   * 'true' builds the demo with the mock API inside it (ADR 0008). The
   * development server always uses the mocks; other builds never contain them.
   */
  readonly VITE_ENABLE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
