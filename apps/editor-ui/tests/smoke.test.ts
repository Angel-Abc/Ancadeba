import { describe, expect, it } from 'vitest'

describe('editor-ui smoke', () => {
  it('loads the editor ui entry module', async () => {
    // Arrange
    const loadModule = (): Promise<unknown> => import('../src/index')

    // Act
    const module = await loadModule()

    // Assert
    expect(module).toBeDefined()
  })
})
