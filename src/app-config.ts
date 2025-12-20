/* istanbul ignore file */

// This file provides an application configuration class that manages
// dependencies used throughout the action. Because this file creates real
// implementations and these implementations can potentially allocate resources
// such as sockets or file handles, this file is ignored for code coverage.

import { HttpClient } from '@actions/http-client'
import { getInputs, Inputs } from './inputs.js'
import { CoreLogger, Logger } from './logger.js'
import {
  GraphQLClient,
  HttpPostFunc,
  HttpPostResponse,
  newGraphQLClient
} from './nerdgraph/graphql.js'
import { NerdgraphClient, newNerdgraphClient } from './nerdgraph/nerdgraph.js'
import { newTeamsClient, TeamsClient } from './nerdgraph/teams.js'
import { newUsersClient, UsersClient } from './nerdgraph/users.js'
import { Context } from './util/util.js'
import { newTeamsSyncAction, TeamsSyncAction } from './action.js'

export class AppConfig {
  appContext: Context

  constructor() {
    this.appContext = new Context()
  }

  inputs(): Inputs {
    return this.appContext.singleton<Inputs>('inputs', () => getInputs())
  }

  logger(): Logger {
    return this.appContext.singleton<Logger>('logger', () => new CoreLogger())
  }

  httpClient(): HttpClient {
    return this.appContext.singleton<HttpClient>(
      'httpClient',
      () => new HttpClient()
    )
  }

  httpPostFunc(): HttpPostFunc {
    const httpClient = this.httpClient()
    return this.appContext.singleton<HttpPostFunc>(
      'httpPostFunc',
      () =>
        async (
          url: string,
          headers: Record<string, string>,
          body: string
        ): Promise<HttpPostResponse> => {
          const response = await httpClient.post(url, body, headers)

          return {
            url: response.message.url || url,
            status: response.message.statusCode || 0,
            message: response.message.statusMessage || '',
            body: await response.readBody()
          }
        }
    )
  }

  graphQLClient(): GraphQLClient {
    return this.appContext.singleton<GraphQLClient>('graphQLClient', () =>
      newGraphQLClient(this.logger(), this.httpPostFunc())
    )
  }

  nerdgraphClient(): NerdgraphClient {
    return this.appContext.singleton<NerdgraphClient>('nerdgraphClient', () =>
      newNerdgraphClient(this.graphQLClient())
    )
  }

  usersClient(): UsersClient {
    const inputs = this.inputs()
    return this.appContext.singleton<UsersClient>('usersClient', () =>
      newUsersClient(this.nerdgraphClient(), inputs.apiKey, inputs.region)
    )
  }

  teamsClient(): TeamsClient {
    const inputs = this.inputs()
    return this.appContext.singleton<TeamsClient>('teamsClient', () =>
      newTeamsClient(
        this.nerdgraphClient(),
        this.usersClient(),
        inputs.orgId,
        inputs.apiKey,
        inputs.region
      )
    )
  }

  teamsSyncAction(): TeamsSyncAction {
    return this.appContext.singleton<TeamsSyncAction>('teamsSyncAction', () =>
      newTeamsSyncAction(this.teamsClient(), this.inputs())
    )
  }
}
