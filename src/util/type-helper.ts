export type IndexableObject = {
  [key: string]: unknown
}

export function isDefined(value: unknown): boolean {
  return typeof value !== 'undefined'
}

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && !Array.isArray(value) && value !== null
}

export function isObjectAsIndexableObject(
  value: unknown
): value is IndexableObject {
  return isObject(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string' && value !== null
}

export function isNotEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

export function isStringMapStringArray(
  value: unknown
): value is Record<string, string[]> {
  return isObject(value) && Object.values(value).every(isStringArray)
}
