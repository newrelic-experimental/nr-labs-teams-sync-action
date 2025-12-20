import { GraphQLResponseError, HttpError } from '../src/nerdgraph/graphql.js'
import { NerdgraphError } from '../src/nerdgraph/nerdgraph.js'

// see https://github.com/jest-community/eslint-plugin-jest/blob/v29.2.0/docs/rules/no-conditional-expect.md
export class NoErrorThrownError extends Error {}

export async function getError<TError>(call: () => unknown): Promise<TError> {
  try {
    await call()

    throw new NoErrorThrownError()
  } catch (error: unknown) {
    return error as TError
  }
}

export async function expectError<TError>(
  expected: TError,
  call: () => unknown
): Promise<TError> {
  const error = await getError(call)
  expect(error).not.toBeInstanceOf(NoErrorThrownError)
  expect(error).toBeInstanceOf(expected)
  return error as TError
}

export async function expectHttpError(
  code: number,
  call: () => unknown
): Promise<void> {
  const error = await expectError(HttpError, call)
  expect(error).toHaveProperty('status', code)
}

export async function expectGraphQLResponseError(
  call: () => unknown
): Promise<void> {
  await expect(call()).rejects.toThrow(GraphQLResponseError)
}

export async function expectNerdgraphError(call: () => unknown): Promise<void> {
  await expect(call()).rejects.toThrow(NerdgraphError)
}
