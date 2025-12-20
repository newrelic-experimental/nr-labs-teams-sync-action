import { GraphQLClient, GraphQLResponse } from '../../src/nerdgraph/graphql.js'
import {
  NerdgraphClient,
  NerdgraphError
} from '../../src/nerdgraph/nerdgraph.js'
import { UserEntity, UsersClient } from '../../src/nerdgraph/users.js'
import {
  TeamEntity,
  TeamResource,
  TeamsClient,
  UpdateMembershipResult
} from '../../src/nerdgraph/teams.js'
import { TeamsSyncAction } from '../../src/action.js'
import { Logger } from '../../src/logger.js'

export class LoggerStub implements Logger {
  isDebugEnabled() {
    return false
  }
  debug() {}
  info() {}
  warn() {}
  error() {}
}

export function newGraphQLClientWithResponses(
  ...responses: GraphQLResponse[]
): GraphQLClientStub {
  return new GraphQLClientStub(responses)
}

class GraphQLClientStub implements GraphQLClient {
  calls: number = 0
  responses: GraphQLResponse[]
  url: string = ''
  headers: Record<string, string> = {}
  payload: unknown = null

  constructor(responses: GraphQLResponse[]) {
    this.responses = responses
  }

  async query(
    url: string,
    headers: Record<string, string>,
    payload: unknown
  ): Promise<GraphQLResponse> {
    const index = this.calls

    this.url = url
    this.headers = headers
    this.payload = payload

    this.calls += 1
    return this.responses[index]
  }
}

export function newNerdgraphClientWithOneResponse(
  response: unknown
): NerdgraphClientStub {
  return new NerdgraphClientStub([[response]])
}

export function newNerdgraphClientWithResponses(
  ...responses: unknown[][]
): NerdgraphClientStub {
  return new NerdgraphClientStub(responses)
}

class NerdgraphClientStub implements NerdgraphClient {
  calls: number = 0
  responses: unknown[][]

  constructor(responses: unknown[][]) {
    this.responses = responses
  }

  async query(): Promise<unknown[]> {
    const index = this.calls

    this.calls += 1
    return this.responses[index]
  }
}

export function newUsersClient(): UsersClientStub {
  return new UsersClientStub([], [], [])
}

export function newUsersClientWithError(): UsersClientStub {
  return new UsersClientStub([], [], [], true)
}

export function newUsersClientWithId(userId: string): UsersClientStub {
  return new UsersClientStub([userId], [], [])
}

export function newUsersClientWithUsersById(
  ...users: (UserEntity | null)[]
): UsersClientStub {
  return new UsersClientStub([], users, [])
}

export function newUsersClientWithUsersByEmail(
  ...users: (UserEntity | null)[]
): UsersClientStub {
  return new UsersClientStub([], [], users)
}

export function newUsersClientWithResponses(
  userIds: string[],
  usersById: (UserEntity | null)[],
  usersByEmail: (UserEntity | null)[]
): UsersClientStub {
  return new UsersClientStub(userIds, usersById, usersByEmail)
}

class UsersClientStub implements UsersClient {
  userIdByEmailCalls: number = 0
  userIds: string[]
  userByIdCalls: number = 0
  usersById: (UserEntity | null)[]
  userByEmailCalls: number = 0
  usersByEmail: (UserEntity | null)[]
  error: boolean

  constructor(
    userIds: string[],
    usersById: (UserEntity | null)[],
    usersByEmail: (UserEntity | null)[],
    error: boolean = false
  ) {
    this.userIds = userIds
    this.usersById = usersById
    this.usersByEmail = usersByEmail
    this.error = error
  }

  async getUserIdByEmail(): Promise<string | null> {
    const index = this.userIdByEmailCalls

    this.userIdByEmailCalls += 1

    if (this.error) {
      throw new NerdgraphError('Simulated error in getUserIdByEmail')
    }

    return this.userIds[index]
  }

  async getUserById(): Promise<UserEntity | null> {
    const index = this.userByIdCalls

    this.userByIdCalls += 1

    if (this.error) {
      throw new NerdgraphError('Simulated error in getUserById')
    }

    return this.usersById[index]
  }

  async getUserByEmail(): Promise<UserEntity | null> {
    const index = this.userByEmailCalls

    this.userByEmailCalls += 1

    if (this.error) {
      throw new NerdgraphError('Simulated error in getUserByEmail')
    }

    return this.usersByEmail[index]
  }
}

export function newTeamsClient(): TeamsClientStub {
  return new TeamsClientStub()
}

export function newTeamsClientWithError(): TeamsClientStub {
  return new TeamsClientStub(true)
}

type CreateTeamInput = {
  name: string
  members: string[]
  description: string
  aliases: string[]
  tags: Record<string, string[]>
  resources: TeamResource[]
}

class TeamsClientStub implements TeamsClient {
  teamsCreated: CreateTeamInput[] = []
  teamsUpdated: CreateTeamInput[] = []
  teamsRemoved: string[] = []
  createTeamCalls: number = 0
  updateTeamCalls: number = 0
  removeTeamCalls: number = 0
  error: boolean

  constructor(error: boolean = false) {
    this.createTeamCalls = 0
    this.updateTeamCalls = 0
    this.removeTeamCalls = 0
    this.error = error
  }

  getTeamByName(): Promise<TeamEntity | null> {
    throw new Error('Method not implemented.')
  }

  getTeamMembers(): Promise<UserEntity[]> {
    throw new Error('Method not implemented.')
  }

  addMembers(): Promise<string[]> {
    throw new Error('Method not implemented.')
  }

  removeMembers(): Promise<string[]> {
    throw new Error('Method not implemented.')
  }

  updateMembership(): Promise<UpdateMembershipResult> {
    throw new Error('Method not implemented.')
  }

  async createTeam(
    name: string,
    members: string[],
    description: string,
    aliases: string[],
    tags: Record<string, string[]>,
    resources: TeamResource[]
  ): Promise<TeamEntity> {
    this.createTeamCalls += 1

    if (this.error) {
      throw new NerdgraphError('Simulated error in createTeam')
    }

    this.teamsCreated.push({
      name,
      members,
      description,
      aliases,
      tags,
      resources
    })

    return {
      id: 'foo',
      name: name,
      description: description,
      aliases: aliases,
      resources: resources,
      membership: { id: '42' },
      tags: Object.keys(tags).map((key) => ({ key, values: tags[key] }))
    }
  }

  async updateTeam(
    name: string,
    members: string[],
    description: string,
    aliases: string[],
    tags: Record<string, string[]>,
    resources: TeamResource[]
  ): Promise<TeamEntity> {
    this.updateTeamCalls += 1

    if (this.error) {
      throw new NerdgraphError('Simulated error in updateTeam')
    }

    this.teamsUpdated.push({
      name,
      members,
      description,
      aliases,
      tags,
      resources
    })

    return {
      id: 'foo',
      name: name,
      description: description,
      aliases: aliases,
      resources: resources,
      membership: { id: '42' },
      tags: Object.keys(tags).map((key) => ({ key, values: tags[key] }))
    }
  }

  async removeTeam(name: string): Promise<string> {
    this.removeTeamCalls += 1

    if (this.error) {
      throw new NerdgraphError('Simulated error in updateTeam')
    }

    this.teamsRemoved.push(name)

    return 'foo'
  }
}

export function newTeamsSyncAction(): TeamsSyncActionStub {
  return new TeamsSyncActionStub()
}

export function newTeamsSyncActionWithError(): TeamsSyncActionStub {
  return new TeamsSyncActionStub(
    new Error('Simulated error in TeamsSyncAction run')
  )
}

export function newTeamsSyncActionWithErrorString(): TeamsSyncActionStub {
  return new TeamsSyncActionStub(
    'Simulated error string in TeamsSyncAction run'
  )
}

export function newTeamsSyncActionWithErrorOther(): TeamsSyncActionStub {
  return new TeamsSyncActionStub(42)
}

class TeamsSyncActionStub implements TeamsSyncAction {
  runCalls: number = 0
  error?: Error | string | number

  constructor(error?: Error | string | number) {
    this.runCalls = 0
    this.error = error
  }

  async run(): Promise<void> {
    this.runCalls += 1

    if (this.error) {
      throw this.error
    }
  }

  processFilesAdded(): Promise<TeamEntity[]> {
    throw new Error('Method not implemented.')
  }

  processFilesModified(): Promise<TeamEntity[]> {
    throw new Error('Method not implemented.')
  }

  processFilesDeleted(): Promise<string[]> {
    throw new Error('Method not implemented.')
  }
}
