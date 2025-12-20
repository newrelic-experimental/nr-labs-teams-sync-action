/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectNerdgraphError"] }] */

/**
 * Unit tests for src/nerdgraph/teams.ts
 */

import { NerdgraphClient, Region } from '../../src/nerdgraph/nerdgraph.js'
import { newTeamsClient, TeamsClient } from '../../src/nerdgraph/teams.js'
import { UsersClient } from '../../src/nerdgraph/users.js'
import { expectNerdgraphError } from '../util.js'
import {
  newNerdgraphClientWithOneResponse,
  newNerdgraphClientWithResponses,
  newUsersClient,
  newUsersClientWithError,
  newUsersClientWithResponses,
  newUsersClientWithUsersById
} from './stubs.js'

function createTeamsClient(
  nerdgraphClient: NerdgraphClient,
  usersClient: UsersClient = newUsersClient()
): TeamsClient {
  return newTeamsClient(
    nerdgraphClient,
    usersClient,
    'orgId',
    'apiKey',
    Region.US
  )
}

function createTeamEntity() {
  return {
    id: 'foo',
    name: 'foo',
    description: '',
    aliases: [],
    resources: [],
    membership: { id: '42' },
    tags: []
  }
}

describe('TeamsClient', () => {
  describe('getTeamByName', () => {
    it('should return null when entity search entities is null', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { entitySearch: { entities: null } }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      expect(await client.getTeamByName('foo')).toBeNull()
    })
    it('should return null when entity search has no entities', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { entitySearch: { entities: [] } }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      expect(await client.getTeamByName('foo')).toBeNull()
    })
    it('should throw NerdgraphError when entities is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { entitySearch: { entities: 42 } }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should return null when entity is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { entitySearch: { entities: [42] } }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      expect(await client.getTeamByName('foo')).toBeNull()
    })
    it('should return null when team not found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: { entities: [{ name: 'bar' }] }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      expect(await client.getTeamByName('foo')).toBeNull()
    })
    it('should throw NerdgraphError when entity id is invalid', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: { entities: [{ id: 42, name: 'foo' }] }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity resource is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [{ id: '42', name: 'foo', resources: [42] }]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity resource type is invalid', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [{ id: '42', name: 'foo', resources: [{ type: 42 }] }]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity resource content is invalid', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: '42',
                  name: 'foo',
                  resources: [{ type: 'GITHUB', content: 42 }]
                }
              ]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity membership is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [{ id: '42', name: 'foo', membership: 42 }]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity membership id is invalid', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [{ id: '42', name: 'foo', membership: { id: 42 } }]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity tags is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                { id: '42', name: 'foo', membership: { id: '42' }, tags: 42 }
              ]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity tag is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: '42',
                  name: 'foo',
                  membership: { id: '42' },
                  tags: [42]
                }
              ]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity tag key is invalid', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: '42',
                  name: 'foo',
                  membership: { id: '42' },
                  tags: [{ key: 42 }]
                }
              ]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity tag values is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: '42',
                  name: 'foo',
                  membership: { id: '42' },
                  tags: [{ key: '42', values: 42 }]
                }
              ]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should throw NerdgraphError when entity tag values is not a string array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: '42',
                  name: 'foo',
                  membership: { id: '42' },
                  tags: [{ key: '42', values: ['foo', 42] }]
                }
              ]
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getTeamByName('foo'))
    })
    it('should return a team with no description when description is missing', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                { id: 'foo', name: 'foo', membership: { id: '42' }, tags: [] }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('')
    })
    it('should return a team with no description when description is not a string', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 42,
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('')
    })
    it('should return a team with no description when description is null', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: null,
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('')
    })
    it('should return a team with description when description is set', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
    })
    it('should return a team with no aliases when aliases is missing', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual([])
    })
    it('should return a team with no aliases when aliases is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: 42,
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual([])
    })
    it('should return a team with no aliases when aliases is not a string array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 42],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual([])
    })
    it('should return a team with aliases when aliases is set', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
    })
    it('should return a team with no resources when resources is missing', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([])
    })
    it('should return a team with no resources when resources is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  resources: 42,
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([])
    })
    it('should return a team with resource with null title when resource title is missing', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  resources: [
                    {
                      type: 'GITHUB',
                      content: 'https://github.com/fake-org/fake-repo'
                    }
                  ],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([
        {
          type: 'GITHUB',
          title: null,
          content: 'https://github.com/fake-org/fake-repo'
        }
      ])
    })
    it('should return a team with resource with null title when resource title is not a string', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  resources: [
                    {
                      type: 'GITHUB',
                      title: 42,
                      content: 'https://github.com/fake-org/fake-repo'
                    }
                  ],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([
        {
          type: 'GITHUB',
          title: null,
          content: 'https://github.com/fake-org/fake-repo'
        }
      ])
    })
    it('should return a team with resources when resources are set', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  resources: [
                    {
                      type: 'EMAIL',
                      title: 'Test email',
                      content: 'test@fakedomain.test'
                    },
                    {
                      type: 'GITHUB',
                      title: 'GitHub Repository',
                      content: 'https://github.com/fake-org/fake-repo'
                    }
                  ],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([
        {
          type: 'EMAIL',
          title: 'Test email',
          content: 'test@fakedomain.test'
        },
        {
          type: 'GITHUB',
          title: 'GitHub Repository',
          content: 'https://github.com/fake-org/fake-repo'
        }
      ])
    })
    it('should return a team with membership id when membership id is set', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  resources: [
                    {
                      type: 'EMAIL',
                      title: 'Test email',
                      content: 'test@fakedomain.test'
                    },
                    {
                      type: 'GITHUB',
                      title: 'GitHub Repository',
                      content: 'https://github.com/fake-org/fake-repo'
                    }
                  ],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([
        {
          type: 'EMAIL',
          title: 'Test email',
          content: 'test@fakedomain.test'
        },
        {
          type: 'GITHUB',
          title: 'GitHub Repository',
          content: 'https://github.com/fake-org/fake-repo'
        }
      ])
      expect(team!.membership).toEqual({ id: '42' })
    })
    it('should return a team with no tags when tags array is empty', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  resources: [
                    {
                      type: 'EMAIL',
                      title: 'Test email',
                      content: 'test@fakedomain.test'
                    },
                    {
                      type: 'GITHUB',
                      title: 'GitHub Repository',
                      content: 'https://github.com/fake-org/fake-repo'
                    }
                  ],
                  membership: { id: '42' },
                  tags: []
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([
        {
          type: 'EMAIL',
          title: 'Test email',
          content: 'test@fakedomain.test'
        },
        {
          type: 'GITHUB',
          title: 'GitHub Repository',
          content: 'https://github.com/fake-org/fake-repo'
        }
      ])
      expect(team!.membership).toEqual({ id: '42' })
      expect(team!.tags).toEqual([])
    })
    it('should return a team with tags when tags are set', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: [
                {
                  id: 'foo',
                  name: 'foo',
                  description: 'A team description',
                  aliases: ['bar', 'beep', 'boop'],
                  resources: [
                    {
                      type: 'EMAIL',
                      title: 'Test email',
                      content: 'test@fakedomain.test'
                    },
                    {
                      type: 'GITHUB',
                      title: 'GitHub Repository',
                      content: 'https://github.com/fake-org/fake-repo'
                    }
                  ],
                  membership: { id: '42' },
                  tags: [
                    {
                      key: 'foo',
                      values: ['bar']
                    },
                    {
                      key: 'baz',
                      values: ['beep', 'boop']
                    }
                  ]
                }
              ]
            }
          }
        }
      })
      const team = await createTeamsClient(nerdgraphClient).getTeamByName('foo')

      expect(team).not.toBeNull()
      expect(team!.id).toBe('foo')
      expect(team!.name).toBe('foo')
      expect(team!.description).toBe('A team description')
      expect(team!.aliases).toEqual(['bar', 'beep', 'boop'])
      expect(team!.resources).toEqual([
        {
          type: 'EMAIL',
          title: 'Test email',
          content: 'test@fakedomain.test'
        },
        {
          type: 'GITHUB',
          title: 'GitHub Repository',
          content: 'https://github.com/fake-org/fake-repo'
        }
      ])
      expect(team!.membership).toEqual({ id: '42' })
      expect(team!.tags).toEqual([
        {
          key: 'foo',
          values: ['bar']
        },
        {
          key: 'baz',
          values: ['beep', 'boop']
        }
      ])
    })
  })
  describe('getTeamMembers', () => {
    it('should return empty array when collection items is null', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { collectionElements: { items: null } }
        }
      })
      const usersClient = newUsersClient()
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      expect(await client.getTeamMembers(teamEntity)).toEqual([])
      expect(usersClient.userByIdCalls).toBe(0)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(usersClient.userIdByEmailCalls).toBe(0)
    })
    it('should return empty array when collection has no items', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { collectionElements: { items: [] } }
        }
      })
      const usersClient = newUsersClient()
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      expect(await client.getTeamMembers(teamEntity)).toEqual([])
      expect(usersClient.userByIdCalls).toBe(0)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(usersClient.userIdByEmailCalls).toBe(0)
    })
    it('should throw NerdgraphError when items is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { collectionElements: { items: 42 } }
        }
      })
      const usersClient = newUsersClient()
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() => client.getTeamMembers(teamEntity))
      expect(usersClient.userByIdCalls).toBe(0)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(usersClient.userIdByEmailCalls).toBe(0)
    })
    it('should throw NerdgraphError when user item is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: { collectionElements: { items: [42] } }
        }
      })
      const usersClient = newUsersClient()
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() => client.getTeamMembers(teamEntity))
      expect(usersClient.userByIdCalls).toBe(0)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(usersClient.userIdByEmailCalls).toBe(0)
    })
    it('should throw NerdgraphError when user id is not a number', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            collectionElements: { items: [{ userId: '42' }] }
          }
        }
      })
      const usersClient = newUsersClient()
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() => client.getTeamMembers(teamEntity))
      expect(usersClient.userByIdCalls).toBe(0)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(usersClient.userIdByEmailCalls).toBe(0)
    })
    it('should throw NerdgraphError when user is not found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            collectionElements: { items: [{ userId: 42 }] }
          }
        }
      })
      const usersClient = newUsersClientWithUsersById(null)
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() => client.getTeamMembers(teamEntity))
      expect(usersClient.userByIdCalls).toBe(1)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(usersClient.userIdByEmailCalls).toBe(0)
    })
    it('should throw NerdgraphError if getUserById does', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            collectionElements: { items: [{ userId: 42 }] }
          }
        }
      })
      const usersClient = newUsersClientWithError()
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() => client.getTeamMembers(teamEntity))
      expect(usersClient.userByIdCalls).toBe(1)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(usersClient.userIdByEmailCalls).toBe(0)
    })
    it('should return members when valid users are found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            collectionElements: { items: [{ userId: 42 }, { userId: 43 }] }
          }
        }
      })
      const usersClient = newUsersClientWithUsersById(
        {
          guid: '42',
          name: 'User 42'
        },
        {
          guid: '43',
          name: 'User 43'
        }
      )
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()
      const members = await client.getTeamMembers(teamEntity)

      expect(usersClient.userIdByEmailCalls).toBe(0)
      expect(usersClient.userByIdCalls).toBe(2)
      expect(usersClient.userByEmailCalls).toBe(0)
      expect(members).toEqual([
        {
          guid: '42',
          name: 'User 42'
        },
        {
          guid: '43',
          name: 'User 43'
        }
      ])
    })
  })
  describe('addMembers', () => {
    it('should throw NerdgraphError when number of GraphQL responses is not one', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses([
        {
          entityManagementAddCollectionMembers: ['42']
        },
        {
          entityManagementAddCollectionMembers: ['43']
        }
      ])
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.addMembers(teamEntity, ['42', '43'])
      )
    })
    it('should throw NerdgraphError when added member ids is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementAddCollectionMembers: 42
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.addMembers(teamEntity, ['42', '43'])
      )
    })
    it('should throw NerdgraphError when added member ids is not a string array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementAddCollectionMembers: ['42', 43]
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.addMembers(teamEntity, ['42', '43'])
      )
    })
    it('should throw NerdgraphError if users to add does not match users added', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementAddCollectionMembers: ['42']
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.addMembers(teamEntity, ['42', '43'])
      )
    })
    it('should return added member ids when successful', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementAddCollectionMembers: ['42', '43']
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      const addedMemberIds = await client.addMembers(teamEntity, ['42', '43'])
      expect(addedMemberIds).toEqual(['42', '43'])
    })
  })
  describe('removeMembers', () => {
    it('should throw NerdgraphError when number of GraphQL responses is not one', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses([
        {
          entityManagementRemoveCollectionMembers: ['42']
        },
        {
          entityManagementRemoveCollectionMembers: ['43']
        }
      ])
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.removeMembers(teamEntity, ['42', '43'])
      )
    })
    it('should throw NerdgraphError when removed member ids is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementRemoveCollectionMembers: 42
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.removeMembers(teamEntity, ['42', '43'])
      )
    })
    it('should throw NerdgraphError when removed member ids is not a string array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementRemoveCollectionMembers: ['42', 43]
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.removeMembers(teamEntity, ['42', '43'])
      )
    })
    it('should throw NerdgraphError if users to remove does not match users removed', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementRemoveCollectionMembers: ['42']
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.removeMembers(teamEntity, ['42', '43'])
      )
    })
    it('should return removed member ids when successful', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementRemoveCollectionMembers: ['42', '43']
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      const removedMemberIds = await client.removeMembers(teamEntity, [
        '42',
        '43'
      ])
      expect(removedMemberIds).toEqual(['42', '43'])
    })
  })
  describe('updateMembership', () => {
    it('should throw NerdgraphError if getTeamMembers does', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            // Trigger getTeamMembers error by returning invalid collection items
            collectionElements: { items: '42' }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.updateMembership(teamEntity, ['fake-user@newrelic.com'])
      )
    })
    it('should throw NerdgraphError if getUserByEmail does', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            // Trigger getTeamMembers error by returning invalid collection items
            collectionElements: { items: '42' }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)
      const teamEntity = createTeamEntity()

      await expectNerdgraphError(() =>
        client.updateMembership(teamEntity, ['fake-user@newrelic.com'])
      )
    })
    it('should ignore emails that do not map to a user', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            collectionElements: { items: [{ userId: 42 }, { userId: 43 }] }
          }
        }
      })
      const usersClient = newUsersClientWithResponses(
        [],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '43',
            name: 'User 43'
          }
        ],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '43',
            name: 'User 43'
          },
          null
        ]
      )
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      const result = await client.updateMembership(teamEntity, [
        'fake-user-1@newrelic.com',
        'fake-user-2@newrelic.com',
        'fake-user-3@newrelic.com'
      ])
      expect(result).toEqual({ usersAdded: [], usersRemoved: [] })
    })
    it('should return expected update membership result when users added', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                collectionElements: { items: [{ userId: 42 }] }
              }
            }
          }
        ],
        [
          {
            entityManagementAddCollectionMembers: ['43']
          }
        ]
      )
      const usersClient = newUsersClientWithResponses(
        [],
        [
          {
            guid: '42',
            name: 'User 42'
          }
        ],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '43',
            name: 'User 43'
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      const result = await client.updateMembership(teamEntity, [
        'fake-user-1@newrelic.com',
        'fake-user-2@newrelic.com'
      ])
      expect(result).toEqual({ usersAdded: ['43'], usersRemoved: [] })
    })
    it('should return expected update membership result when users removed', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                collectionElements: { items: [{ userId: 42 }, { userId: 43 }] }
              }
            }
          }
        ],
        [
          {
            entityManagementRemoveCollectionMembers: ['43']
          }
        ]
      )
      const usersClient = newUsersClientWithResponses(
        [],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '43',
            name: 'User 43'
          }
        ],
        [
          {
            guid: '42',
            name: 'User 42'
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      const result = await client.updateMembership(teamEntity, [
        'fake-user-1@newrelic.com'
      ])
      expect(result).toEqual({ usersAdded: [], usersRemoved: ['43'] })
    })
    it('should return expected update membership result when users are the same', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            collectionElements: { items: [{ userId: 42 }, { userId: 43 }] }
          }
        }
      })
      const usersClient = newUsersClientWithResponses(
        [],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '43',
            name: 'User 43'
          }
        ],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '43',
            name: 'User 43'
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      const result = await client.updateMembership(teamEntity, [
        'fake-user-1@newrelic.com',
        'fake-user-2@newrelic.com'
      ])
      expect(result).toEqual({ usersAdded: [], usersRemoved: [] })
    })
    it('should return expected update membership result when users are added, removed, and kept', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                collectionElements: {
                  items: [{ userId: 42 }, { userId: 43 }]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementAddCollectionMembers: ['44']
          }
        ],
        [
          {
            entityManagementRemoveCollectionMembers: ['43']
          }
        ]
      )
      const usersClient = newUsersClientWithResponses(
        [],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '43',
            name: 'User 43'
          }
        ],
        [
          {
            guid: '42',
            name: 'User 42'
          },
          {
            guid: '44',
            name: 'User 44'
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient, usersClient)
      const teamEntity = createTeamEntity()

      const result = await client.updateMembership(teamEntity, [
        'fake-user-1@newrelic.com',
        'fake-user-3@newrelic.com'
      ])
      expect(result).toEqual({ usersAdded: ['44'], usersRemoved: ['43'] })
    })
  })
  describe('createTeam', () => {
    it('should throw NerdgraphError when number of GraphQL responses is not one', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses([
        {
          entityManagementCreateTeam: {
            entity: {
              id: 'foo'
            }
          }
        },
        {
          entityManagementCreateTeam: {
            entity: {
              id: 'bar'
            }
          }
        }
      ])
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.createTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError when new team entity ID is not a string', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementCreateTeam: {
          entity: {
            id: 42
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.createTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError when new team entity ID is the empty string', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        entityManagementCreateTeam: {
          entity: {
            id: ''
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.createTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError if getTeamByName does', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            entityManagementCreateTeam: {
              entity: {
                id: '42'
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  // Invalid entities value to trigger error
                  entities: '42'
                }
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.createTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError if team is not found', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            entityManagementCreateTeam: {
              entity: {
                id: '42'
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: []
                }
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.createTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError if new team entity GUID does not match fetched team entity GUID', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            entityManagementCreateTeam: {
              entity: {
                id: '42'
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '43',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.createTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError if updateMembership does', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            entityManagementCreateTeam: {
              entity: {
                id: '42'
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                // Invalid items to trigger error
                collectionElements: { items: '42' }
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.createTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should return created team when successful', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            entityManagementCreateTeam: {
              entity: {
                id: '42'
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: [{ key: 'foo', values: ['bar'] }]
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                collectionElements: { items: [] }
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      const teamEntity = await client.createTeam(
        'Fake Team',
        [],
        'A fake team for testing purposes',
        [],
        {
          foo: ['bar']
        },
        []
      )
      expect(teamEntity).toEqual({
        id: '42',
        name: 'Fake Team',
        description: 'A fake team for testing purposes',
        aliases: [],
        resources: [],
        membership: { id: '42' },
        tags: [{ key: 'foo', values: ['bar'] }]
      })
    })
  })
  describe('updateTeam', () => {
    it('should throw NerdgraphError if getTeamByName does', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              // Invalid entities value to trigger error
              entities: '42'
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.updateTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError if team is not found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: []
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.updateTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError when number of GraphQL responses is not one', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementUpdateTeam: {
              entity: {
                id: '42',
                name: 'Fake Team',
                description: 'A fake team for testing purposes',
                aliases: [],
                resources: [],
                membership: { id: '42' },
                tags: []
              }
            }
          },
          {
            entityManagementUpdateTeam: {
              entity: {
                id: '43',
                name: 'Fake Team 2',
                description: 'A fake team for testing purposes',
                aliases: [],
                resources: [],
                membership: { id: '43' },
                tags: []
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.updateTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError when updated team entity is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementUpdateTeam: {
              entity: 42
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.updateTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError when unmarshalTeamEntity does', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementUpdateTeam: {
              entity: {
                // Invalid team entity id to trigger unmarshal error
                id: '',
                name: 'Fake Team',
                description: 'A fake team for testing purposes',
                aliases: [],
                resources: [],
                membership: { id: '42' },
                tags: []
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.updateTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should throw NerdgraphError when updateMembership does', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementUpdateTeam: {
              entity: {
                id: '42',
                name: 'Fake Team',
                description: 'A fake team for testing purposes',
                aliases: [],
                resources: [],
                membership: { id: '42' },
                tags: []
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                // Invalid items to trigger error
                collectionElements: { items: '42' }
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.updateTeam(
          'Fake Team',
          [],
          'A fake team for testing purposes',
          [],
          {},
          []
        )
      )
    })
    it('should return updated team when successful', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementUpdateTeam: {
              entity: {
                id: '42',
                name: 'Fake Team',
                description: 'Another fake team for testing purposes',
                aliases: [],
                resources: [],
                membership: { id: '42' },
                tags: [{ key: 'foo', values: ['bar'] }]
              }
            }
          }
        ],
        [
          {
            actor: {
              entityManagement: {
                collectionElements: { items: [] }
              }
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      const teamEntity = await client.updateTeam(
        'Fake Team',
        [],
        'Another fake team for testing purposes',
        [],
        {
          foo: ['bar']
        },
        []
      )
      expect(teamEntity).toEqual({
        id: '42',
        name: 'Fake Team',
        description: 'Another fake team for testing purposes',
        aliases: [],
        resources: [],
        membership: { id: '42' },
        tags: [{ key: 'foo', values: ['bar'] }]
      })
    })
  })
  describe('removeTeam', () => {
    it('should throw NerdgraphError if getTeamByName does', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              // Invalid entities value to trigger error
              entities: '42'
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.removeTeam('Fake Team'))
    })
    it('should throw NerdgraphError if team is not found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entityManagement: {
            entitySearch: {
              entities: []
            }
          }
        }
      })
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.removeTeam('Fake Team'))
    })
    it('should throw NerdgraphError when number of GraphQL responses is not one', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementDelete: {
              id: '42'
            }
          },
          {
            entityManagementDelete: {
              id: '43'
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.removeTeam('Fake Team'))
    })
    it('should throw NerdgraphError when removed team entity ID is the empty string', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementDelete: {
              id: ''
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.removeTeam('Fake Team'))
    })
    it('should throw NerdgraphError if fetched team entity GUID does not match removed team entity GUID', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementDelete: {
              id: '43'
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      await expectNerdgraphError(() => client.removeTeam('Fake Team'))
    })
    it('should return removed team GUID when successful', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              entityManagement: {
                entitySearch: {
                  entities: [
                    {
                      id: '42',
                      name: 'Fake Team',
                      description: 'A fake team for testing purposes',
                      aliases: [],
                      resources: [],
                      membership: { id: '42' },
                      tags: []
                    }
                  ]
                }
              }
            }
          }
        ],
        [
          {
            entityManagementDelete: {
              id: '42'
            }
          }
        ]
      )
      const client = createTeamsClient(nerdgraphClient)

      const removedTeamGuid = await client.removeTeam('Fake Team')
      expect(removedTeamGuid).toBe('42')
    })
  })
})
