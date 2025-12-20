import { jest } from '@jest/globals'

jest.unstable_mockModule('@actions/core', async () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn()
}))

import { HttpClient } from '@actions/http-client'
import { CoreLogger } from '../src/logger.js'
import { Region } from '../src/nerdgraph/nerdgraph.js'
import { Context } from '../src/util/util.js'
import {
  newGraphQLClientWithResponses,
  newNerdgraphClientWithOneResponse,
  newTeamsClient,
  newTeamsSyncAction,
  newTeamsSyncActionWithError,
  newTeamsSyncActionWithErrorOther,
  newTeamsSyncActionWithErrorString,
  newUsersClient
} from './nerdgraph/stubs.js'
import { HttpPostResponse } from '../src/nerdgraph/graphql.js'

const mockedCore = await import('@actions/core')
const { doAction } = await import('../src/main.js')

describe('doAction', () => {
  it('should call setFailed if teamsSyncAction throws an error', async () => {
    const teamsSyncAction = newTeamsSyncActionWithError()

    const fakeConfig = {
      appContext: new Context(),
      inputs: () => ({
        orgId: 'fake-org-id',
        apiKey: 'fake-api-key',
        region: Region.US,
        filesAdded: [],
        filesModified: [],
        filesDeleted: []
      }),
      logger: () => new CoreLogger(),
      httpClient: () => new HttpClient(),
      httpPostFunc: () => async (): Promise<HttpPostResponse> => {
        return { url: '', status: 200, message: 'OK', body: '' }
      },
      graphQLClient: () =>
        newGraphQLClientWithResponses({ data: null, errors: [] }),
      nerdgraphClient: () => newNerdgraphClientWithOneResponse({}),
      usersClient: () => newUsersClient(),
      teamsClient: () => newTeamsClient(),
      teamsSyncAction: () => teamsSyncAction
    }

    await doAction(fakeConfig)

    expect(teamsSyncAction.runCalls).toBe(1)

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(1)
  })
  it('should call setFailed if teamsSyncAction throws an error string', async () => {
    const teamsSyncAction = newTeamsSyncActionWithErrorString()

    const fakeConfig = {
      appContext: new Context(),
      inputs: () => ({
        orgId: 'fake-org-id',
        apiKey: 'fake-api-key',
        region: Region.US,
        filesAdded: [],
        filesModified: [],
        filesDeleted: []
      }),
      logger: () => new CoreLogger(),
      httpClient: () => new HttpClient(),
      httpPostFunc: () => async (): Promise<HttpPostResponse> => {
        return { url: '', status: 200, message: 'OK', body: '' }
      },
      graphQLClient: () =>
        newGraphQLClientWithResponses({ data: null, errors: [] }),
      nerdgraphClient: () => newNerdgraphClientWithOneResponse({}),
      usersClient: () => newUsersClient(),
      teamsClient: () => newTeamsClient(),
      teamsSyncAction: () => teamsSyncAction
    }

    await doAction(fakeConfig)

    expect(teamsSyncAction.runCalls).toBe(1)

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(1)
  })
  it('should call setFailed if teamsSyncAction throws something else', async () => {
    const teamsSyncAction = newTeamsSyncActionWithErrorOther()

    const fakeConfig = {
      appContext: new Context(),
      inputs: () => ({
        orgId: 'fake-org-id',
        apiKey: 'fake-api-key',
        region: Region.US,
        filesAdded: [],
        filesModified: [],
        filesDeleted: []
      }),
      logger: () => new CoreLogger(),
      httpClient: () => new HttpClient(),
      httpPostFunc: () => async (): Promise<HttpPostResponse> => {
        return { url: '', status: 200, message: 'OK', body: '' }
      },
      graphQLClient: () =>
        newGraphQLClientWithResponses({ data: null, errors: [] }),
      nerdgraphClient: () => newNerdgraphClientWithOneResponse({}),
      usersClient: () => newUsersClient(),
      teamsClient: () => newTeamsClient(),
      teamsSyncAction: () => teamsSyncAction
    }

    await doAction(fakeConfig)

    expect(teamsSyncAction.runCalls).toBe(1)

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(1)
  })
  it('should run the teams sync action', async () => {
    const teamsSyncAction = newTeamsSyncAction()

    const fakeConfig = {
      appContext: new Context(),
      inputs: () => ({
        orgId: 'fake-org-id',
        apiKey: 'fake-api-key',
        region: Region.US,
        filesAdded: [],
        filesModified: [],
        filesDeleted: []
      }),
      logger: () => new CoreLogger(),
      httpClient: () => new HttpClient(),
      httpPostFunc: () => async (): Promise<HttpPostResponse> => {
        return { url: '', status: 200, message: 'OK', body: '' }
      },
      graphQLClient: () =>
        newGraphQLClientWithResponses({ data: null, errors: [] }),
      nerdgraphClient: () => newNerdgraphClientWithOneResponse({}),
      usersClient: () => newUsersClient(),
      teamsClient: () => newTeamsClient(),
      teamsSyncAction: () => teamsSyncAction
    }

    await doAction(fakeConfig)

    expect(teamsSyncAction.runCalls).toBe(1)

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0)
  })
})
