import { findByPath } from './graphql.js'
import { NerdgraphClient, NerdgraphError, Region } from './nerdgraph.js'
import { isObjectAsIndexableObject, isString } from '../util/type-helper.js'

export type UserEntity = {
  guid: string
  name: string
}

function isUserSearchResult(
  obj: unknown
): obj is { authenticationDomainId: string; id: string } {
  return (
    isObjectAsIndexableObject(obj) &&
    isString(obj.authenticationDomainId) &&
    isString(obj.id)
  )
}

function isUserEntity(obj: unknown): obj is UserEntity {
  return (
    isObjectAsIndexableObject(obj) && isString(obj.guid) && isString(obj.name)
  )
}

export interface UsersClient {
  getUserIdByEmail(
    authenticationDomainId: string,
    email: string
  ): Promise<string | null>
  getUserById(userId: number | string): Promise<UserEntity | null>
  getUserByEmail(
    authenticationDomainId: string,
    email: string
  ): Promise<UserEntity | null>
}

export function newUsersClient(
  client: NerdgraphClient,
  apiKey: string,
  region: Region
): UsersClient {
  return new UsersClientImpl(client, apiKey, region)
}

class UsersClientImpl implements UsersClient {
  client: NerdgraphClient
  apiKey: string
  region: Region

  constructor(client: NerdgraphClient, apiKey: string, region: Region) {
    this.client = client
    this.apiKey = apiKey
    this.region = region
  }

  async getUserIdByEmail(
    authenticationDomainId: string,
    email: string
  ): Promise<string | null> {
    const results = await this.client.query(
      this.apiKey,
      `
      {
        customerAdministration {
          users(filter: {authenticationDomainId: {eq: $authenticationDomainId}, email: {eq: $email}}) {
            items {
              authenticationDomainId
              id
            }
          }
        }
      }
      `,
      {
        authenticationDomainId: ['ID', authenticationDomainId],
        email: ['String', email]
      },
      false,
      null,
      this.region
    )

    if (results.length !== 1) {
      throw new NerdgraphError(
        `Expected exactly one result but found ${results.length}`
      )
    }

    const items = findByPath(results[0], 'customerAdministration.users.items')

    if (items === null) {
      return null
    }

    if (!Array.isArray(items)) {
      throw new NerdgraphError(
        `Expected users items array but found ${typeof items}`
      )
    }

    if (items.length === 0) {
      return null
    }

    if (items.length > 1) {
      throw new NerdgraphError(
        `Expected exactly one user but found ${items.length}`
      )
    }

    const user = items[0]

    if (!isUserSearchResult(user)) {
      throw new NerdgraphError(
        `Expected user search result but found incompatible result`
      )
    }

    if (authenticationDomainId !== user.authenticationDomainId) {
      throw new NerdgraphError(
        `Expected authentication domain ID ${authenticationDomainId} but found ${user.authenticationDomainId}`
      )
    }

    return user.id
  }

  async getUserById(userId: number | string): Promise<UserEntity | null> {
    const results = await this.client.query(
      this.apiKey,
      `
      {
        actor {
          entitySearch(query: "type = 'USER' and tags.userId = '${userId}'") {
            results {
              entities {
                guid
                name
              }
            }
          }
        }
      }
      `,
      {},
      false,
      null,
      this.region
    )

    if (results.length !== 1) {
      throw new NerdgraphError(
        `Expected exactly one result but found ${results.length}`
      )
    }

    const entities = findByPath(
      results[0],
      'actor.entitySearch.results.entities'
    )

    if (entities === null) {
      return null
    }

    if (!Array.isArray(entities)) {
      throw new NerdgraphError(
        `Expected entity search results entities array but found ${typeof entities}`
      )
    }

    if (entities.length === 0) {
      return null
    }

    if (entities.length > 1) {
      throw new NerdgraphError(
        `Expected exactly one user entity but found ${entities.length}`
      )
    }

    const user = entities[0]

    if (!isUserEntity(user)) {
      throw new NerdgraphError(
        `Expected user entity but found incompatible result`
      )
    }

    return user
  }

  async getUserByEmail(
    authenticationDomainId: string,
    email: string
  ): Promise<UserEntity | null> {
    const userId = await this.getUserIdByEmail(authenticationDomainId, email)

    if (userId === null) {
      return null
    }

    return this.getUserById(userId)
  }
}
