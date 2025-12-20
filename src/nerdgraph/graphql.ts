/**
 * A very simple, bare minimum GraphQL client implementation for NerdGraph.
 */

import {
  IndexableObject,
  isDefined,
  isNotEmptyString,
  isNumber,
  isObjectAsIndexableObject,
  isStringArray
} from '../util/type-helper.js'
import { Logger } from '../logger.js'

export type GraphQLRequest = {
  query: string
  variables: Record<string, unknown>
}

export type GraphQLError = {
  message: string
  locations: { line: number; column: number }[]
  path: string[]
}

export type GraphQLResponse = {
  data: unknown
  errors: GraphQLError[]
}

export class GraphQLResponseError extends Error {
  response: unknown

  constructor(msg: string, response: unknown) {
    super(msg)
    this.response = response
  }
}

function findByPathHelper(
  val: unknown,
  arr: string[],
  index: number = 0
): unknown {
  if (index === arr.length) {
    // I can't come up with a scenario where this would happen but also can't
    // definitively prove it won't, so...
    /* istanbul ignore next */
    return false
  }

  if (typeof val === 'object') {
    const key = arr[index]
    const obj = val as IndexableObject

    if (index === arr.length - 1) {
      if (Object.hasOwn(obj, key)) {
        return obj[key]
      }
      return null
    }

    if (Object.hasOwn(obj, key)) {
      return findByPathHelper(obj[key], arr, index + 1)
    }

    return null
  }

  return false
}

export function findByPath(d: unknown, propPath: string): unknown {
  return findByPathHelper(d, propPath.split('.'))
}

export function newGraphQLRequest(
  query: string,
  variables: Record<string, [string, unknown]> = {},
  mutation: boolean = false
): GraphQLRequest {
  const vars: Record<string, unknown> = {},
    keys = Object.keys(variables)
  let varSpec = keys.reduce((prev, key, index) => {
    let str = prev

    if (index > 0) {
      str += ','
    }

    const [type, value] = variables[key]

    // Yum, side effects
    vars[key] = value
    return `${str}$${key}: ${type}`
  }, '')

  if (keys.length > 0) {
    varSpec = `(${varSpec})`
  }

  return {
    query: `${mutation ? 'mutation' : 'query'}${varSpec}${query}`,
    variables: vars
  }
}

function newGraphQLErrorLocation(): { line: number; column: number } {
  return {
    line: 0,
    column: 0
  }
}

function unmarshalGraphQLErrorLocation(obj: unknown): {
  line: number
  column: number
} {
  if (!isObjectAsIndexableObject(obj)) {
    throw new GraphQLResponseError('Invalid GraphQL error location', obj)
  }

  if (!isNumber(obj.line)) {
    throw new GraphQLResponseError('Invalid GraphQL error location line', obj)
  }

  if (!isNumber(obj.column)) {
    throw new GraphQLResponseError('Invalid GraphQL error location column', obj)
  }

  const location = newGraphQLErrorLocation()

  location.line = obj.line
  location.column = obj.column

  return location
}

function newGraphQLError(): GraphQLError {
  return {
    message: '',
    locations: [],
    path: []
  }
}

function unmarshalGraphQLError(obj: unknown): GraphQLError {
  const error: GraphQLError = newGraphQLError()

  if (!isObjectAsIndexableObject(obj)) {
    throw new GraphQLResponseError('Invalid GraphQL error', obj)
  }

  if (!isNotEmptyString(obj.message)) {
    throw new GraphQLResponseError('Invalid GraphQL error message', obj)
  }

  error.message = obj.message

  if (Array.isArray(obj.locations)) {
    error.locations = obj.locations.map((loc: unknown) =>
      unmarshalGraphQLErrorLocation(loc)
    )
  }

  if (isStringArray(obj.path)) {
    error.path = obj.path
  }

  return error
}

function newGraphQLResponse(): GraphQLResponse {
  return {
    data: null,
    errors: []
  }
}

function unmarshalGraphQLResponse(obj: unknown): GraphQLResponse {
  if (!isObjectAsIndexableObject(obj)) {
    throw new GraphQLResponseError('Invalid GraphQL response', obj)
  }

  const response: GraphQLResponse = newGraphQLResponse()

  if (isDefined(obj.data)) {
    response.data = obj.data
  }

  if (Array.isArray(obj.errors)) {
    response.errors = obj.errors.map((err: unknown) =>
      unmarshalGraphQLError(err)
    )
  }

  return response
}

export type HttpPostResponse = {
  url: string
  status: number
  message: string
  body: string
}

export type HttpPostFunc = (
  url: string,
  headers: Record<string, string>,
  body: string
) => Promise<HttpPostResponse>

export class HttpError extends Error {
  status: number

  constructor(msg: string, status: number) {
    super(msg)

    this.status = status
  }
}

function raiseForStatus(response: HttpPostResponse) {
  if (400 <= response.status && response.status < 500) {
    throw new HttpError(
      `${response.status} Client Error: ${response.message} for url: ${response.url}`,
      response.status
    )
  }

  if (500 <= response.status && response.status < 600) {
    throw new HttpError(
      `${response.status} Server Error: ${response.message} for url: ${response.url}`,
      response.status
    )
  }

  if (response.status < 100 || response.status > 599) {
    throw new HttpError(
      `${response.status} Invalid Status: ${response.message} for url: ${response.url}`,
      response.status
    )
  }
}

export interface GraphQLClient {
  query(
    url: string,
    headers: Record<string, string>,
    payload: unknown
  ): Promise<GraphQLResponse>
}

export function newGraphQLClient(
  logger: Logger,
  poster: HttpPostFunc
): GraphQLClient {
  return new GraphQLClientImpl(logger, poster)
}

class GraphQLClientImpl implements GraphQLClient {
  logger: Logger
  poster: HttpPostFunc

  constructor(logger: Logger, poster: HttpPostFunc) {
    this.logger = logger
    this.poster = poster
  }

  async query(
    url: string,
    headers: Record<string, string>,
    payload: GraphQLRequest
  ): Promise<GraphQLResponse> {
    /* istanbul ignore next */
    if (this.logger.isDebugEnabled()) {
      /* istanbul ignore next */
      this.logger.debug(JSON.stringify(payload, null, 2))
    }

    const response = await this.poster(
      url,
      {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        ...headers
      },
      JSON.stringify(payload)
    )

    raiseForStatus(response)

    let responseJson = null

    try {
      responseJson = JSON.parse(response.body)
    } catch (error) {
      throw new GraphQLResponseError(
        `Failed to parse JSON response with error: "${error}" for query: "${response.body}"`,
        response
      )
    }

    /* istanbul ignore next */
    if (this.logger.isDebugEnabled()) {
      /* istanbul ignore next */
      this.logger.debug(JSON.stringify(responseJson, null, 2))
    }

    return unmarshalGraphQLResponse(responseJson)
  }
}
