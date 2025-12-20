/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectNerdgraphError"] }] */

/**
 * Unit tests for src/nerdgraph/nerdgraph.ts
 */

import { expectNerdgraphError } from '../util.js'
import {
  Region,
  toRegion,
  newNerdgraphClient
} from '../../src/nerdgraph/nerdgraph.js'
import { newGraphQLClientWithResponses } from './stubs.js'

describe('toRegion', () => {
  it('should return default region when input is undefined', () => {
    expect(toRegion(undefined)).toBe(Region.US)
  })
  it('should return US region for input "US"', () => {
    expect(toRegion('US')).toBe(Region.US)
  })
  it('should return EU region for input "EU"', () => {
    expect(toRegion('EU')).toBe(Region.EU)
  })
  it('should ignore case', () => {
    expect(toRegion('us')).toBe(Region.US)
    expect(toRegion('eu')).toBe(Region.EU)
  })
  it('should return default region for unknown input', () => {
    expect(toRegion('unknown')).toBe(Region.US)
  })
})

describe('NerdgraphClient', () => {
  describe('query', () => {
    it('should throw NerdgraphError for GraphQL errors', async () => {
      const client = newNerdgraphClient(
        newGraphQLClientWithResponses({
          data: null,
          errors: [{ message: 'foo', locations: [], path: [] }]
        })
      )

      await expectNerdgraphError(() =>
        client.query('foo', '{ actor { user { id } } }', {})
      )
    })
    it('should throw NerdgraphError for invalid nextCursorPath', async () => {
      const client = newNerdgraphClient(
        newGraphQLClientWithResponses({
          data: { foo: 'bar' },
          errors: []
        })
      )

      await expectNerdgraphError(() =>
        client.query('foo', '{ actor { user { id } } }', {}, false, 'foo.bar')
      )
    })
    it('should throw NerdgraphError for non-string nextCursor', async () => {
      const client = newNerdgraphClient(
        newGraphQLClientWithResponses({
          data: { foo: { bar: 42 } },
          errors: []
        })
      )

      await expectNerdgraphError(() =>
        client.query('foo', '{ actor { user { id } } }', {}, false, 'foo.bar')
      )
    })
    it('should call GraphQLClient with correct parameters using defaults', async () => {
      const graphQLClient = newGraphQLClientWithResponses({
        data: { foo: { bar: 42 } },
        errors: []
      })
      const client = newNerdgraphClient(graphQLClient)
      await client.query('my-api-key', '{ actor { user { id } } }', {
        var1: ['String', 'value1']
      })

      expect(graphQLClient.calls).toBe(1)
      expect(graphQLClient.url).toBe('https://api.newrelic.com/graphql')
      expect(graphQLClient.headers).toEqual({
        'API-Key': 'my-api-key'
      })
      expect(graphQLClient.payload).toEqual({
        query: 'query($var1: String){ actor { user { id } } }',
        variables: { var1: 'value1' }
      })
    })
    it('should call GraphQLClient with correct parameters using non-defaults', async () => {
      const graphQLClient = newGraphQLClientWithResponses({
        data: { foo: { bar: 42 } },
        errors: []
      })
      const client = newNerdgraphClient(graphQLClient)
      await client.query(
        'my-api-key',
        '{ entityDelete(guids: $guids) }',
        {
          guids: ['String', 'foo']
        },
        true,
        '',
        Region.EU,
        { Foo: 'Bar' }
      )

      expect(graphQLClient.calls).toBe(1)
      expect(graphQLClient.url).toBe('https://api.eu.newrelic.com/graphql')
      expect(graphQLClient.headers).toEqual({
        'API-Key': 'my-api-key',
        Foo: 'Bar'
      })
      expect(graphQLClient.payload).toEqual({
        query: 'mutation($guids: String){ entityDelete(guids: $guids) }',
        variables: { guids: 'foo' }
      })
    })
    it('should call GraphQLClient with correct parameters using custom endpoint', async () => {
      const graphQLClient = newGraphQLClientWithResponses({
        data: { foo: { bar: 42 } },
        errors: []
      })
      const client = newNerdgraphClient(graphQLClient)

      process.env.NERDGRAPH_ENDPOINT = 'https://fake-url.test/graphql'

      await client.query('my-api-key', '{ actor { user { id } } }', {})

      expect(graphQLClient.calls).toBe(1)
      expect(graphQLClient.url).toBe('https://fake-url.test/graphql')
      expect(graphQLClient.headers).toEqual({
        'API-Key': 'my-api-key'
      })
      expect(graphQLClient.payload).toEqual({
        query: 'query{ actor { user { id } } }',
        variables: {}
      })

      delete process.env.NERDGRAPH_ENDPOINT
    })
    it('should return one result with no nextCursorPath', async () => {
      const graphQLClient = newGraphQLClientWithResponses({
        data: { foo: { bar: 42 } },
        errors: []
      })
      const client = newNerdgraphClient(graphQLClient)
      const result = await client.query('foo', '{ actor { user { id } } }', {})

      expect(graphQLClient.calls).toBe(1)
      expect(result).toEqual([{ foo: { bar: 42 } }])
    })
    it('should return multiple results with nextCursorPath', async () => {
      const graphQLClient = newGraphQLClientWithResponses(
        {
          data: { foo: { bar: 42 }, nextCursor: 'foo' },
          errors: []
        },
        { data: { beep: { boop: 42 } }, errors: [] }
      )
      const client = newNerdgraphClient(graphQLClient)
      const result = await client.query(
        'foo',
        '{ actor { user { id } } }',
        {},
        false,
        'nextCursor'
      )

      expect(graphQLClient.calls).toBe(2)
      expect(result).toEqual([
        { foo: { bar: 42 }, nextCursor: 'foo' },
        { beep: { boop: 42 } }
      ])
    })
  })
})
