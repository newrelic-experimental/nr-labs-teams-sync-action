/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectNerdgraphError"] }] */

/**
 * Unit tests for src/nerdgraph/users.ts
 */

import { newUsersClient, UsersClient } from '../../src/nerdgraph/users.js'
import { NerdgraphClient, Region } from '../../src/nerdgraph/nerdgraph.js'
import {
  newNerdgraphClientWithOneResponse,
  newNerdgraphClientWithResponses
} from './stubs.js'
import { expectNerdgraphError } from '../util.js'

function createUsersClient(nerdgraphClient: NerdgraphClient): UsersClient {
  return newUsersClient(nerdgraphClient, 'apiKey', Region.US)
}

describe('UsersClient', () => {
  describe('getUserIdByEmail', () => {
    it('should throw NerdgraphError when number of GraphQL responses is not one', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses([
        {
          actor: {
            users: {
              userSearch: {
                users: [{ userId: '42' }]
              }
            }
          }
        },
        {
          actor: {
            users: {
              userSearch: {
                users: [{ userId: '43' }]
              }
            }
          }
        }
      ])
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserIdByEmail('fake-user@newrelic.com')
      )
    })
    it('should return null when users element is null', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: null
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      const user = await client.getUserIdByEmail('fake-user@newrelic.com')
      expect(user).toBeNull()
    })
    it('should throw NerdgraphError when users element is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: 42
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserIdByEmail('fake-user@newrelic.com')
      )
    })
    it('should return null when no user is found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: []
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      const user = await client.getUserIdByEmail('fake-user@newrelic.com')
      expect(user).toBeNull()
    })
    it('should throw NerdgraphError when more than one user is returned', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: [{ userId: '42' }, { userId: '43' }]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserIdByEmail('fake-user@newrelic.com')
      )
    })
    it('should throw NerdgraphError when user search result is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: [42]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserIdByEmail('fake-user@newrelic.com')
      )
    })
    it('should throw NerdgraphError when user id is not defined', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: [{}]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserIdByEmail('fake-user@newrelic.com')
      )
    })
    it('should throw NerdgraphError when user id is not a string', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: [{ userId: 42 }]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserIdByEmail('fake-user@newrelic.com')
      )
    })
    it('should return user id when user is found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: [{ userId: '42' }]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      const userId = await client.getUserIdByEmail('fake-user@newrelic.com')
      expect(userId).toBe('42')
    })
  })
  describe('getUserById', () => {
    it('should throw NerdgraphError when number of GraphQL responses is not one', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses([
        {
          actor: {
            entitySearch: {
              results: {
                entities: [{ guid: '42', name: 'User 42' }]
              }
            }
          }
        },
        {
          actor: {
            entitySearch: {
              results: {
                entities: [{ guid: '43', name: 'User 43' }]
              }
            }
          }
        }
      ])
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should return null when entities element is null', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: null
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      const user = await client.getUserById('42')
      expect(user).toBeNull()
    })
    it('should throw NerdgraphError when entities element is not an array', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: 42
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should return null when no user is found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: []
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      const user = await client.getUserById('42')
      expect(user).toBeNull()
    })
    it('should throw NerdgraphError when more than one user is returned', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: [
                { guid: '42', name: 'User 42' },
                { guid: '43', name: 'User 43' }
              ]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should throw NerdgraphError when entity search result is not an object', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: [42]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should throw NerdgraphError when user GUID is not defined', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: [{}]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should throw NerdgraphError when user GUID is not a string', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: [{ guid: 42 }]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should throw NerdgraphError when user name is not defined', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: [{ guid: '42' }]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should throw NerdgraphError when user name is not a string', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: [{ guid: '42', name: 42 }]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() => client.getUserById('42'))
    })
    it('should return user when user ID is found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          entitySearch: {
            results: {
              entities: [{ guid: '42', name: 'User 42' }]
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      const user = await client.getUserById('42')
      expect(user).toEqual({ guid: '42', name: 'User 42' })
    })
  })
  describe('getUserByEmail', () => {
    it('should throw NerdgraphError if getUserIdByEmail fails', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses([
        // Trigger error in getUserIdByEmail by returning multiple responses
        {
          actor: {
            users: {
              userSearch: {
                users: [{ userId: '42' }]
              }
            }
          }
        },
        {
          actor: {
            users: {
              userSearch: {
                users: [{ userId: '43' }]
              }
            }
          }
        }
      ])
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserByEmail('user@example.com')
      )
    })
    it('should return null if no user ID is found', async () => {
      const nerdgraphClient = newNerdgraphClientWithOneResponse({
        actor: {
          users: {
            userSearch: {
              users: []
            }
          }
        }
      })
      const client = createUsersClient(nerdgraphClient)

      const user = await client.getUserByEmail('fake-user@newrelic.com')
      expect(user).toBeNull()
    })
    it('should throw NerdgraphError if getUserById fails', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              users: {
                userSearch: {
                  users: [{ userId: '42' }]
                }
              }
            }
          }
        ],
        [
          {
            actor: {
              entitySearch: {
                results: {
                  entities: [{ guid: '42', name: 'User 42' }]
                }
              }
            }
          },
          {
            actor: {
              entitySearch: {
                results: {
                  entities: [{ guid: '43', name: 'User 43' }]
                }
              }
            }
          }
        ]
      )
      const client = createUsersClient(nerdgraphClient)

      await expectNerdgraphError(() =>
        client.getUserByEmail('user@example.com')
      )
    })
    it('should return user when user is found by email', async () => {
      const nerdgraphClient = newNerdgraphClientWithResponses(
        [
          {
            actor: {
              users: {
                userSearch: {
                  users: [{ userId: '42' }]
                }
              }
            }
          }
        ],
        [
          {
            actor: {
              entitySearch: {
                results: {
                  entities: [{ guid: '42', name: 'User 42' }]
                }
              }
            }
          }
        ]
      )
      const client = createUsersClient(nerdgraphClient)

      const user = await client.getUserByEmail('fake-user@newrelic.com')
      expect(user).toEqual({ guid: '42', name: 'User 42' })
    })
  })
})
