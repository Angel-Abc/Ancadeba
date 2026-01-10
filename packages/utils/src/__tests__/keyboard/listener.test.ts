import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { KeyboardListener } from '../../keyboard/listener'
import type { ILogger } from '../../logger/types'
import type { KeyboardEvent } from '../../keyboard/listener'

const createLogger = (): ILogger => ({
  debug: vi.fn(() => ''),
  info: vi.fn(() => ''),
  warn: vi.fn(() => ''),
  error: vi.fn(() => ''),
  fatal: vi.fn(() => {
    throw new Error('fatal')
  }),
})

describe('keyboard/listener', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockAddEventListener = vi.fn()
    mockRemoveEventListener = vi.fn()
    vi.stubGlobal('window', {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registers a listener and returns unsubscribe function', () => {
    // Arrange
    const logger = createLogger()
    const listener = new KeyboardListener(logger)
    const callback = vi.fn()

    // Act
    const unsubscribe = listener.listen(callback)

    // Assert
    expect(unsubscribe).toBeTypeOf('function')
  })

  it('distributes events to all registered listeners', () => {
    // Arrange
    const logger = createLogger()
    const listener = new KeyboardListener(logger)
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const callback3 = vi.fn()

    listener.listen(callback1)
    listener.listen(callback2)
    listener.listen(callback3)
    listener.start()

    const keydownHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'keydown'
    )?.[1] as (event: globalThis.KeyboardEvent) => void

    const nativeEvent = {
      code: 'KeyA',
      altKey: false,
      shiftKey: true,
      ctrlKey: false,
    } as globalThis.KeyboardEvent

    // Act
    keydownHandler(nativeEvent)

    // Assert
    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).toHaveBeenCalledTimes(1)
    expect(callback3).toHaveBeenCalledTimes(1)
  })

  it('removes listener when unsubscribe is called', () => {
    // Arrange
    const logger = createLogger()
    const listener = new KeyboardListener(logger)
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    listener.listen(callback1)
    const unsubscribe2 = listener.listen(callback2)
    listener.start()

    const keydownHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'keydown'
    )?.[1] as (event: globalThis.KeyboardEvent) => void

    const nativeEvent = {
      code: 'KeyB',
      altKey: false,
      shiftKey: false,
      ctrlKey: false,
    } as globalThis.KeyboardEvent

    // Act
    unsubscribe2()
    keydownHandler(nativeEvent)

    // Assert
    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).not.toHaveBeenCalled()
  })

  it('transforms native event to KeyboardEvent with correct structure', () => {
    // Arrange
    const logger = createLogger()
    const listener = new KeyboardListener(logger)
    let capturedEvent: KeyboardEvent | undefined

    listener.listen((event) => {
      capturedEvent = event
    })
    listener.start()

    const keydownHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'keydown'
    )?.[1] as (event: globalThis.KeyboardEvent) => void

    const nativeEvent = {
      code: 'Enter',
      altKey: true,
      shiftKey: false,
      ctrlKey: true,
    } as globalThis.KeyboardEvent

    // Act
    keydownHandler(nativeEvent)

    // Assert
    expect(capturedEvent).toEqual({
      code: 'Enter',
      alt: true,
      shift: false,
      ctrl: true,
    })
  })

  it('starts listening to keyboard events', () => {
    // Arrange
    const logger = createLogger()
    const listener = new KeyboardListener(logger)

    // Act
    listener.start()

    // Assert
    expect(mockAddEventListener).toHaveBeenCalledTimes(1)
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
  })

  it('does not start multiple times', () => {
    // Arrange
    const logger = createLogger()
    const listener = new KeyboardListener(logger)

    // Act
    listener.start()
    listener.start()

    // Assert
    expect(mockAddEventListener).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'utils/keyboard/KeyboardListener',
      'Keyboard listener already started'
    )
  })

  it('handles all modifier key combinations', () => {
    // Arrange
    const logger = createLogger()
    const listener = new KeyboardListener(logger)
    const capturedEvents: KeyboardEvent[] = []

    listener.listen((event) => {
      capturedEvents.push(event)
    })
    listener.start()

    const keydownHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'keydown'
    )?.[1] as (event: globalThis.KeyboardEvent) => void

    // Act
    keydownHandler({
      code: 'KeyA',
      altKey: false,
      shiftKey: false,
      ctrlKey: false,
    } as globalThis.KeyboardEvent)

    keydownHandler({
      code: 'KeyB',
      altKey: true,
      shiftKey: true,
      ctrlKey: true,
    } as globalThis.KeyboardEvent)

    // Assert
    expect(capturedEvents).toHaveLength(2)
    expect(capturedEvents[0]).toEqual({
      code: 'KeyA',
      alt: false,
      shift: false,
      ctrl: false,
    })
    expect(capturedEvents[1]).toEqual({
      code: 'KeyB',
      alt: true,
      shift: true,
      ctrl: true,
    })
  })
})
