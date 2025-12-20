import * as core from '@actions/core'

export interface Logger {
  isDebugEnabled(): boolean
  debug(message: string): void
  info(message: string): void
  warn(message: string | Error): void
  error(message: string | Error): void
}

export class CoreLogger implements Logger {
  isDebugEnabled(): boolean {
    return process.env.RUNNER_DEBUG === '1'
  }

  debug(message: string): void {
    core.debug(message)
  }

  info(message: string): void {
    core.info(message)
  }

  warn(message: string | Error): void {
    core.warning(message)
  }

  error(message: string): void {
    core.error(message)
  }
}
