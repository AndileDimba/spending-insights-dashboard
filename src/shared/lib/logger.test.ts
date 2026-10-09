import { describe, expect, it, vi } from 'vitest'

import { logger } from './logger'

describe('logger', () => {
  it('writes the event and its details to the console in development', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    logger.error('api.request_failed', { kind: 'network', endpoint: '/goals' })

    expect(consoleError).toHaveBeenCalledWith('[api.request_failed]', {
      kind: 'network',
      endpoint: '/goals',
    })
  })

  it('stays quiet in production until a monitoring service is connected', () => {
    vi.stubEnv('DEV', false)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    logger.error('api.request_failed')

    expect(consoleError).not.toHaveBeenCalled()
  })
})
