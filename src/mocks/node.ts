import { setupServer } from 'msw/node'

/** MSW server for tests. Request handlers are added with the mock API (#11). */
export const server = setupServer()
