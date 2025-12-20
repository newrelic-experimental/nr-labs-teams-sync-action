import { isString } from '../util/type-helper.js'
import {
  newGraphQLRequest,
  findByPath,
  GraphQLError,
  GraphQLClient
} from './graphql.js'

export enum Region {
  US = 'US',
  EU = 'EU'
}

const ENDPOINTS: Record<string, Record<Region, string>> = {
  GRAPHQL: {
    [Region.US]: 'https://api.newrelic.com/graphql',
    [Region.EU]: 'https://api.eu.newrelic.com/graphql'
  }
}

export class NerdgraphError extends Error {
  errors?: GraphQLError[]

  constructor(msg: string, errors?: GraphQLError[]) {
    super(msg)
    this.errors = errors
  }
}

export function toRegion(region: string | undefined): Region {
  if (!region) {
    return Region.US
  }

  const upperRegion = region.toUpperCase()
  if (upperRegion === Region.US) {
    return Region.US
  } else if (upperRegion === Region.EU) {
    return Region.EU
  }

  return Region.US
}

export interface NerdgraphClient {
  query(
    apiKey: string,
    query: string,
    variables: Record<string, [string, unknown]>,
    mutation?: boolean,
    nextCursorPath?: string | null,
    region?: Region,
    headers?: Record<string, string>
  ): Promise<unknown[]>
}

export function newNerdgraphClient(
  graphQLClient: GraphQLClient
): NerdgraphClient {
  return new NerdgraphClientImpl(graphQLClient)
}

class NerdgraphClientImpl implements NerdgraphClient {
  graphQLClient: GraphQLClient

  constructor(graphQLClient: GraphQLClient) {
    this.graphQLClient = graphQLClient
  }

  async query(
    apiKey: string,
    query: string,
    variables: Record<string, [string, unknown]>,
    mutation: boolean = false,
    nextCursorPath: string | null = null,
    region: Region = Region.US,
    headers: Record<string, string> = {}
  ): Promise<unknown[]> {
    const results = []
    let done = false,
      nextCursor = null

    while (!done) {
      if (nextCursorPath) {
        variables.cursor = ['String', nextCursor]
      }

      const { data, errors } = await this.graphQLClient.query(
        process.env.NERDGRAPH_ENDPOINT || ENDPOINTS.GRAPHQL[region],
        {
          'API-Key': apiKey,
          ...headers
        },
        newGraphQLRequest(query, variables, mutation)
      )

      if (errors.length > 0) {
        throw new NerdgraphError(
          `Errors returned on GraphQL post for query: ${query}`,
          errors
        )
      }

      results.push(data)

      if (nextCursorPath) {
        nextCursor = findByPath(data, nextCursorPath)
        if (nextCursor === false) {
          throw new NerdgraphError(
            `Expected value at path ${nextCursorPath} but found none`
          )
        }
      }

      if (nextCursor === null) {
        done = true
      } else if (!isString(nextCursor)) {
        throw new NerdgraphError(
          `Expected string at path ${nextCursorPath} but found ${typeof nextCursor}`
        )
      }
    }

    return results
  }
}
