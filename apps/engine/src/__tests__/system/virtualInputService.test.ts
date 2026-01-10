import { describe, expect, it, vi } from 'vitest'
import type { IResourceDataStorage } from '../../resourceData/storage'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { VirtualInputService } from '../../system/virtualInputService'
import { UI_MESSAGES } from '../../messages/ui'

describe('system/virtualInputService', () => {
  it('start calls messageBus.subscribe() for VIRTUAL_KEY_PRESSED', () => {
    // Arrange
    const mockSubscribe = vi.fn().mockReturnValue(() => {})
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualInputs: vi.fn().mockReturnValue([]),
    } as unknown as IResourceDataStorage
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(resourceDataStorage, messageBus)

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
    let callback: ((payload: { virtualKey: string }) => void) | null = null
    const mockSubscribe = vi.fn((message, cb) => {
      callback = cb
      return () => {}
    })
    const virtualInputs = [
      {
        virtualKeys: ['VK_ACTION'],
        virtualInput: 'VI_ACTION',
        label: 'Space',
      },
    ]
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualInputs: vi.fn().mockReturnValue(virtualInputs),
    } as unknown as IResourceDataStorage
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(resourceDataStorage, messageBus)

    // Act
    service.start()
    callback?.({ virtualKey: 'VK_ACTION' })

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
    let callback: ((payload: { virtualKey: string }) => void) | null = null
    const mockSubscribe = vi.fn((message, cb) => {
      callback = cb
      return () => {}
    })
    const virtualInputs = [
      {
        virtualKeys: ['VK_W', 'VK_SHIFT_Q'],
        virtualInput: 'VI_UP',
        label: 'W',
      },
    ]
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualInputs: vi.fn().mockReturnValue(virtualInputs),
    } as unknown as IResourceDataStorage
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(resourceDataStorage, messageBus)

    // Act
    service.start()
    callback?.({ virtualKey: 'VK_SHIFT_Q' })

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
    let callback: ((payload: { virtualKey: string }) => void) | null = null
    const mockSubscribe = vi.fn((message, cb) => {
      callback = cb
      return () => {}
    })
    const virtualInputs = [
      {
        virtualKeys: ['VK_ACTION'],
        virtualInput: 'VI_ACTION',
        label: 'Space',
      },
    ]
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualInputs: vi.fn().mockReturnValue(virtualInputs),
    } as unknown as IResourceDataStorage
    const mockPublish = vi.fn()
    const messageBus: IEngineMessageBus = {
      publish: mockPublish,
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(resourceDataStorage, messageBus)

    // Act
    service.start()
    callback?.({ virtualKey: 'VK_UNKNOWN' })

    // Assert
    expect(mockPublish).not.toHaveBeenCalled()
  })

  it('stop calls unsubscribe function', () => {
    // Arrange
    const mockUnsubscribe = vi.fn()
    const mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe)
    const resourceDataStorage: IResourceDataStorage = {
      getVirtualInputs: vi.fn().mockReturnValue([]),
    } as unknown as IResourceDataStorage
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const service = new VirtualInputService(resourceDataStorage, messageBus)

    // Act
    service.start()
    service.stop()

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
