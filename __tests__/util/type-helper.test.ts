/**
 * Unit tests for src/util/type-helper.ts
 */

import {
  isDefined,
  isNotEmptyString,
  isNumber,
  isObject,
  isObjectAsIndexableObject,
  isString,
  isStringArray,
  isStringMapStringArray
} from '../../src/util/type-helper.js'

describe('isDefined', () => {
  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false)
  })
  it('returns true for defined values', () => {
    expect(isDefined(null)).toBe(true)
    expect(isDefined(0)).toBe(true)
    expect(isDefined('')).toBe(true)
    expect(isDefined({})).toBe(true)
  })
})

describe('isObject', () => {
  it('returns false for non-objects', () => {
    expect(isObject(undefined)).toBe(false)
    expect(isObject(42)).toBe(false)
    expect(isObject('string')).toBe(false)
    expect(isObject(true)).toBe(false)
  })
  it('returns false for null', () => {
    expect(isObject(null)).toBe(false)
  })
  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false)
  })
  it('returns true for objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject(new Date())).toBe(true)
  })
})

describe('isObjectAsIndexableObject', () => {
  // Since isObjectAsIndexableObject is just an alias for isObject,
  // but for typing purposes with TypeScript, we can reuse the tests
  // from isObject.
  it('returns false for non-objects', () => {
    expect(isObjectAsIndexableObject(undefined)).toBe(false)
    expect(isObjectAsIndexableObject(42)).toBe(false)
    expect(isObjectAsIndexableObject('string')).toBe(false)
    expect(isObjectAsIndexableObject(true)).toBe(false)
  })
  it('returns false for null', () => {
    expect(isObjectAsIndexableObject(null)).toBe(false)
  })
  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false)
  })
  it('returns true for objects', () => {
    expect(isObjectAsIndexableObject({})).toBe(true)
    expect(isObjectAsIndexableObject(new Date())).toBe(true)
  })
})

describe('isString', () => {
  it('returns false for non-strings', () => {
    expect(isString(undefined)).toBe(false)
    expect(isString(42)).toBe(false)
    expect(isString({})).toBe(false)
    expect(isString(true)).toBe(false)
  })
  it('returns false for null', () => {
    expect(isString(null)).toBe(false)
  })
  it('returns true for strings', () => {
    expect(isString('')).toBe(true)
    expect(isString('hello')).toBe(true)
  })
})

describe('isNotEmptyString', () => {
  it('returns false for non-strings', () => {
    expect(isNotEmptyString(undefined)).toBe(false)
    expect(isNotEmptyString(42)).toBe(false)
    expect(isNotEmptyString({})).toBe(false)
    expect(isNotEmptyString(true)).toBe(false)
  })
  it('returns false for null', () => {
    expect(isNotEmptyString(null)).toBe(false)
  })
  it('returns false for empty strings', () => {
    expect(isNotEmptyString('')).toBe(false)
  })
  it('returns true for non-empty strings', () => {
    expect(isNotEmptyString('hello')).toBe(true)
  })
})

describe('isNumber', () => {
  it('returns false for non-numbers', () => {
    expect(isNumber(undefined)).toBe(false)
    expect(isNumber('42')).toBe(false)
    expect(isNumber({})).toBe(false)
    expect(isNumber(true)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(isNumber(NaN)).toBe(false)
  })
  it('returns true for numbers', () => {
    expect(isNumber(0)).toBe(true)
    expect(isNumber(3.14)).toBe(true)
    expect(isNumber(-42)).toBe(true)
  })
})

describe('isStringArray', () => {
  it('returns false for non-arrays', () => {
    expect(isStringArray(undefined)).toBe(false)
    expect(isStringArray('not an array')).toBe(false)
    expect(isStringArray({})).toBe(false)
    expect(isStringArray(42)).toBe(false)
  })
  it('returns false for arrays with non-string elements', () => {
    expect(isStringArray(['string', 42, 'another string'])).toBe(false)
    expect(isStringArray([true, 'string'])).toBe(false)
  })
  it('returns true for arrays of strings', () => {
    expect(isStringArray([])).toBe(true)
    expect(isStringArray(['one', 'two', 'three'])).toBe(true)
  })
})

describe('isStringMapStringArray', () => {
  it('returns false for non-objects (including arrays)', () => {
    expect(isStringMapStringArray(undefined)).toBe(false)
    expect(isStringMapStringArray('not an object')).toBe(false)
    expect(isStringMapStringArray(42)).toBe(false)
    expect(isStringMapStringArray([])).toBe(false)
  })
  it('returns false for objects with non-array values', () => {
    expect(isStringMapStringArray({ key1: 'not an array' })).toBe(false)
    expect(isStringMapStringArray({ key2: 42 })).toBe(false)
  })
  it('returns false for objects with arrays containing non-string elements', () => {
    expect(isStringMapStringArray({ key1: ['string', 42] })).toBe(false)
    expect(isStringMapStringArray({ key2: [true, 'string'] })).toBe(false)
  })
  it('returns true for objects with string array values', () => {
    expect(isStringMapStringArray({})).toBe(true)
    expect(
      isStringMapStringArray({ key1: ['one', 'two'], key2: ['three'] })
    ).toBe(true)
  })
})
