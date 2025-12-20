export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  const s1 = [...arr1].sort()
  const s2 = [...arr2].sort()

  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) {
      return false
    }
  }

  return true
}

export class Context {
  singletons: Record<string, unknown>

  constructor() {
    this.singletons = {}
  }

  singleton<T>(key: string, factory: () => T): T {
    if (this.singletons[key]) {
      return this.singletons[key] as T
    }

    this.singletons[key] = factory()
    return this.singletons[key] as T
  }
}
