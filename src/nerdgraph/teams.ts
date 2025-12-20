import * as core from '@actions/core'
import { NerdgraphClient, NerdgraphError, Region } from './nerdgraph.js'
import { UserEntity, UsersClient } from './users.js'
import {
  isString,
  isNotEmptyString,
  isNumber,
  isStringArray,
  isObjectAsIndexableObject
} from '../util/type-helper.js'
import { findByPath } from './graphql.js'
import { arraysEqual } from '../util/util.js'

export type TeamResource = {
  type: string
  title: string | null
  content: string
}

export type TeamEntity = {
  id: string
  name: string
  description: string
  aliases: string[]
  resources: TeamResource[]
  membership: {
    id: string
  }
  tags: {
    key: string
    values: string[]
  }[]
}

export type UpdateMembershipResult = {
  usersAdded: string[]
  usersRemoved: string[]
}

function unmarshalTags(obj: unknown): { key: string; values: string[] }[] {
  if (!Array.isArray(obj)) {
    throw new NerdgraphError('Invalid tags')
  }

  return obj.map((item: unknown) => {
    if (!isObjectAsIndexableObject(item)) {
      throw new NerdgraphError('Invalid tag item')
    }

    if (!isNotEmptyString(item.key)) {
      throw new NerdgraphError('Invalid tag item key')
    }

    if (!isStringArray(item.values)) {
      throw new NerdgraphError('Invalid tag item values')
    }

    return {
      key: item.key,
      values: item.values
    }
  })
}

function newTeamResource(): TeamResource {
  return {
    type: '',
    title: null,
    content: ''
  }
}

export function unmarshalTeamResource(obj: unknown): TeamResource {
  if (!isObjectAsIndexableObject(obj)) {
    throw new NerdgraphError('Invalid team resource')
  }

  if (!isNotEmptyString(obj.type)) {
    throw new NerdgraphError('Invalid team resource type')
  }

  const resource: TeamResource = newTeamResource()

  resource.type = obj.type

  if (isString(obj.title)) {
    resource.title = obj.title
  }

  if (!isNotEmptyString(obj.content)) {
    throw new NerdgraphError('Invalid team resource content')
  }

  resource.content = obj.content

  return resource
}

function newTeamEntity(): TeamEntity {
  return {
    id: '',
    name: '',
    description: '',
    aliases: [],
    resources: [],
    membership: {
      id: ''
    },
    tags: []
  }
}

function unmarshalTeamEntity(obj: unknown): TeamEntity {
  // @todo this branch currently can't be covered because of the guard in
  // getTeamByName()
  /* istanbul ignore next */
  if (!isObjectAsIndexableObject(obj)) {
    /* istanbul ignore next */
    throw new NerdgraphError('Invalid team entity')
  }

  if (!isNotEmptyString(obj.id)) {
    throw new NerdgraphError('Invalid team entity id')
  }

  // @todo this branch currently can't be covered because of the guard in
  // getTeamByName()
  /* istanbul ignore next */
  if (!isNotEmptyString(obj.name)) {
    /* istanbul ignore next */
    throw new NerdgraphError('Invalid team entity name')
  }

  const entity: TeamEntity = newTeamEntity()

  entity.id = obj.id
  entity.name = obj.name

  if (isString(obj.description)) {
    entity.description = obj.description
  }

  if (isStringArray(obj.aliases)) {
    entity.aliases = obj.aliases
  }

  if (Array.isArray(obj.resources)) {
    entity.resources = obj.resources.map((item: unknown) =>
      unmarshalTeamResource(item)
    )
  }

  if (
    !isObjectAsIndexableObject(obj.membership) ||
    !isNotEmptyString(obj.membership.id)
  ) {
    throw new NerdgraphError('Invalid team entity membership')
  }

  entity.membership.id = obj.membership.id

  entity.tags = unmarshalTags(obj.tags)

  return entity
}

function isUserItem(obj: unknown): obj is { userId: number } {
  return isObjectAsIndexableObject(obj) && isNumber(obj.userId)
}

export interface TeamsClient {
  getTeamByName(name: string): Promise<TeamEntity | null>
  getTeamMembers(teamEntity: TeamEntity): Promise<UserEntity[]>
  addMembers(teamEntity: TeamEntity, userGuids: string[]): Promise<string[]>
  removeMembers(teamEntity: TeamEntity, userGuids: string[]): Promise<string[]>
  updateMembership(
    teamEntity: TeamEntity,
    members: string[]
  ): Promise<UpdateMembershipResult>
  createTeam(
    name: string,
    members: string[],
    description: string,
    aliases: string[],
    tags: Record<string, string[]>,
    resources: TeamResource[]
  ): Promise<TeamEntity>
  updateTeam(
    name: string,
    members: string[],
    description: string,
    aliases: string[],
    tags: Record<string, string[]>,
    resources: TeamResource[]
  ): Promise<TeamEntity>
  removeTeam(name: string): Promise<string>
}

export function newTeamsClient(
  client: NerdgraphClient,
  usersClient: UsersClient,
  orgId: string,
  apiKey: string,
  region: Region
): TeamsClient {
  return new TeamsClientImpl(client, usersClient, orgId, apiKey, region)
}

class TeamsClientImpl implements TeamsClient {
  client: NerdgraphClient
  usersClient: UsersClient
  orgId: string
  apiKey: string
  region: Region

  constructor(
    client: NerdgraphClient,
    usersClient: UsersClient,
    orgId: string,
    apiKey: string,
    region: Region
  ) {
    this.client = client
    this.usersClient = usersClient
    this.orgId = orgId
    this.apiKey = apiKey
    this.region = region
  }

  async getTeamByName(name: string): Promise<TeamEntity | null> {
    const results = await this.client.query(
      this.apiKey,
      `
      {
        actor {
          entityManagement {
            entitySearch(query: "type = 'TEAM'", cursor: $cursor) {
              entities {
                ... on EntityManagementTeamEntity {
                  id
                  name
                  description
                  aliases
                  resources {
                    content
                    title
                    type
                  }
                  membership {
                    id
                  }
                  tags {
                    key
                    values
                  }
                }
              }
              nextCursor
            }
          }
        }
      }
      `,
      {},
      false,
      'actor.entityManagement.entitySearch.nextCursor',
      this.region
    )

    for (const result of results) {
      const resultEntities = findByPath(
        result,
        'actor.entityManagement.entitySearch.entities'
      )

      if (resultEntities === null) {
        continue
      }

      if (!Array.isArray(resultEntities)) {
        throw new NerdgraphError(
          `Expected entity management entity search entities array but found ${typeof resultEntities}`
        )
      }

      for (const entity of resultEntities) {
        if (isObjectAsIndexableObject(entity) && entity.name === name) {
          return unmarshalTeamEntity(entity)
        }
      }
    }

    return null
  }

  async getTeamMembers(teamEntity: TeamEntity): Promise<UserEntity[]> {
    const results = await this.client.query(
      this.apiKey,
      `
      {
          actor {
            entityManagement {
              collectionElements(
                filter: {collectionId: {eq: $collectionId}}
                cursor: $cursor
              ) {
                items {
                  ... on EntityManagementUserEntity {
                    userId
                  }
                }
                nextCursor
              }
            }
          }
      }
      `,
      { collectionId: ['ID!', teamEntity.membership.id] },
      false,
      'actor.entityManagement.collectionElements.nextCursor',
      this.region
    )

    const members: UserEntity[] = []

    for (const result of results) {
      const items = findByPath(
        result,
        'actor.entityManagement.collectionElements.items'
      )

      if (items === null) {
        continue
      }

      if (!Array.isArray(items)) {
        throw new NerdgraphError(
          `Expected entity management collection elements items array but found ${typeof items}`
        )
      }

      for (const item of items) {
        if (!isUserItem(item)) {
          throw new NerdgraphError(
            `Expected user item but found incompatible result`
          )
        }

        const user = await this.usersClient.getUserById(item.userId)

        if (user === null) {
          throw new NerdgraphError(
            `Invalid userId returned for collection: ${item.userId}`
          )
        }

        members.push(user)
      }
    }

    return members
  }

  async addMembers(
    teamEntity: TeamEntity,
    userGuids: string[]
  ): Promise<string[]> {
    const results = await this.client.query(
      this.apiKey,
      `
{
  entityManagementAddCollectionMembers(
    collectionId: $collectionId
    ids: $userIds
  )
}`,
      {
        collectionId: ['ID!', teamEntity.membership.id],
        userIds: ['[ID!]!', userGuids]
      },
      true,
      null,
      this.region
    )

    if (results.length !== 1) {
      throw new NerdgraphError(
        `Expected one add member result but found ${results.length}`
      )
    }

    const result = results[0]
    const addedUserIds = findByPath(
      result,
      'entityManagementAddCollectionMembers'
    )

    if (!isStringArray(addedUserIds)) {
      throw new NerdgraphError(
        `Expected added user IDs array but found ${typeof addedUserIds}`
      )
    }

    if (!arraysEqual(addedUserIds, userGuids)) {
      throw new NerdgraphError(
        `Expected the set of users to add and the set of users added to be equal but they differ`
      )
    }

    return addedUserIds
  }

  async removeMembers(
    teamEntity: TeamEntity,
    userGuids: string[]
  ): Promise<string[]> {
    const results = await this.client.query(
      this.apiKey,
      `
{
  entityManagementRemoveCollectionMembers(
    collectionId: $collectionId
    ids: $userGuids
  )
}`,
      {
        collectionId: ['ID!', teamEntity.membership.id],
        userGuids: ['[ID!]!', userGuids]
      },
      true,
      null,
      this.region
    )

    if (results.length !== 1) {
      throw new NerdgraphError(
        `Expected one remove member result but found ${results.length}`
      )
    }

    const result = results[0]
    const removedUserIds = findByPath(
      result,
      'entityManagementRemoveCollectionMembers'
    )

    if (!isStringArray(removedUserIds)) {
      throw new NerdgraphError(
        `Expected added user IDs array but found ${typeof removedUserIds}`
      )
    }

    if (!arraysEqual(removedUserIds, userGuids)) {
      throw new NerdgraphError(
        `Expected the set of users to remove and the set of users removed to be equal but they differ`
      )
    }

    return removedUserIds
  }

  async updateMembership(
    teamEntity: TeamEntity,
    members: string[]
  ): Promise<UpdateMembershipResult> {
    const currMembers = await this.getTeamMembers(teamEntity)
    const usersToAdd: string[] = []
    const usersToRemove: string[] = currMembers.map((member) => member.guid)

    for (const email of members) {
      const user = await this.usersClient.getUserByEmail(email)

      if (user === null) {
        core.warning(`User not found: ${email}`)
        continue
      }

      const { guid } = user
      const index = usersToRemove.indexOf(guid)

      if (index === -1) {
        usersToAdd.push(guid)
      } else {
        usersToRemove.splice(index, 1)
      }
    }

    if (usersToAdd.length > 0) {
      await this.addMembers(teamEntity, usersToAdd)
    }

    if (usersToRemove.length > 0) {
      await this.removeMembers(teamEntity, usersToRemove)
    }

    return { usersAdded: usersToAdd, usersRemoved: usersToRemove }
  }

  async createTeam(
    name: string,
    members: string[],
    description: string,
    aliases: string[],
    tags: Record<string, string[]>,
    resources: TeamResource[]
  ): Promise<TeamEntity> {
    const results = await this.client.query(
      this.apiKey,
      `
{
  entityManagementCreateTeam(
    teamEntity: {
      name: $teamName,
      description: $teamDescription,
      aliases: $teamAliases,
      tags: $tags
      resources: $resources
      scope: {
        id: $orgId,
        type: ORGANIZATION
      },
    }
  ) {
    entity {
      id
    }
  }
}`,
      {
        teamName: ['String!', name],
        teamDescription: ['String', description],
        teamAliases: ['[String!]', aliases],
        orgId: ['ID!', this.orgId],
        tags: [
          '[EntityManagementTagInput!]',
          Object.entries(tags).map(([key, values]) => ({ key, values }))
        ],
        resources: ['[EntityManagementTeamResourceCreateInput!]', resources]
      },
      true,
      null,
      this.region
    )

    if (results.length !== 1) {
      throw new NerdgraphError(
        `Expected one create team result but found ${results.length}`
      )
    }

    const result = results[0]
    const teamEntityGuid = findByPath(
      result,
      'entityManagementCreateTeam.entity.id'
    )

    if (!isNotEmptyString(teamEntityGuid)) {
      throw new NerdgraphError(
        `Expected team entity GUID but found ${teamEntityGuid}`
      )
    }

    const teamEntity = await this.getTeamByName(name)

    if (teamEntity === null) {
      throw new NerdgraphError(`Team not found: ${name}`)
    }

    if (teamEntity.id !== teamEntityGuid) {
      throw new NerdgraphError(
        `Expected created team entity GUID ${teamEntityGuid} to match fetched team entity GUID ${teamEntity.id}`
      )
    }

    await this.updateMembership(teamEntity, members)

    return teamEntity
  }

  async updateTeam(
    name: string,
    members: string[],
    description: string,
    aliases: string[],
    tags: Record<string, string[]>,
    resources: TeamResource[]
  ): Promise<TeamEntity> {
    const teamEntity = await this.getTeamByName(name)

    if (teamEntity === null) {
      throw new NerdgraphError(`Team not found: ${name}`)
    }

    const results = await this.client.query(
      this.apiKey,
      `
{
  entityManagementUpdateTeam(
    id: $teamId
    teamEntity: {
      name: $teamName,
      description: $teamDescription,
      aliases: $teamAliases,
      tags: $tags
      resources: $resources
    }
  ) {
    entity {
      id
      name
      description
      aliases
      resources {
        content
        title
        type
      }
      membership {
        id
      }
      tags {
        key
        values
      }
    }
  }
}`,
      {
        teamId: ['ID!', teamEntity.id],
        teamName: ['String!', name],
        teamDescription: ['String', description],
        teamAliases: ['[String!]', aliases],
        tags: [
          '[EntityManagementTagInput!]',
          Object.entries(tags).map(([key, values]) => ({ key, values }))
        ],
        resources: ['[EntityManagementTeamResourceUpdateInput!]', resources]
      },
      true,
      null,
      this.region
    )

    if (results.length !== 1) {
      throw new NerdgraphError(
        `Expected one update team result but found ${results.length}`
      )
    }

    const result = results[0]
    const entity = findByPath(result, 'entityManagementUpdateTeam.entity')

    if (!isObjectAsIndexableObject(entity)) {
      throw new NerdgraphError(
        `Expected updated team entity but found incompatible result`
      )
    }

    const updatedTeamEntity = unmarshalTeamEntity(entity)

    await this.updateMembership(updatedTeamEntity, members)

    return updatedTeamEntity
  }

  async removeTeam(name: string): Promise<string> {
    const teamEntity = await this.getTeamByName(name)

    if (teamEntity === null) {
      throw new NerdgraphError(`Team not found: ${name}`)
    }

    const results = await this.client.query(
      this.apiKey,
      `
{
  entityManagementDelete(id: $teamId) {
    id
  }
}`,
      {
        teamId: ['ID!', teamEntity.id]
      },
      true,
      null,
      this.region
    )

    if (results.length !== 1) {
      throw new NerdgraphError(
        `Expected one delete team result but found ${results.length}`
      )
    }

    const result = results[0]
    const teamEntityGuid = findByPath(result, 'entityManagementDelete.id')

    if (!isNotEmptyString(teamEntityGuid)) {
      throw new NerdgraphError(
        `Expected team entity GUID but found ${teamEntityGuid}`
      )
    }

    if (teamEntity.id !== teamEntityGuid) {
      throw new NerdgraphError(
        `Expected deleted team entity GUID ${teamEntityGuid} to match fetched team entity GUID ${teamEntity.id}`
      )
    }

    return teamEntityGuid
  }
}
