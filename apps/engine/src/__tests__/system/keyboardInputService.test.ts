import { describe, expect, it, vi } from 'vitest'
import type { IKeyboardListener, KeyboardEvent } from '@ancadeba/utils'
import type { IVirtualKeyMapper } from '../../system/virtualKeyMapper'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { KeyboardInputService } from '../../system/keyboardInputService'
import { UI_MESSAGES } from '../../messages/ui'

describe('system/keyboardInputService', () => {
  it('start calls keyboardListener.listen()', () => {
    // Arrange
    const mockListen = vi.fn().mockReturnValue(() => {})
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
    const virtualKeyMapper: IVirtualKeyMapper = {
      findMapping: vi.fn().mockReturnValue(undefined),
    }
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      virtualKeyMapper,
      messageBus
    )

    // Act
    service.start()

    // Assert
    expect(mockListen).toHaveBeenCalledTimes(1)
  })

  it('keyboard event matching virtual key publishes correct message', () => {
    // Arrange
    let callback: ((event: KeyboardEvent) => void) | null = null
    const mockListen = vi.fn((cb: (event: KeyboardEvent) => void) => {
      callback = cb
      return () => {}
    })
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
    const mockFindMapping = vi.fn().mockReturnValue({
      code: 'Space',
      shift: false,
      ctrl: false,
      alt: false,
      virtualKey: 'VK_ACTION',
    })
    const virtualKeyMapper: IVirtualKeyMapper = {
      findMapping: mockFindMapping,
    }
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      virtualKeyMapper,
      messageBus
    )

    // Act
    service.start()
    if (!callback) {
      throw new Error('Expected keyboard listener to be registered')
    }
    const listenCallback = callback as (event: KeyboardEvent) => void
    listenCallback({ code: 'Space', shift: false, ctrl: false, alt: false })

    // Assert
    expect(mockPublish).toHaveBeenCalledWith(UI_MESSAGES.VIRTUAL_KEY_PRESSED, {
      virtualKey: 'VK_ACTION',
    })
  })

  it('keyboard event with shift modifier matches correctly', () => {
    // Arrange
    let callback: ((event: KeyboardEvent) => void) | null = null
    const mockListen = vi.fn((cb: (event: KeyboardEvent) => void) => {
      callback = cb
      return () => {}
    })
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
    const mockFindMapping = vi.fn().mockReturnValue({
      code: 'KeyQ',
      shift: true,
      ctrl: false,
      alt: false,
      virtualKey: 'VK_SHIFT_Q',
    })
    const virtualKeyMapper: IVirtualKeyMapper = {
      findMapping: mockFindMapping,
    }
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      virtualKeyMapper,
      messageBus
    )

    // Act
    service.start()
    if (!callback) {
      throw new Error('Expected keyboard listener to be registered')
    }
    const listenCallback = callback as (event: KeyboardEvent) => void
    listenCallback({ code: 'KeyQ', shift: true, ctrl: false, alt: false })

    // Assert
    expect(mockPublish).toHaveBeenCalledWith(UI_MESSAGES.VIRTUAL_KEY_PRESSED, {
      virtualKey: 'VK_SHIFT_Q',
    })
  })

  it('non-matching keyboard event does not publish message', () => {
    // Arrange
    let callback: ((event: KeyboardEvent) => void) | null = null
    const mockListen = vi.fn((cb: (event: KeyboardEvent) => void) => {
      callback = cb
      return () => {}
    })
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
    const mockFindMapping = vi.fn().mockReturnValue(undefined)
    const virtualKeyMapper: IVirtualKeyMapper = {
      findMapping: mockFindMapping,
    }
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      virtualKeyMapper,
      messageBus
    )

    // Act
    service.start()
    if (!callback) {
      throw new Error('Expected keyboard listener to be registered')
    }
    const listenCallback = callback as (event: KeyboardEvent) => void
    listenCallback({ code: 'Enter', shift: false, ctrl: false, alt: false })

    // Assert
    expect(mockPublish).not.toHaveBeenCalled()
  })

  it('stop calls unsubscribe function', () => {
    // Arrange
    const mockUnsubscribe = vi.fn()
    const mockListen = vi.fn().mockReturnValue(mockUnsubscribe)
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
    const virtualKeyMapper: IVirtualKeyMapper = {
      findMapping: vi.fn().mockReturnValue(undefined),
    }
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      virtualKeyMapper,
      messageBus
    )

    // Act
    service.start()
    service.stop()

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
