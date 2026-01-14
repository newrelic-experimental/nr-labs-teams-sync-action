import { jest } from '@jest/globals'

jest.unstable_mockModule('@actions/core', async () => ({
  getInput: jest.fn()
}))

const mockedCore = await import('@actions/core')
const { getInputs } = await import('../src/inputs.js')

describe('getInputs', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should throw Error if getInput does', () => {
    ;(mockedCore.getInput as jest.Mock).mockImplementation(() => {
      throw new Error('test error')
    })

    expect(() => {
      getInputs()
    }).toThrow('test error')
  })
  it('should set orgId to result of getInput("org-id")', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'org-id') {
        return 'fake-org-id'
      }
      return ''
    })

    const result = getInputs()
    expect(result.orgId).toBe('fake-org-id')
  })
  it('should set apiKey to result of getInput("api-key")', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'api-key') {
        return 'fake-api-key'
      }
      return ''
    })

    const result = getInputs()
    expect(result.apiKey).toBe('fake-api-key')
  })
  it('should set authenticationDomainId to result of getInput("authentication-domain-id") when authenticationDomainId is defined', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'authentication-domain-id') {
        return 'fake-authentication-domain-id'
      }
      return ''
    })

    const result = getInputs()
    expect(result.authenticationDomainId).toBe('fake-authentication-domain-id')
  })
  it('should not set authenticationDomainId when getInput("authentication-domain-id") is empty', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation(() => {
      return ''
    })

    const result = getInputs()
    expect(result.authenticationDomainId).toBeUndefined()
  })
  it('should set region to toRegion(getInput("region"))', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'region') {
        return 'EU'
      }
      return ''
    })

    const result = getInputs()
    expect(result.region).toBe('EU')
  })
  it('should set filesAdded to [] if getInput("files-added") is empty', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'files-added') {
        return ''
      }
      return ''
    })

    const result = getInputs()
    expect(result.filesAdded).toEqual([])
  })
  it('should set filesAdded to split of getInput("files-added")', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'files-added') {
        return 'file1,file2 , file3'
      }
      return ''
    })

    const result = getInputs()
    expect(result.filesAdded).toEqual(['file1', 'file2', 'file3'])
  })
  it('should set filesModified to [] if getInput("files-modified") is empty', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'files-modified') {
        return ''
      }
      return ''
    })

    const result = getInputs()
    expect(result.filesModified).toEqual([])
  })
  it('should set filesModified to split of getInput("files-modified")', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'files-modified') {
        return 'file4, file5 ,file6'
      }
      return ''
    })

    const result = getInputs()
    expect(result.filesModified).toEqual(['file4', 'file5', 'file6'])
  })
  it('should set filesDeleted to [] if getInput("files-deleted") is empty', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'files-deleted') {
        return ''
      }
      return ''
    })

    const result = getInputs()
    expect(result.filesDeleted).toEqual([])
  })
  it('should set filesDeleted to split of getInput("files-deleted")', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      if (name === 'files-deleted') {
        return 'file7 ,file8,file9'
      }
      return ''
    })

    const result = getInputs()
    expect(result.filesDeleted).toEqual(['file7', 'file8', 'file9'])
  })
  it('should set all inputs correctly together', () => {
    ;(
      mockedCore.getInput as jest.MockedFunction<typeof mockedCore.getInput>
    ).mockImplementation((name: string) => {
      switch (name) {
        case 'org-id':
          return 'fake-org-id'
        case 'api-key':
          return 'fake-api-key'
        case 'region':
          return 'US'
        case 'files-added':
          return 'a1,a2'
        case 'files-modified':
          return 'm1 , m2 '
        case 'files-deleted':
          return 'd1,d2 '
        default:
          return ''
      }
    })

    const result = getInputs()
    expect(result).toEqual({
      orgId: 'fake-org-id',
      apiKey: 'fake-api-key',
      region: 'US',
      filesAdded: ['a1', 'a2'],
      filesModified: ['m1', 'm2'],
      filesDeleted: ['d1', 'd2']
    })
  })
})
