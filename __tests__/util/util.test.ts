/**
 * Unit tests for src/util/util.ts
 */

import { arraysEqual, Context } from '../../src/util/util.js'

describe('arraysEqual', () => {
  it('returns false for arrays of different lengths', () => {
    expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false)
  })
  it('returns true for two empty arrays', () => {
    expect(arraysEqual([], [])).toBe(true)
  })
  it('returns true for identical arrays', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true)
  })
  it('returns true for arrays with same elements in different order', () => {
    expect(arraysEqual([3, 2, 1], [1, 2, 3])).toBe(true)
  })
  it('returns false for arrays with different elements', () => {
    expect(arraysEqual([1, 2, 4], [1, 2, 3])).toBe(false)
  })
  it('returns true for same same size arrays with same duplicate elements', () => {
    expect(arraysEqual([1, 2, 2, 2, 5], [1, 5, 2, 2, 2])).toBe(true)
  })
})

describe('Context', () => {
  it('returns the same singleton instance for the same key', () => {
    const context = new Context()
    const instance1 = context.singleton('myKey', () => ({ value: 42 }))
    const instance2 = context.singleton('myKey', () => ({ value: 100 }))

    expect(instance1).toBe(instance2)
    expect(instance1.value).toBe(42)
  })

  it('returns different instances for different keys', () => {
    const context = new Context()
    const instance1 = context.singleton('key1', () => ({ value: 'first' }))
    const instance2 = context.singleton('key2', () => ({ value: 'second' }))

    expect(instance1).not.toBe(instance2)
    expect(instance1.value).toBe('first')
    expect(instance2.value).toBe('second')
  })
})
