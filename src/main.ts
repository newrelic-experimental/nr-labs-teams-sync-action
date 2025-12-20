import * as core from '@actions/core'
import { AppConfig } from './app-config.js'

export async function doAction(appConfig: AppConfig): Promise<void> {
  try {
    core.debug('running teams sync action')
    await appConfig.teamsSyncAction().run()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else if (typeof error === 'string') {
      core.setFailed(error)
    } else {
      core.setFailed('Unknown error')
    }
  } finally {
    core.debug('teams sync action complete')
  }
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
/* istanbul ignore next */
export async function run(): Promise<void> {
  /* istanbul ignore next */
  await doAction(new AppConfig())
}
