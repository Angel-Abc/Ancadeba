import { describe, expect, it, vi } from 'vitest'
import type { IResourceDataStorage } from '../../resourceData/storage'
import { VirtualKeyMapper } from '../../system/virtualKeyMapper'

describe('system/virtualKeyMapper', () => {
  it('findMapping returns matching virtual key mapping', () => {
    // Arrange
    const virtualKeys = [
      {
        code: 'Space',
        shift: false,
        ctrl: false,
        alt: false,
        virtualKey: 'VK_ACTION',
      },
      {
        code: 'KeyQ',
        shift: true,
        ctrl: false,
        alt: false,
        virtualKey: 'VK_SHIFT_Q',
      },
    ]
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualKeys: vi.fn().mockReturnValue(virtualKeys),
    } as unknown as IResourceDataStorage
    const mapper = new VirtualKeyMapper(resourceDataStorage)
    const event = { code: 'Space', shift: false, ctrl: false, alt: false }

    // Act
    const result = mapper.findMapping(event)

    // Assert
    expect(result).toEqual({
      code: 'Space',
      shift: false,
      ctrl: false,
      alt: false,
      virtualKey: 'VK_ACTION',
    })
  })

  it('findMapping returns undefined for non-matching event', () => {
    // Arrange
    const virtualKeys = [
      {
        code: 'Space',
        shift: false,
        ctrl: false,
        alt: false,
        virtualKey: 'VK_ACTION',
      },
    ]
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualKeys: vi.fn().mockReturnValue(virtualKeys),
    } as unknown as IResourceDataStorage
    const mapper = new VirtualKeyMapper(resourceDataStorage)
    const event = { code: 'Enter', shift: false, ctrl: false, alt: false }

    // Act
    const result = mapper.findMapping(event)

    // Assert
    expect(result).toBeUndefined()
  })

  it('findMapping matches all modifiers correctly', () => {
    // Arrange
    const virtualKeys = [
      {
        code: 'KeyS',
        shift: true,
        ctrl: true,
        alt: false,
        virtualKey: 'VK_CTRL_SHIFT_S',
      },
    ]
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualKeys: vi.fn().mockReturnValue(virtualKeys),
    } as unknown as IResourceDataStorage
    const mapper = new VirtualKeyMapper(resourceDataStorage)
    const event = { code: 'KeyS', shift: true, ctrl: true, alt: false }

    // Act
    const result = mapper.findMapping(event)

    // Assert
    expect(result).toEqual({
      code: 'KeyS',
      shift: true,
      ctrl: true,
      alt: false,
      virtualKey: 'VK_CTRL_SHIFT_S',
    })
  })

  it('findMapping does not match when modifier differs', () => {
    // Arrange
    const virtualKeys = [
      {
        code: 'KeyS',
        shift: true,
        ctrl: false,
        alt: false,
        virtualKey: 'VK_SHIFT_S',
      },
    ]
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualKeys: vi.fn().mockReturnValue(virtualKeys),
    } as unknown as IResourceDataStorage
    const mapper = new VirtualKeyMapper(resourceDataStorage)
    const event = { code: 'KeyS', shift: false, ctrl: false, alt: false }

    // Act
    const result = mapper.findMapping(event)

    // Assert
    expect(result).toBeUndefined()
  })
})
