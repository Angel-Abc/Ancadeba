import { describe, expect, it, vi } from 'vitest'
import type { IVirtualInputStorage } from '../../resourceData/storage'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { VirtualInputService } from '../../system/virtualInputService'
import { UI_MESSAGES, type UIMessagePayloads } from '../../messages/ui'

describe('system/virtualInputService', () => {
  type VirtualKeyPressedPayload =
    UIMessagePayloads[typeof UI_MESSAGES.VIRTUAL_KEY_PRESSED]

  it('start calls messageBus.subscribe() for VIRTUAL_KEY_PRESSED', () => {
    // Arrange
    const mockSubscribe = vi.fn().mockReturnValue(() => {})
    const virtualInputStorage: IVirtualInputStorage = {
      getVirtualInputs: vi.fn().mockReturnValue([]),
      setVirtualInputs: vi.fn(),
    }
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(virtualInputStorage, messageBus)

    // Act
    service.start()

    // Assert
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockSubscribe).toHaveBeenCalledWith(
      UI_MESSAGES.VIRTUAL_KEY_PRESSED,
      expect.any(Function)
    )
  })

  it('virtual key matching single input publishes correct message with label', () => {
    // Arrange
    let callback: ((payload: VirtualKeyPressedPayload) => void) | null = null
    const mockSubscribe = vi.fn(
      (
        message: typeof UI_MESSAGES.VIRTUAL_KEY_PRESSED,
        cb: (payload: VirtualKeyPressedPayload) => void
      ) => {
      callback = cb
      return () => {}
      }
    )
    const virtualInputs = [
      {
        virtualKeys: ['VK_ACTION'],
        virtualInput: 'VI_ACTION',
        label: 'Space',
      },
    ]
    const virtualInputStorage: IVirtualInputStorage = {
      getVirtualInputs: vi.fn().mockReturnValue(virtualInputs),
      setVirtualInputs: vi.fn(),
    }
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: mockSubscribe as IEngineMessageBus['subscribe'],
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(virtualInputStorage, messageBus)

    // Act
    service.start()
    if (!callback) {
      throw new Error('Expected message bus subscription callback')
    }
    const messageCallback = callback as (
      payload: VirtualKeyPressedPayload
    ) => void
    messageCallback({ virtualKey: 'VK_ACTION' })

    // Assert
    expect(mockPublish).toHaveBeenCalledWith(
      UI_MESSAGES.VIRTUAL_INPUT_PRESSED,
      {
        virtualInput: 'VI_ACTION',
        label: 'Space',
      }
    )
  })

  it('virtual key matching multiple inputs in array publishes correctly', () => {
    // Arrange
    let callback: ((payload: VirtualKeyPressedPayload) => void) | null = null
    const mockSubscribe = vi.fn(
      (
        message: typeof UI_MESSAGES.VIRTUAL_KEY_PRESSED,
        cb: (payload: VirtualKeyPressedPayload) => void
      ) => {
      callback = cb
      return () => {}
      }
    )
    const virtualInputs = [
      {
        virtualKeys: ['VK_W', 'VK_SHIFT_Q'],
        virtualInput: 'VI_UP',
        label: 'W',
      },
    ]
    const virtualInputStorage: IVirtualInputStorage = {
      getVirtualInputs: vi.fn().mockReturnValue(virtualInputs),
      setVirtualInputs: vi.fn(),
    }
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: mockSubscribe as IEngineMessageBus['subscribe'],
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(virtualInputStorage, messageBus)

    // Act
    service.start()
    if (!callback) {
      throw new Error('Expected message bus subscription callback')
    }
    const messageCallback = callback as (
      payload: VirtualKeyPressedPayload
    ) => void
    messageCallback({ virtualKey: 'VK_SHIFT_Q' })

    // Assert
    expect(mockPublish).toHaveBeenCalledWith(
      UI_MESSAGES.VIRTUAL_INPUT_PRESSED,
      {
        virtualInput: 'VI_UP',
        label: 'W',
      }
    )
  })

  it('non-matching virtual key does not publish message', () => {
    // Arrange
    let callback: ((payload: VirtualKeyPressedPayload) => void) | null = null
    const mockSubscribe = vi.fn(
      (
        message: typeof UI_MESSAGES.VIRTUAL_KEY_PRESSED,
        cb: (payload: VirtualKeyPressedPayload) => void
      ) => {
      callback = cb
      return () => {}
      }
    )
    const virtualInputs = [
      {
        virtualKeys: ['VK_ACTION'],
        virtualInput: 'VI_ACTION',
        label: 'Space',
      },
    ]
    const virtualInputStorage: IVirtualInputStorage = {
      getVirtualInputs: vi.fn().mockReturnValue(virtualInputs),
      setVirtualInputs: vi.fn(),
    }
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: mockSubscribe as IEngineMessageBus['subscribe'],
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(virtualInputStorage, messageBus)

    // Act
    service.start()
    if (!callback) {
      throw new Error('Expected message bus subscription callback')
    }
    const messageCallback = callback as (
      payload: VirtualKeyPressedPayload
    ) => void
    messageCallback({ virtualKey: 'VK_UNKNOWN' })

    // Assert
    expect(mockPublish).not.toHaveBeenCalled()
  })

  it('stop calls unsubscribe function', () => {
    // Arrange
    const mockUnsubscribe = vi.fn()
    const mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe)
    const virtualInputStorage: IVirtualInputStorage = {
      getVirtualInputs: vi.fn().mockReturnValue([]),
      setVirtualInputs: vi.fn(),
    }
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(virtualInputStorage, messageBus)

    // Act
    service.start()
    service.stop()

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
