/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHttpError", "expectGraphQLResponseError"] }] */

/**
 * Unit tests for src/nerdgraph/graphql.ts
 */

import {
  findByPath,
  HttpPostResponse,
  newGraphQLClient,
  newGraphQLRequest
} from '../../src/nerdgraph/graphql.js'
import { expectGraphQLResponseError, expectHttpError } from '../util.js'
import { LoggerStub } from './stubs.js'

describe('findByPath', () => {
  it('should return property at path', () => {
    const obj = { foo: { bar: 42 } }
    expect(findByPath(obj, 'foo.bar')).toBe(42)
  })
  it('should return false for non-object property', () => {
    const obj = { foo: { bar: 42 } }
    expect(findByPath(obj, 'foo.bar.baz')).toBe(false)
  })
  it('should return null for missing property at last path segment', () => {
    const obj = { foo: { bar: {} } }
    expect(findByPath(obj, 'foo.bar.baz')).toBe(null)
  })
  it('should return null for non-own property at last path segment', () => {
    const proto = { baz: { beep: 42 } }
    const obj = { foo: { bar: Object.create(proto) } }
    expect(findByPath(obj, 'foo.bar.baz.beep')).toBe(null)
  })
})

describe('newGraphQLRequest', () => {
  it('should return expected default payload', () => {
    expect(newGraphQLRequest('{ actor { user { id } } }')).toEqual({
      query: 'query{ actor { user { id } } }',
      variables: {}
    })
  })
  it('should return expected payload with one variable', () => {
    expect(
      newGraphQLRequest('{ actor { user { id } } }', { foo: ['String', 'bar'] })
    ).toEqual({
      query: 'query($foo: String){ actor { user { id } } }',
      variables: { foo: 'bar' }
    })
  })
  it('should return expected payload with multiple variables', () => {
    expect(
      newGraphQLRequest('{ actor { user { id } } }', {
        foo: ['String', 'bar'],
        beep: ['Int!', 42],
        boop: ['Boolean', true]
      })
    ).toEqual({
      query:
        'query($foo: String,$beep: Int!,$boop: Boolean){ actor { user { id } } }',
      variables: { foo: 'bar', beep: 42, boop: true }
    })
  })
  it('should return expected mutation payload', () => {
    expect(newGraphQLRequest('{ actor { user { id } } }', {}, true)).toEqual({
      query: 'mutation{ actor { user { id } } }',
      variables: {}
    })
  })
})

describe('GraphQLClient', () => {
  describe('query', () => {
    it('should pass expected arguments to poster and return GraphQLResponse', async () => {
      const poster = async (
        url: string,
        headers: Record<string, string>,
        body: string
      ): Promise<HttpPostResponse> => {
        expect(url).toBe('https://api.newrelic.com/graphql')
        expect(headers).toEqual({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          'API-Key': 'foo',
          Foo: 'Bar'
        })
        expect(body).toBe(
          '{"query":"query($beep: String!,$buzz: Int!){ actor { user { id } } }","variables":{"beep":"boop","buzz":42}}'
        )

        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({ data: { foo: 'bar' } })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      const graphQLResponse = await client.query(
        'https://api.newrelic.com/graphql',
        {
          'API-Key': 'foo',
          Foo: 'Bar'
        },
        newGraphQLRequest('{ actor { user { id } } }', {
          beep: ['String!', 'boop'],
          buzz: ['Int!', 42]
        })
      )
      expect(graphQLResponse).toEqual({ data: { foo: 'bar' }, errors: [] })
    })
    it('should throw HttpError for 4xx and 5xx and invalid status codes', async () => {
      let code: number = 404

      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: code,
          message: 'Error',
          body: ''
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectHttpError(code, () =>
        client.query('foo', {}, newGraphQLRequest(''))
      )

      code = 502

      await expectHttpError(code, () =>
        client.query('foo', {}, newGraphQLRequest(''))
      )

      code = 99

      await expectHttpError(code, () =>
        client.query('foo', {}, newGraphQLRequest(''))
      )

      code = 600

      await expectHttpError(code, () =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should throw GraphQLResponseError for invalid JSON response', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: '{foo:,}'
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectGraphQLResponseError(() =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should throw GraphQLResponseError for invalid GraphQL response', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: '"foo"'
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectGraphQLResponseError(() =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should throw GraphQLResponseError for invalid error in GraphQL response', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({ errors: ['error'] })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectGraphQLResponseError(() =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should throw GraphQLResponseError for invalid message in GraphQL error', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({ errors: [{ message: 42 }] })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectGraphQLResponseError(() =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should throw GraphQLResponseError for invalid location in GraphQL error', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({
            errors: [{ message: 'error', locations: ['invalid'] }]
          })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectGraphQLResponseError(() =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should throw GraphQLResponseError for invalid line in GraphQL location', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({
            errors: [{ message: 'error', locations: [{ line: 'invalid' }] }]
          })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectGraphQLResponseError(() =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should throw GraphQLResponseError for invalid column in GraphQL location', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({
            errors: [
              { message: 'error', locations: [{ line: 42, column: 'invalid' }] }
            ]
          })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)

      await expectGraphQLResponseError(() =>
        client.query('foo', {}, newGraphQLRequest(''))
      )
    })
    it('should return GraphQLResponse with GraphQLResponseError for response with error message and no locations or path', async () => {
      const poster = async (): Promise<HttpPostResponse> => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({
            errors: [{ message: 'error' }]
          })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)
      const response = await client.query('foo', {}, newGraphQLRequest(''))

      expect(response).toEqual({
        data: null,
        errors: [
          {
            message: 'error',
            locations: [],
            path: []
          }
        ]
      })
    })
    it('should return GraphQLResponse with GraphQLResponseErrors for response with errors with locations and paths', async () => {
      const poster = async () => {
        return {
          url: 'https://api.newrelic.com/graphql',
          status: 200,
          message: 'OK',
          body: JSON.stringify({
            errors: [
              {
                message: 'error',
                locations: [{ line: 1, column: 2 }],
                path: ['path']
              },
              {
                message: 'error2',
                locations: [
                  { line: 3, column: 4 },
                  { line: 5, column: 6 }
                ],
                path: ['path2', 'path3']
              }
            ]
          })
        }
      }
      const client = newGraphQLClient(new LoggerStub(), poster)
      const response = await client.query('foo', {}, newGraphQLRequest(''))
      expect(response).toEqual({
        data: null,
        errors: [
          {
            message: 'error',
            locations: [{ line: 1, column: 2 }],
            path: ['path']
          },
          {
            message: 'error2',
            locations: [
              { line: 3, column: 4 },
              { line: 5, column: 6 }
            ],
            path: ['path2', 'path3']
          }
        ]
      })
    })
  })
})
