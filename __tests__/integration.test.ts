/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectTeamToBe"] }] */

/**
 * Integration tests
 */

import 'dotenv/config'
import { HttpClient } from '@actions/http-client'
import {
  HttpPostFunc,
  HttpPostResponse,
  newGraphQLClient
} from '../src/nerdgraph/graphql.js'
import { newNerdgraphClient, toRegion } from '../src/nerdgraph/nerdgraph.js'
import {
  newTeamsClient,
  TeamEntity,
  TeamResource,
  TeamsClient
} from '../src/nerdgraph/teams.js'
import { newUsersClient, UsersClient } from '../src/nerdgraph/users.js'
import { LoggerStub } from './nerdgraph/stubs.js'

const DEFAULT_TEST_TIMEOUT_MS = 15000
const ENV_INPUT_TEST_TIMEOUT_MS_KEY = 'INPUT_TEST-TIMEOUT-MS'
const ENV_INPUT_API_KEY = 'INPUT_API-KEY'
const ENV_INPUT_ORG_ID_KEY = 'INPUT_ORG-ID'
const ENV_INPUT_REGION_KEY = 'INPUT_REGION'
const ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_KEY =
  'INPUT_AUTHENTICATION-DOMAIN-ID-1'
const ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_1_KEY =
  'INPUT_AUTHENTICATION-DOMAIN-ID-1-USER-1'
const ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_2_KEY =
  'INPUT_AUTHENTICATION-DOMAIN-ID-1-USER-2'
const ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_KEY =
  'INPUT_AUTHENTICATION-DOMAIN-ID-2'
const ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_USER_1_KEY =
  'INPUT_AUTHENTICATION-DOMAIN-ID-2-USER-1'
const TEAM_NAME = 'Integration Test Team'
const TEAM_DESCRIPTION_1 = 'This is a team created during integration tests'
const TEAM_DESCRIPTION_2 =
  'This is an updated team created during integration tests'
const TEAM_ALIASES_1 = ['integration_test']
const TEAM_ALIASES_2 = ['integration_test', 'integration_test_2']
const TEAM_TAGS_1 = { foo: ['bar'] }
const TEAM_ENTITY_TAGS_1 = [{ key: 'foo', values: ['bar'] }]
const TEAM_TAGS_2 = { foo: ['bar', 'baz'] }
const TEAM_ENTITY_TAGS_2 = [{ key: 'foo', values: ['bar', 'baz'] }]
const TEAM_RESOURCES_1: TeamResource[] = [
  {
    type: 'EMAIL',
    title: 'Test Email',
    content: 'fake-user-1@fake-domain-123.com'
  },
  {
    type: 'GITHUB',
    title: 'GitHub Repository',
    content: 'https://github.com/fake-organization-123/fake-repo-123'
  }
]
const TEAM_RESOURCES_2: TeamResource[] = [
  {
    type: 'SLACK',
    title: 'Slack Channel',
    content: 'https://fake-organization-123.slack.com'
  },
  {
    type: 'GITLAB',
    title: 'GitLab Repository',
    content: 'https://gitlab.com/fake-organization-123/fake-repo-123'
  }
]

type UserInfo = {
  authenticationDomainId: string
  email: string
  name?: string
  guid?: string
}

function httpPostFunc(httpClient: HttpClient): HttpPostFunc {
  return async (
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
}

async function expectTeamToBe(
  teamsClient: TeamsClient,
  team: TeamEntity,
  id: string | null,
  name: string,
  description: string,
  aliases: string[],
  tags: { key: string; values: string[] }[],
  resources: TeamResource[],
  membershipId: string | null,
  users: UserInfo[]
) {
  expect(team.id.length).toBeGreaterThan(0)
  if (id) {
    expect(team.id).toBe(id)
  }
  expect(team.name).toBe(name)
  expect(team.description).toBe(description)
  expect(team.aliases).toEqual(aliases)
  expect(team.tags).toEqual(tags)
  expect(team.resources).toEqual(resources)
  expect(team.membership.id.length).toBeGreaterThan(0)
  if (membershipId) {
    expect(team.membership.id).toBe(membershipId)
  }

  const members = await teamsClient.getTeamMembers(team)
  expect(members.length).toBe(users.length)

  for (const user of users) {
    const member = members.find((m) => m.guid === user.guid)

    expect(member).toBeDefined()
    expect(member!.guid).toBe(user.guid)
    expect(member!.name).toBe(user.name)
  }
}

describe('Integration Tests', () => {
  const users: UserInfo[] = [],
    timeoutMs = Number(
      process.env[ENV_INPUT_TEST_TIMEOUT_MS_KEY] || DEFAULT_TEST_TIMEOUT_MS
    )
  let authenticationDomainId1: string
  let authenticationDomainId2: string
  let usersClient: UsersClient
  let teamsClient: TeamsClient
  let teamId: string
  let teamMembershipId: string

  beforeAll(() => {
    if (!process.env[ENV_INPUT_ORG_ID_KEY]) {
      throw new Error(`Missing ${ENV_INPUT_ORG_ID_KEY} environment variable`)
    }

    if (!process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_KEY]) {
      throw new Error(
        `Missing ${ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_KEY} environment variable`
      )
    }

    if (!process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_1_KEY]) {
      throw new Error(
        `Missing ${ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_1_KEY} environment variable`
      )
    }

    if (!process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_2_KEY]) {
      throw new Error(
        `Missing ${ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_2_KEY} environment variable`
      )
    }

    if (!process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_KEY]) {
      throw new Error(
        `Missing ${ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_KEY} environment variable`
      )
    }

    if (!process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_USER_1_KEY]) {
      throw new Error(
        `Missing ${ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_USER_1_KEY} environment variable`
      )
    }

    if (!process.env[ENV_INPUT_API_KEY]) {
      throw new Error(`Missing ${ENV_INPUT_API_KEY} environment variable`)
    }

    const orgId = process.env[ENV_INPUT_ORG_ID_KEY],
      apiKey = process.env[ENV_INPUT_API_KEY],
      region = toRegion(process.env[ENV_INPUT_REGION_KEY] || 'US'),
      nerdgraphClient = newNerdgraphClient(
        newGraphQLClient(new LoggerStub(), httpPostFunc(new HttpClient()))
      )

    authenticationDomainId1 =
      process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_KEY]
    users.push({
      authenticationDomainId: authenticationDomainId1,
      email: process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_1_KEY]
    })
    users.push({
      authenticationDomainId: authenticationDomainId1,
      email: process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_USER_2_KEY]
    })

    authenticationDomainId2 =
      process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_KEY]
    users.push({
      authenticationDomainId: authenticationDomainId2,
      email: process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_2_USER_1_KEY]
    })

    usersClient = newUsersClient(nerdgraphClient, apiKey, region)
    teamsClient = newTeamsClient(
      nerdgraphClient,
      usersClient,
      orgId,
      apiKey,
      region
    )
  })
  it(
    'should retrieve user information by email for each member',
    async () => {
      for (const user of users) {
        const userId = await usersClient.getUserIdByEmail(
          user.authenticationDomainId,
          user.email
        )
        expect(userId).not.toBeNull()
        expect(userId!.length).toBeGreaterThan(0)

        const userEntity = await usersClient.getUserById(userId!)
        expect(userEntity).not.toBeNull()
        expect(userEntity!.guid.length).toBeGreaterThan(0)
        expect(userEntity!.name.length).toBeGreaterThan(0)

        user.guid = userEntity!.guid
        user.name = userEntity!.name
      }
    },
    timeoutMs
  )
  it(
    'should create a team with the given settings and members',
    async () => {
      const team = await teamsClient.createTeam(
        TEAM_NAME,
        [
          {
            authenticationDomainId: users[0].authenticationDomainId,
            members: [users[0].email]
          }
        ],
        TEAM_DESCRIPTION_1,
        TEAM_ALIASES_1,
        TEAM_TAGS_1,
        TEAM_RESOURCES_1
      )

      await expectTeamToBe(
        teamsClient,
        team,
        null,
        TEAM_NAME,
        TEAM_DESCRIPTION_1,
        TEAM_ALIASES_1,
        TEAM_ENTITY_TAGS_1,
        TEAM_RESOURCES_1,
        null,
        [users[0]]
      )

      teamId = team.id
      teamMembershipId = team.membership.id
    },
    timeoutMs
  )
  it(
    'should get the created team by name',
    async () => {
      const team = await teamsClient.getTeamByName(TEAM_NAME)

      expect(team).not.toBeNull()
      await expectTeamToBe(
        teamsClient,
        team!,
        teamId,
        TEAM_NAME,
        TEAM_DESCRIPTION_1,
        TEAM_ALIASES_1,
        TEAM_ENTITY_TAGS_1,
        TEAM_RESOURCES_1,
        teamMembershipId,
        [users[0]]
      )
    },
    timeoutMs
  )
  it(
    'should update team with given settings and new members',
    async () => {
      const team = await teamsClient.updateTeam(
        TEAM_NAME,
        [
          {
            authenticationDomainId: users[1].authenticationDomainId,
            members: [users[1].email]
          },
          {
            authenticationDomainId: users[2].authenticationDomainId,
            members: [users[2].email]
          }
        ],
        TEAM_DESCRIPTION_2,
        TEAM_ALIASES_2,
        TEAM_TAGS_2,
        TEAM_RESOURCES_2
      )

      await expectTeamToBe(
        teamsClient,
        team,
        teamId,
        TEAM_NAME,
        TEAM_DESCRIPTION_2,
        TEAM_ALIASES_2,
        TEAM_ENTITY_TAGS_2,
        TEAM_RESOURCES_2,
        teamMembershipId,
        [users[1], users[2]]
      )
    },
    timeoutMs
  )
  it(
    'should get the updated team by name',
    async () => {
      const team = await teamsClient.getTeamByName(TEAM_NAME)

      expect(team).not.toBeNull()
      await expectTeamToBe(
        teamsClient,
        team!,
        teamId,
        TEAM_NAME,
        TEAM_DESCRIPTION_2,
        TEAM_ALIASES_2,
        TEAM_ENTITY_TAGS_2,
        TEAM_RESOURCES_2,
        teamMembershipId,
        [users[1], users[2]]
      )
    },
    timeoutMs
  )
  it(
    'should delete the created team',
    async () => {
      const guid = await teamsClient.removeTeam(TEAM_NAME)

      expect(guid).toBe(teamId)
    },
    timeoutMs
  )
})
