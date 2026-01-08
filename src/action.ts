import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import * as core from '@actions/core'
import { Inputs } from './inputs.js'
import {
  unmarshalTeamResource,
  TeamResource,
  TeamsClient,
  TeamEntity,
  TeamMembersInput
} from './nerdgraph/teams.js'
import {
  isObjectAsIndexableObject,
  isString,
  isStringArray,
  isStringMapStringArray
} from './util/type-helper.js'

type TeamDefinition = {
  description: string
  aliases: string[]
  members: TeamMembersInput[]
  contacts: TeamResource[]
  links: TeamResource[]
  tags: Record<string, string[]>
}

function isTeamMembersInput(value: unknown): value is TeamMembersInput {
  if (!isObjectAsIndexableObject(value)) {
    return false
  }

  if (!isString(value.authenticationDomainId)) {
    return false
  }

  if (!isStringArray(value.members)) {
    return false
  }

  return true
}

function isStringOrTeamMembersInputArray(
  value: unknown
): value is (string | TeamMembersInput)[] {
  return (
    Array.isArray(value) &&
    value.every((val) => isString(val) || isTeamMembersInput(val))
  )
}

function newTeamDefinition(): TeamDefinition {
  return {
    description: '',
    aliases: [],
    members: [],
    contacts: [],
    links: [],
    tags: {}
  }
}

function stringOrTeamMembersInputArrayToTeamMembersInputArray(
  defaultAuthenticationDomainId: string | undefined,
  arr: (string | TeamMembersInput)[]
): TeamMembersInput[] {
  let defaultTeamMembersInput: TeamMembersInput | undefined = undefined

  return arr.reduce(
    (
      acc: TeamMembersInput[],
      item: string | TeamMembersInput
    ): TeamMembersInput[] => {
      if (typeof item !== 'string') {
        // If item is not a string, it must be a TeamMembersInput so just
        // concatenate the accumulator with the item.
        return [...acc, item]
      }

      // Otherwise it's a string and we will assume it's an email address in the
      // authentication domain with the specified default authentication domain
      // ID. If no default authentication domain ID was specified, raise an
      // error. Otherwise, if the TeamMembersInput for the default
      // authentication domain has not been created, create it with the default
      // authentication domain ID and the email address and concatenate the
      // accumulator with it. If the TeamMembersInput for the default
      // authentication domain has already been created and added to the
      // accumulator, just push the email address on the members array and
      // return the accumulator.
      if (!defaultAuthenticationDomainId) {
        throw new Error(
          'A default authentication domain ID is required when members are specified without authentication domain IDs'
        )
      }

      if (!defaultTeamMembersInput) {
        defaultTeamMembersInput = {
          authenticationDomainId: defaultAuthenticationDomainId,
          members: [item]
        }

        return [...acc, defaultTeamMembersInput]
      }

      defaultTeamMembersInput.members.push(item)

      return acc
    },
    []
  )
}

function unmarshalTeamDefinition(
  authenticationDomainId: string | undefined,
  obj: unknown
): TeamDefinition {
  if (!isObjectAsIndexableObject(obj)) {
    throw new Error('Invalid team definition')
  }

  const team: TeamDefinition = newTeamDefinition()

  if (isStringOrTeamMembersInputArray(obj.members)) {
    team.members = stringOrTeamMembersInputArrayToTeamMembersInputArray(
      authenticationDomainId,
      obj.members
    )
  }

  if (isString(obj.description)) {
    team.description = obj.description
  }

  if (isStringArray(obj.aliases)) {
    team.aliases = obj.aliases
  }

  if (Array.isArray(obj.contacts)) {
    team.contacts = obj.contacts.map((item: unknown) =>
      unmarshalTeamResource(item)
    )
  }

  if (Array.isArray(obj.links)) {
    team.links = obj.links.map((item: unknown) => unmarshalTeamResource(item))
  }

  if (isStringMapStringArray(obj.tags)) {
    team.tags = obj.tags
  }

  return team as TeamDefinition
}

export interface TeamsSyncAction {
  run(): Promise<void>
  processFilesAdded(filesAdded: string[]): Promise<TeamEntity[]>
  processFilesModified(filesModified: string[]): Promise<TeamEntity[]>
  processFilesDeleted(filesDeleted: string[]): Promise<string[]>
}

export function newTeamsSyncAction(
  client: TeamsClient,
  inputs: Inputs
): TeamsSyncAction {
  return new TeamsSyncActionImpl(client, inputs)
}

class TeamsSyncActionImpl implements TeamsSyncAction {
  workspace: string
  client: TeamsClient
  inputs: Inputs

  constructor(client: TeamsClient, inputs: Inputs) {
    this.workspace = process.env.GITHUB_WORKSPACE || ''
    this.client = client
    this.inputs = inputs
  }

  async run() {
    const { filesAdded, filesModified, filesDeleted }: Inputs = this.inputs

    await this.processFilesAdded(filesAdded)
    await this.processFilesModified(filesModified)
    await this.processFilesDeleted(filesDeleted)
  }

  async processFilesAdded(filesAdded: string[]): Promise<TeamEntity[]> {
    if (filesAdded.length === 0) {
      core.debug('no files added')
      return []
    }

    const teams: TeamEntity[] = []

    for (const file of filesAdded) {
      const filePath = join(this.workspace, file)
      core.debug(`loading added file: ${filePath}`)

      const data = JSON.parse(await readFile(filePath, { encoding: 'utf-8' }))
      const teamDefinition = unmarshalTeamDefinition(
        this.inputs.authenticationDomainId,
        data
      )
      const teamName = basename(file, extname(file))

      core.debug(`creating team: ${teamName}`)
      const team = await this.client.createTeam(
        teamName,
        teamDefinition.members,
        teamDefinition.description,
        teamDefinition.aliases,
        teamDefinition.tags,
        [...teamDefinition.contacts, ...teamDefinition.links]
      )

      teams.push(team)
    }

    return teams
  }

  async processFilesModified(filesModified: string[]): Promise<TeamEntity[]> {
    if (filesModified.length === 0) {
      core.debug('no files modified')
      return []
    }

    const teams: TeamEntity[] = []

    for (const file of filesModified) {
      const filePath = join(this.workspace, file)
      core.debug(`loading modified file: ${filePath}`)

      const data = JSON.parse(await readFile(filePath, { encoding: 'utf-8' }))
      const teamDefinition = unmarshalTeamDefinition(
        this.inputs.authenticationDomainId,
        data
      )
      const teamName = basename(file, extname(file))

      core.debug(`updating team: ${teamName}`)
      const team = await this.client.updateTeam(
        teamName,
        teamDefinition.members,
        teamDefinition.description,
        teamDefinition.aliases,
        teamDefinition.tags,
        [...teamDefinition.contacts, ...teamDefinition.links]
      )

      teams.push(team)
    }

    return teams
  }

  async processFilesDeleted(filesDeleted: string[]): Promise<string[]> {
    if (filesDeleted.length === 0) {
      core.debug('no files deleted')
      return []
    }

    const ids: string[] = []

    for (const file of filesDeleted) {
      const teamName = basename(file, extname(file))

      core.debug(`deleting team: ${teamName}`)
      const id = await this.client.removeTeam(teamName)

      ids.push(id)
    }

    return ids
  }
}
