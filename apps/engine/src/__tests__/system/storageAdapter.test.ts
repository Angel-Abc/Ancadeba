import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StorageAdapter } from '../../system/storageAdapter'

describe('system/storageAdapter', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    })
  })

  it('gets item from localStorage', () => {
    // Arrange
    const adapter = new StorageAdapter()
    vi.mocked(window.localStorage.getItem).mockReturnValue('test-value')

    // Act
    const result = adapter.getItem('test-key')

    // Assert
    expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key')
    expect(result).toBe('test-value')
  })

  it('returns null when item does not exist', () => {
    // Arrange
    const adapter = new StorageAdapter()
    vi.mocked(window.localStorage.getItem).mockReturnValue(null)

    // Act
    const result = adapter.getItem('nonexistent-key')

    // Assert
    expect(window.localStorage.getItem).toHaveBeenCalledWith('nonexistent-key')
    expect(result).toBeNull()
  })

  it('sets item in localStorage', () => {
    // Arrange
    const adapter = new StorageAdapter()

    // Act
    adapter.setItem('test-key', 'test-value')

    // Assert
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      'test-value'
    )
  })

  it('removes item from localStorage', () => {
    // Arrange
    const adapter = new StorageAdapter()

    // Act
    adapter.removeItem('test-key')

    // Assert
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('handles multiple set operations', () => {
    // Arrange
    const adapter = new StorageAdapter()

    // Act
    adapter.setItem('key1', 'value1')
    adapter.setItem('key2', 'value2')
    adapter.setItem('key3', 'value3')

    // Assert
    expect(window.localStorage.setItem).toHaveBeenCalledTimes(3)
    expect(window.localStorage.setItem).toHaveBeenNthCalledWith(
      1,
      'key1',
      'value1'
    )
    expect(window.localStorage.setItem).toHaveBeenNthCalledWith(
      2,
      'key2',
      'value2'
    )
    expect(window.localStorage.setItem).toHaveBeenNthCalledWith(
      3,
      'key3',
      'value3'
    )
  })

  it('handles multiple get operations', () => {
    // Arrange
    const adapter = new StorageAdapter()
    vi.mocked(window.localStorage.getItem).mockImplementation((key) => {
      if (key === 'key1') return 'value1'
      if (key === 'key2') return 'value2'
      return null
    })

    // Act
    const result1 = adapter.getItem('key1')
    const result2 = adapter.getItem('key2')
    const result3 = adapter.getItem('key3')

    // Assert
    expect(result1).toBe('value1')
    expect(result2).toBe('value2')
    expect(result3).toBeNull()
  })

  it('handles multiple remove operations', () => {
    // Arrange
    const adapter = new StorageAdapter()

    // Act
    adapter.removeItem('key1')
    adapter.removeItem('key2')

    // Assert
    expect(window.localStorage.removeItem).toHaveBeenCalledTimes(2)
    expect(window.localStorage.removeItem).toHaveBeenNthCalledWith(1, 'key1')
    expect(window.localStorage.removeItem).toHaveBeenNthCalledWith(2, 'key2')
  })
})
