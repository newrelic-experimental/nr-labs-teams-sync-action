/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectNerdgraphError"] }] */

/**
 * Unit tests for src/action.ts
 */

import { newTeamsSyncAction, TeamsSyncAction } from '../src/action.js'
import { expectNerdgraphError } from './util.js'
import { newTeamsClient, newTeamsClientWithError } from './nerdgraph/stubs.js'
import { Region } from '../src/nerdgraph/nerdgraph.js'
import { TeamsClient } from '../src/nerdgraph/teams.js'

function createTeamsSyncAction(
  teamsClient: TeamsClient,
  filesAdded: string[] = [],
  filesModified: string[] = [],
  filesDeleted: string[] = []
): TeamsSyncAction {
  const inputs = {
    orgId: 'orgId',
    apiKey: 'apiKey',
    region: Region.US,
    filesAdded,
    filesModified,
    filesDeleted
  }

  return newTeamsSyncAction(teamsClient, inputs)
}

describe('TeamSyncAction', () => {
  describe('run', () => {
    it('should process all changes', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(
        teamsClient,
        ['__fixtures__/engineering.json'],
        ['__fixtures__/gtm.json'],
        ['__fixtures__/operations.json']
      )

      await action.run()

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'engineering',
        members: ['joe@example.com', 'alex@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'], beep: ['boop'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test@example.com'
          },
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })

      expect(teamsClient.updateTeamCalls).toBe(1)
      expect(teamsClient.teamsUpdated[0]).toEqual({
        name: 'gtm',
        members: ['pat@example.com', 'skyler@example.com'],
        description: 'Go-to-Market team responsible for sales and marketing',
        aliases: ['gtm'],
        tags: { fizz: ['fazz'], bizz: ['bazz'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test2@example.com'
          },
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo2'
          }
        ]
      })

      expect(teamsClient.removeTeamCalls).toBe(1)
      expect(teamsClient.teamsRemoved).toEqual(['operations'])
    })
  })
  describe('processFilesAdded', () => {
    it('should throw NerdgraphError if createTeam does', async () => {
      const teamsClient = newTeamsClientWithError()
      const action = createTeamsSyncAction(teamsClient)

      await expectNerdgraphError(async () => {
        await action.processFilesAdded(['__fixtures__/engineering.json'])
      })
    })
    it('should create no teams if no files added', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded([])

      expect(teamsClient.createTeamCalls).toBe(0)
    })
    it('should throw Error if readFile does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesAdded(['__fixtures__/nonexistent.json'])
      }).rejects.toThrow('ENOENT')
    })
    it('should throw Error if parseJson does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesAdded(['__fixtures__/invalid.json'])
      }).rejects.toThrow(Error)
    })
    it('should throw Error if unmarshalTeamDefinition does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesAdded(['__fixtures__/not-object.json'])
      }).rejects.toThrow(Error)
    })
    it('should throw Error if GITHUB_WORKSPACE is set file not found', async () => {
      process.env.GITHUB_WORKSPACE = '/some/nonexistent/path'
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesAdded(['__fixtures__/engineering.json'])
      }).rejects.toThrow('ENOENT')

      delete process.env.GITHUB_WORKSPACE
    })
    it('should create a team with no members when members is missing', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/no-members.json'])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'no-members',
        members: [],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no members when members is not an array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/members-not-array.json'])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'members-not-array',
        members: [],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no members when members is not a string array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded([
        '__fixtures__/members-not-string-array.json'
      ])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'members-not-string-array',
        members: [],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no description when description is missing', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/no-description.json'])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'no-description',
        members: ['joe@example.com'],
        description: '',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no description when description is not a string', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded([
        '__fixtures__/description-not-string.json'
      ])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'description-not-string',
        members: ['joe@example.com'],
        description: '',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no description when description is null', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/description-null.json'])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'description-null',
        members: ['joe@example.com'],
        description: '',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no aliases when aliases is missing', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/no-aliases.json'])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'no-aliases',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: [],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no aliases when aliases is not an array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/aliases-not-array.json'])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'aliases-not-array',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: [],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no aliases when aliases is not a string array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded([
        '__fixtures__/aliases-not-string-array.json'
      ])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'aliases-not-string-array',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: [],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no contacts when contacts is missing', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/no-contacts.json'])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'no-contacts',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no contacts when contacts is not an array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/contacts-not-array.json'])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'contacts-not-array',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should throw NerdgraphError if unmarshalTeamResource for contact does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expectNerdgraphError(async () => {
        await action.processFilesAdded(['__fixtures__/invalid-contact.json'])
      })
    })
    it('should create a team with no links when links is missing', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/no-links.json'])

      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'no-links',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test@example.com'
          }
        ]
      })
    })
    it('should create a team with no links when links is not an array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/links-not-array.json'])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'links-not-array',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test@example.com'
          }
        ]
      })
    })
    it('should throw NerdgraphError if unmarshalTeamResource for link does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expectNerdgraphError(async () => {
        await action.processFilesAdded(['__fixtures__/invalid-link.json'])
      })
    })
    it('should create a team with no resources when no links or contacts', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/no-resources.json'])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'no-resources',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'] },
        resources: []
      })
    })
    it('should create a team with no tags when tags is missing', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/no-tags.json'])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'no-tags',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: {},
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no tags when tags is not an object', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/tags-not-object.json'])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'tags-not-object',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: {},
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no tags when tag value is not an array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded(['__fixtures__/tags-value-not-array.json'])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'tags-value-not-array',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: {},
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create a team with no tags when tag value is not a string array', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded([
        '__fixtures__/tags-value-not-string-array.json'
      ])
      expect(teamsClient.createTeamCalls).toBe(1)
      expect(teamsClient.teamsCreated.length).toBe(1)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'tags-value-not-string-array',
        members: ['joe@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: {},
        resources: [
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
    })
    it('should create teams successfully from valid definitions', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesAdded([
        '__fixtures__/engineering.json',
        '__fixtures__/gtm.json'
      ])

      expect(teamsClient.createTeamCalls).toBe(2)
      expect(teamsClient.teamsCreated.length).toBe(2)
      expect(teamsClient.teamsCreated[0]).toEqual({
        name: 'engineering',
        members: ['joe@example.com', 'alex@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'], beep: ['boop'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test@example.com'
          },
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
      expect(teamsClient.teamsCreated[1]).toEqual({
        name: 'gtm',
        members: ['pat@example.com', 'skyler@example.com'],
        description: 'Go-to-Market team responsible for sales and marketing',
        aliases: ['gtm'],
        tags: { fizz: ['fazz'], bizz: ['bazz'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test2@example.com'
          },
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo2'
          }
        ]
      })
    })
  })
  describe('processFilesModified', () => {
    it('should throw NerdgraphError if updateTeam does', async () => {
      const teamsClient = newTeamsClientWithError()
      const action = createTeamsSyncAction(teamsClient)

      await expectNerdgraphError(async () => {
        await action.processFilesModified(['__fixtures__/engineering.json'])
      })
    })
    it('should update no teams if no files added', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesModified([])
      expect(teamsClient.updateTeamCalls).toBe(0)
    })
    it('should throw Error if readFile does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesModified(['__fixtures__/nonexistent.json'])
      }).rejects.toThrow('ENOENT')
    })
    it('should throw Error if parseJson does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesModified(['__fixtures__/invalid.json'])
      }).rejects.toThrow(Error)
    })
    it('should throw Error if unmarshalTeamDefinition does', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesModified(['__fixtures__/not-object.json'])
      }).rejects.toThrow(Error)
    })
    it('should throw Error if GITHUB_WORKSPACE is set file not found', async () => {
      process.env.GITHUB_WORKSPACE = '/some/nonexistent/path'
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await expect(async () => {
        await action.processFilesModified(['__fixtures__/engineering.json'])
      }).rejects.toThrow('ENOENT')

      delete process.env.GITHUB_WORKSPACE
    })
    it('should update teams successfully from valid definitions', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesModified([
        '__fixtures__/engineering.json',
        '__fixtures__/gtm.json'
      ])

      expect(teamsClient.updateTeamCalls).toBe(2)
      expect(teamsClient.teamsUpdated.length).toBe(2)
      expect(teamsClient.teamsUpdated[0]).toEqual({
        name: 'engineering',
        members: ['joe@example.com', 'alex@example.com'],
        description: 'Engineering team responsible for product development',
        aliases: ['epd'],
        tags: { foo: ['bar'], beep: ['boop'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test@example.com'
          },
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo'
          }
        ]
      })
      expect(teamsClient.teamsUpdated[1]).toEqual({
        name: 'gtm',
        members: ['pat@example.com', 'skyler@example.com'],
        description: 'Go-to-Market team responsible for sales and marketing',
        aliases: ['gtm'],
        tags: { fizz: ['fazz'], bizz: ['bazz'] },
        resources: [
          {
            type: 'EMAIL',
            title: 'Test email',
            content: 'test2@example.com'
          },
          {
            type: 'GITHUB',
            title: 'GitHub Repository',
            content: 'https://github.com/example/repo2'
          }
        ]
      })
    })
  })
  describe('processFilesDeleted', () => {
    it('should throw NerdgraphError if removeTeam does', async () => {
      const teamsClient = newTeamsClientWithError()
      const action = createTeamsSyncAction(teamsClient)

      await expectNerdgraphError(async () => {
        await action.processFilesDeleted(['__fixtures__/engineering.json'])
      })
    })
    it('should delete no teams if no files deleted', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesDeleted([])

      expect(teamsClient.removeTeamCalls).toBe(0)
    })
    it('should delete teams successfully from valid file names', async () => {
      const teamsClient = newTeamsClient()
      const action = createTeamsSyncAction(teamsClient)

      await action.processFilesDeleted([
        '__fixtures__/engineering.json',
        '__fixtures__/gtm.json'
      ])

      expect(teamsClient.removeTeamCalls).toBe(2)
      expect(teamsClient.teamsRemoved).toEqual(['engineering', 'gtm'])
    })
  })
})
