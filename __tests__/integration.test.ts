/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectTeamToBe"] }] */

/**
 * Integration tests
 */
import { jest } from '@jest/globals'

jest.unstable_mockModule('@actions/core', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn()
}))

const mockedCore = await import('@actions/core')

import { tmpdir } from 'node:os'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import 'dotenv/config'
import { HttpClient } from '@actions/http-client'
import {
  HttpPostFunc,
  HttpPostResponse,
  newGraphQLClient
} from '../src/nerdgraph/graphql.js'
import {
  NerdgraphError,
  newNerdgraphClient,
  toRegion
} from '../src/nerdgraph/nerdgraph.js'
import {
  TeamEntity,
  TeamMembersInput,
  TeamResource,
  TeamsClient
} from '../src/nerdgraph/teams.js'
// The teams client uses core.warning which is mocked using
// jest.unstable_mockModule, so we need to dynamically import it to get the
// mocking to work correctly. The types above are imported for type-checking
// purposes only. They can't be imported dynamically since there is no runtime
// representation of type imports and they produce no code, so those are
// imported statically.
// See https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
const { newTeamsClient } = await import('../src/nerdgraph/teams.js')
import { newUsersClient, UsersClient } from '../src/nerdgraph/users.js'
import { LoggerStub } from './nerdgraph/stubs.js'
// The teams sync action uses core.debug which is mocked using
// jest.unstable_mockModule, so we need to dynamically import it to get the
// mocking to work correctly.
// See https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
const { newTeamsSyncAction } = await import('../src/action.js')
import { Inputs } from '../src/inputs.js'

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
const TEAM1_NAME = 'Integration Test Team'
const TEAM1_DESCRIPTION_1 = 'This is a team created during integration tests'
const TEAM1_DESCRIPTION_2 =
  'This is an updated team created during integration tests'
const TEAM1_ALIASES_1 = ['integration_test']
const TEAM1_ALIASES_2 = ['integration_test', 'integration_test_updated']
const TEAM1_TAGS_1 = { foo: ['bar'] }
const TEAM1_ENTITY_TAGS_1 = [{ key: 'foo', values: ['bar'] }]
const TEAM1_TAGS_2 = { foo: ['bar', 'baz'] }
const TEAM1_ENTITY_TAGS_2 = [{ key: 'foo', values: ['bar', 'baz'] }]
const TEAM1_RESOURCES_1: TeamResource[] = [
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
const TEAM1_RESOURCES_2: TeamResource[] = [
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
const TEAM2_NAME = 'Integration Test Team 2'
const TEAM2_DESCRIPTION =
  'This is another team created during integration tests'
const TEAM2_ALIASES = ['integration_test_2']
const TEAM2_TAGS = { alpha: ['beta'] }
const TEAM2_ENTITY_TAGS = [{ key: 'alpha', values: ['beta'] }]
const TEAM2_RESOURCES: TeamResource[] = [
  {
    type: 'EMAIL',
    title: 'Test Email 2',
    content: 'fake-user-2@fake-domain-456.com'
  },
  {
    type: 'SLACK',
    title: 'Slack Channel 2',
    content: 'https://fake-organization-456.slack.com'
  }
]
const TEAM3_NAME = 'Integration Test Team 3'
const TEAM3_DESCRIPTION_1 =
  'This is yet another team created during integration tests'
const TEAM3_DESCRIPTION_2 =
  'This is yet another team created during integration tests - updated'
const TEAM3_ALIASES_1 = ['integration_test_3']
const TEAM3_ALIASES_2 = ['integration_test_3', 'integration_test_3_updated']
const TEAM3_TAGS_1 = { gamma: ['delta'] }
const TEAM3_TAGS_2 = { gamma: ['delta', 'epsilon'] }
const TEAM3_ENTITY_TAGS_1 = [{ key: 'gamma', values: ['delta'] }]
const TEAM3_ENTITY_TAGS_2 = [{ key: 'gamma', values: ['delta', 'epsilon'] }]
const TEAM3_RESOURCES: TeamResource[] = [
  {
    type: 'EMAIL',
    title: 'Test Email 3',
    content: 'fake-user-3@fake-domain-789.com'
  },
  {
    type: 'GITHUB',
    title: 'GitHub Repository 3',
    content: 'https://github.com/fake-organization-789/fake-repo-789'
  }
]
const TEAM4_NAME = 'Integration Test Team 4'
const TEAM4_DESCRIPTION =
  'This is a fourth team created during integration tests'
const TEAM4_ALIASES = ['integration_test_4']
const TEAM4_TAGS = { zeta: ['eta'] }
const TEAM4_ENTITY_TAGS = [{ key: 'zeta', values: ['eta'] }]
const TEAM4_RESOURCES: TeamResource[] = [
  {
    type: 'EMAIL',
    title: 'Test Email 4',
    content: 'fake-user-4@fake-domain-321.com'
  },
  {
    type: 'GITLAB',
    title: 'GitLab Repository 4',
    content: 'https://gitlab.com/fake-organization-321/fake-repo-321'
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

async function writeTeamDefinition(
  filePath: string,
  teamDefinition: {
    description: string
    aliases: string[]
    members: (string | TeamMembersInput)[]
    contacts: TeamResource[]
    links: TeamResource[]
    tags: Record<string, string[]>
  }
) {
  await writeFile(filePath, JSON.stringify(teamDefinition, null, 2), {
    encoding: 'utf-8'
  })
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

// This function surfaces the GraphQL errors from NerdGraph calls so we have
// better visibility into what went wrong during test failures.
function checkForNerdgraphErrorAndRethrow(err: unknown) {
  if (err instanceof NerdgraphError) {
    const nerdgraphError = err as NerdgraphError

    if (nerdgraphError.errors && nerdgraphError.errors.length > 0) {
      err.message += `\nGraphQL Errors:\n${JSON.stringify(
        nerdgraphError.errors,
        null,
        2
      )}`
    }
  }

  throw err
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
  let tempDir: string

  beforeAll(async () => {
    // 1. Validate all required environment variables are set

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

    // 2. Build users array from environment variables

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

    // 3. Create clients

    usersClient = newUsersClient(nerdgraphClient, apiKey, region)
    teamsClient = newTeamsClient(
      nerdgraphClient,
      usersClient,
      orgId,
      apiKey,
      region
    )

    // 4. Setup temporary directory for test files

    tempDir = await mkdtemp(join(tmpdir(), 'teams-sync-action-'))

    // 5. Setup mocked core logging functions to log to console
    ;(
      mockedCore.debug as jest.MockedFunction<typeof mockedCore.debug>
    ).mockImplementation((message: string) => {
      console.debug(message)
    })
    ;(
      mockedCore.info as jest.MockedFunction<typeof mockedCore.info>
    ).mockImplementation((message: string) => {
      console.info(message)
    })
    ;(
      mockedCore.warning as jest.MockedFunction<typeof mockedCore.warning>
    ).mockImplementation((message: string | Error) => {
      console.warn(message)
    })
    ;(
      mockedCore.error as jest.MockedFunction<typeof mockedCore.error>
    ).mockImplementation((message: string | Error) => {
      console.error(message)
    })
  })
  afterAll(async () => {
    // 1. Reset all Jest mocks
    jest.resetAllMocks()

    // 2. Unmock core module
    jest.unstable_unmockModule('@actions/core')

    // 3. Remove temporary directory
    await rm(tempDir, { recursive: true })
  })
  it(
    'should retrieve user information by email for each member',
    async () => {
      // Simultaneously collect the user entity information to use in later
      // tests and test the users client functionality.
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

        // The guid and name will be used in later tests to verify the correct
        // members are associated with the correct teams.
        user.guid = userEntity!.guid
        user.name = userEntity!.name
      }
    },
    timeoutMs
  )
  it(
    'should create a team with the given settings and members',
    async () => {
      try {
        const team = await teamsClient.createTeam(
          TEAM1_NAME,
          [
            {
              authenticationDomainId: users[0].authenticationDomainId,
              members: [users[0].email]
            }
          ],
          TEAM1_DESCRIPTION_1,
          TEAM1_ALIASES_1,
          TEAM1_TAGS_1,
          TEAM1_RESOURCES_1
        )

        await expectTeamToBe(
          teamsClient,
          team,
          null,
          TEAM1_NAME,
          TEAM1_DESCRIPTION_1,
          TEAM1_ALIASES_1,
          TEAM1_ENTITY_TAGS_1,
          TEAM1_RESOURCES_1,
          null,
          [users[0]]
        )

        teamId = team.id
        teamMembershipId = team.membership.id
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
  it(
    'should get the created team by name',
    async () => {
      try {
        const team = await teamsClient.getTeamByName(TEAM1_NAME)

        expect(team).not.toBeNull()
        await expectTeamToBe(
          teamsClient,
          team!,
          teamId,
          TEAM1_NAME,
          TEAM1_DESCRIPTION_1,
          TEAM1_ALIASES_1,
          TEAM1_ENTITY_TAGS_1,
          TEAM1_RESOURCES_1,
          teamMembershipId,
          [users[0]]
        )
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
  it(
    'should update team with given settings and new members',
    async () => {
      try {
        const team = await teamsClient.updateTeam(
          TEAM1_NAME,
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
          TEAM1_DESCRIPTION_2,
          TEAM1_ALIASES_2,
          TEAM1_TAGS_2,
          TEAM1_RESOURCES_2
        )

        await expectTeamToBe(
          teamsClient,
          team,
          teamId,
          TEAM1_NAME,
          TEAM1_DESCRIPTION_2,
          TEAM1_ALIASES_2,
          TEAM1_ENTITY_TAGS_2,
          TEAM1_RESOURCES_2,
          teamMembershipId,
          [users[1], users[2]]
        )
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
  it(
    'should get the updated team by name',
    async () => {
      try {
        const team = await teamsClient.getTeamByName(TEAM1_NAME)

        expect(team).not.toBeNull()
        await expectTeamToBe(
          teamsClient,
          team!,
          teamId,
          TEAM1_NAME,
          TEAM1_DESCRIPTION_2,
          TEAM1_ALIASES_2,
          TEAM1_ENTITY_TAGS_2,
          TEAM1_RESOURCES_2,
          teamMembershipId,
          [users[1], users[2]]
        )
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
  it(
    'should delete the created team',
    async () => {
      try {
        const guid = await teamsClient.removeTeam(TEAM1_NAME)

        expect(guid).toBe(teamId)
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
  it(
    'should add teams from files',
    async () => {
      // Setup the inputs object to simulate the action inputs when the action
      // is invoked from a GitHub workflow and two team definitions files have
      // been added.
      const inputs: Inputs = {
          orgId: process.env[ENV_INPUT_ORG_ID_KEY]!,
          apiKey: process.env[ENV_INPUT_API_KEY]!,
          authenticationDomainId:
            process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_KEY]!,
          region: toRegion(process.env[ENV_INPUT_REGION_KEY] || 'US'),
          filesAdded: [
            join(tempDir, TEAM2_NAME + '.json'),
            join(tempDir, TEAM3_NAME + '.json')
          ],
          filesModified: [],
          filesDeleted: []
        },
        action = newTeamsSyncAction(teamsClient, inputs)

      // Write out the mock team definition file for team 2 to the temporary
      // directory.
      await writeTeamDefinition(join(tempDir, TEAM2_NAME + '.json'), {
        description: TEAM2_DESCRIPTION,
        aliases: TEAM2_ALIASES,
        members: [users[0].email],
        contacts: TEAM2_RESOURCES.filter((r) => r.type === 'EMAIL'),
        links: TEAM2_RESOURCES.filter((r) => r.type !== 'EMAIL'),
        tags: TEAM2_TAGS
      })

      // Write out the mock team definition file for team 3 to the temporary
      // directory.
      await writeTeamDefinition(join(tempDir, TEAM3_NAME + '.json'), {
        description: TEAM3_DESCRIPTION_1,
        aliases: TEAM3_ALIASES_1,
        members: [
          users[1].email,
          {
            authenticationDomainId: users[2].authenticationDomainId,
            members: [users[2].email]
          }
        ],
        contacts: TEAM3_RESOURCES.filter((r) => r.type === 'EMAIL'),
        links: TEAM3_RESOURCES.filter((r) => r.type !== 'EMAIL'),
        tags: TEAM3_TAGS_1
      })

      try {
        // Invoke the action to process the added files.
        await action.run()

        // Verify that team 2 and team 3 were created as expected.

        let team = await teamsClient.getTeamByName(TEAM2_NAME)

        expect(team).not.toBeNull()
        await expectTeamToBe(
          teamsClient,
          team!,
          null,
          TEAM2_NAME,
          TEAM2_DESCRIPTION,
          TEAM2_ALIASES,
          TEAM2_ENTITY_TAGS,
          TEAM2_RESOURCES,
          null,
          [users[0]]
        )

        team = await teamsClient.getTeamByName(TEAM3_NAME)

        expect(team).not.toBeNull()
        await expectTeamToBe(
          teamsClient,
          team!,
          null,
          TEAM3_NAME,
          TEAM3_DESCRIPTION_1,
          TEAM3_ALIASES_1,
          TEAM3_ENTITY_TAGS_1,
          TEAM3_RESOURCES,
          null,
          [users[1], users[2]]
        )
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
  it(
    'should add, modify, and delete teams from files',
    async () => {
      // Setup the inputs object to simulate the action inputs when the action
      // is invoked from a GitHub workflow and one team definition file has been
      // added, one team definition file has been modified, and one team
      // definition file has been deleted.
      const inputs: Inputs = {
          orgId: process.env[ENV_INPUT_ORG_ID_KEY]!,
          apiKey: process.env[ENV_INPUT_API_KEY]!,
          authenticationDomainId:
            process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_KEY]!,
          region: toRegion(process.env[ENV_INPUT_REGION_KEY] || 'US'),
          filesAdded: [join(tempDir, TEAM4_NAME + '.json')],
          filesModified: [join(tempDir, TEAM3_NAME + '.json')],
          filesDeleted: [join(tempDir, TEAM2_NAME + '.json')]
        },
        action = newTeamsSyncAction(teamsClient, inputs)

      // Write out the mock team definition file for team 3 with updated team
      // settings to the temporary directory.
      await writeTeamDefinition(join(tempDir, TEAM3_NAME + '.json'), {
        description: TEAM3_DESCRIPTION_2,
        aliases: TEAM3_ALIASES_2,
        members: [
          users[1].email,
          {
            authenticationDomainId: users[2].authenticationDomainId,
            members: [users[2].email]
          }
        ],
        contacts: TEAM3_RESOURCES.filter((r) => r.type === 'EMAIL'),
        links: TEAM3_RESOURCES.filter((r) => r.type !== 'EMAIL'),
        tags: TEAM3_TAGS_2
      })

      // Write out the mock team definition file for team 4 to the temporary
      // directory.
      await writeTeamDefinition(join(tempDir, TEAM4_NAME + '.json'), {
        description: TEAM4_DESCRIPTION,
        aliases: TEAM4_ALIASES,
        members: [
          {
            authenticationDomainId: users[2].authenticationDomainId,
            members: [users[2].email]
          }
        ],
        contacts: TEAM4_RESOURCES.filter((r) => r.type === 'EMAIL'),
        links: TEAM4_RESOURCES.filter((r) => r.type !== 'EMAIL'),
        tags: TEAM4_TAGS
      })

      try {
        // Invoke the action to process the added, modified, and deleted
        // files.
        await action.run()

        // Verify that team 2 was deleted, team 3 was modified, and team 4 was
        // created as expected.

        let team = await teamsClient.getTeamByName(TEAM2_NAME)

        expect(team).toBeNull()

        team = await teamsClient.getTeamByName(TEAM3_NAME)

        expect(team).not.toBeNull()
        await expectTeamToBe(
          teamsClient,
          team!,
          null,
          TEAM3_NAME,
          TEAM3_DESCRIPTION_2,
          TEAM3_ALIASES_2,
          TEAM3_ENTITY_TAGS_2,
          TEAM3_RESOURCES,
          null,
          [users[1], users[2]]
        )

        team = await teamsClient.getTeamByName(TEAM4_NAME)

        expect(team).not.toBeNull()
        await expectTeamToBe(
          teamsClient,
          team!,
          null,
          TEAM4_NAME,
          TEAM4_DESCRIPTION,
          TEAM4_ALIASES,
          TEAM4_ENTITY_TAGS,
          TEAM4_RESOURCES,
          null,
          [users[2]]
        )
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
  it(
    'should delete teams from files',
    async () => {
      // Setup the inputs object to simulate the action inputs when the action
      // is invoked from a GitHub workflow and two team definition files have
      // been deleted.
      const inputs: Inputs = {
          orgId: process.env[ENV_INPUT_ORG_ID_KEY]!,
          apiKey: process.env[ENV_INPUT_API_KEY]!,
          authenticationDomainId:
            process.env[ENV_INPUT_AUTHENTICATION_DOMAIN_ID_1_KEY]!,
          region: toRegion(process.env[ENV_INPUT_REGION_KEY] || 'US'),
          filesAdded: [],
          filesModified: [],
          filesDeleted: [
            join(tempDir, TEAM3_NAME + '.json'),
            join(tempDir, TEAM4_NAME + '.json')
          ]
        },
        action = newTeamsSyncAction(teamsClient, inputs)

      try {
        // Invoke the action to process the deleted files.
        await action.run()

        // Verify that team 3 and team 4 were deleted as expected and that team
        // 2 still does not exist.

        let team = await teamsClient.getTeamByName(TEAM2_NAME)

        expect(team).toBeNull()

        team = await teamsClient.getTeamByName(TEAM3_NAME)

        expect(team).toBeNull()

        team = await teamsClient.getTeamByName(TEAM4_NAME)

        expect(team).toBeNull()
      } catch (err) {
        checkForNerdgraphErrorAndRethrow(err)
      }
    },
    timeoutMs
  )
})
