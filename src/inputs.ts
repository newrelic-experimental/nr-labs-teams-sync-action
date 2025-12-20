import { getInput } from '@actions/core'
import { Region, toRegion } from './nerdgraph/nerdgraph.js'

export type Inputs = {
  orgId: string
  apiKey: string
  region: Region
  filesAdded: string[]
  filesModified: string[]
  filesDeleted: string[]
}

export function getInputs(): Inputs {
  const orgId = getInput('org-id', { required: true })
  const apiKey = getInput('api-key', { required: true })
  const region = getInput('region')
  const filesAdded = getInput('files-added')
  const filesModified = getInput('files-modified')
  const filesDeleted = getInput('files-deleted')

  return {
    orgId,
    apiKey,
    region: toRegion(region),
    filesAdded: !filesAdded
      ? []
      : filesAdded.split(/\s*,\s*/u).map((f) => f.trim()),
    filesModified: !filesModified
      ? []
      : filesModified.split(/\s*,\s*/u).map((f) => f.trim()),
    filesDeleted: !filesDeleted
      ? []
      : filesDeleted.split(/\s*,\s*/u).map((f) => f.trim())
  }
}
