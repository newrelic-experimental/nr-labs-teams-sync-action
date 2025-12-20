import { jest } from '@jest/globals'

jest.unstable_mockModule('@actions/core', async () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn()
}))

const mockedCore = await import('@actions/core')
const { CoreLogger } = await import('../src/logger.js')

describe('logger', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return true for isDebugEnabled when RUNNER_DEBUG is set to 1', () => {
    process.env.RUNNER_DEBUG = '1'
    const logger = new CoreLogger()

    expect(logger.isDebugEnabled()).toBe(true)

    delete process.env.RUNNER_DEBUG
  })

  it('should return false for isDebugEnabled when RUNNER_DEBUG is not set to 1', () => {
    process.env.RUNNER_DEBUG = '0'
    const logger = new CoreLogger()

    expect(logger.isDebugEnabled()).toBe(false)

    delete process.env.RUNNER_DEBUG
  })

  it('should call core.debug on logger.debug', () => {
    const logger = new CoreLogger()

    logger.debug('test debug message')
    expect(mockedCore.debug).toHaveBeenCalledWith('test debug message')
  })

  it('should call core.info on logger.info', () => {
    const logger = new CoreLogger()

    logger.info('test info message')
    expect(mockedCore.info).toHaveBeenCalledWith('test info message')
  })

  it('should call core.warning on logger.warn', () => {
    const logger = new CoreLogger()

    logger.warn('test warn message')
    expect(mockedCore.warning).toHaveBeenCalledWith('test warn message')
  })

  it('should call core.error on logger.error', () => {
    const logger = new CoreLogger()

    logger.error('test error message')
    expect(mockedCore.error).toHaveBeenCalledWith('test error message')
  })
})
