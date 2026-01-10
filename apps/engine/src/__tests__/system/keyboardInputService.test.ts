import { describe, expect, it, vi } from 'vitest'
import type { IKeyboardListener } from '@ancadeba/utils'
import type { IResourceDataStorage } from '../../resourceData/storage'
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
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualKeys: vi.fn().mockReturnValue([]),
    } as unknown as IResourceDataStorage
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      resourceDataStorage,
      messageBus
    )

    // Act
    service.start()

    // Assert
    expect(mockListen).toHaveBeenCalledTimes(1)
  })

  it('keyboard event matching virtual key publishes correct message', () => {
    // Arrange
    let callback:
      | ((event: {
          code: string
          shift: boolean
          ctrl: boolean
          alt: boolean
        }) => void)
      | null = null
    const mockListen = vi.fn((cb) => {
      callback = cb
      return () => {}
    })
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
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
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      resourceDataStorage,
      messageBus
    )

    // Act
    service.start()
    callback?.({ code: 'Space', shift: false, ctrl: false, alt: false })

    // Assert
    expect(mockPublish).toHaveBeenCalledWith(UI_MESSAGES.VIRTUAL_KEY_PRESSED, {
      virtualKey: 'VK_ACTION',
    })
  })

  it('keyboard event with shift modifier matches correctly', () => {
    // Arrange
    let callback:
      | ((event: {
          code: string
          shift: boolean
          ctrl: boolean
          alt: boolean
        }) => void)
      | null = null
    const mockListen = vi.fn((cb) => {
      callback = cb
      return () => {}
    })
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
    const virtualKeys = [
      {
        code: 'KeyQ',
        shift: false,
        ctrl: false,
        alt: false,
        virtualKey: 'VK_Q',
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
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      resourceDataStorage,
      messageBus
    )

    // Act
    service.start()
    callback?.({ code: 'KeyQ', shift: true, ctrl: false, alt: false })

    // Assert
    expect(mockPublish).toHaveBeenCalledWith(UI_MESSAGES.VIRTUAL_KEY_PRESSED, {
      virtualKey: 'VK_SHIFT_Q',
    })
  })

  it('non-matching keyboard event does not publish message', () => {
    // Arrange
    let callback:
      | ((event: {
          code: string
          shift: boolean
          ctrl: boolean
          alt: boolean
        }) => void)
      | null = null
    const mockListen = vi.fn((cb) => {
      callback = cb
      return () => {}
    })
    const keyboardListener: IKeyboardListener = {
      listen: mockListen,
      start: vi.fn(),
    }
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
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      resourceDataStorage,
      messageBus
    )

    // Act
    service.start()
    callback?.({ code: 'Enter', shift: false, ctrl: false, alt: false })

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
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualKeys: vi.fn().mockReturnValue([]),
    } as unknown as IResourceDataStorage
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const service = new KeyboardInputService(
      keyboardListener,
      resourceDataStorage,
      messageBus
    )

    // Act
    service.start()
    service.stop()

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
