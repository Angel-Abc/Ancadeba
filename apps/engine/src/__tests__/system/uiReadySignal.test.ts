import { describe, expect, it, vi } from 'vitest'
import { UIReadySignal } from '../../system/uiReadySignal'

describe('system/uiReadySignal', () => {
  it('ready promise does not resolve immediately', async () => {
    // Arrange
    const signal = new UIReadySignal()
    let resolved = false
    signal.ready.then(() => {
      resolved = true
    })

    // Act
    await Promise.resolve()

    // Assert
    expect(resolved).toBe(false)
  })

  it('signalReady resolves the ready promise', async () => {
    // Arrange
    const signal = new UIReadySignal()
    let resolved = false
    signal.ready.then(() => {
      resolved = true
    })

    // Act
    signal.signalReady()
    await signal.ready

    // Assert
    expect(resolved).toBe(true)
  })

  it('ready promise can be awaited after signalReady is called', async () => {
    // Arrange
    const signal = new UIReadySignal()

    // Act
    signal.signalReady()
    await signal.ready

    // Assert - if we reach here without timeout, the promise resolved
    expect(true).toBe(true)
  })

  it('multiple awaits on same ready promise all resolve', async () => {
    // Arrange
    const signal = new UIReadySignal()
    let count = 0
    const promise1 = signal.ready.then(() => count++)
    const promise2 = signal.ready.then(() => count++)
    const promise3 = signal.ready.then(() => count++)

    // Act
    signal.signalReady()
    await Promise.all([promise1, promise2, promise3])

    // Assert
    expect(count).toBe(3)
  })

  it('signalReady can be called multiple times without error', () => {
    // Arrange
    const signal = new UIReadySignal()

    // Act & Assert
    expect(() => {
      signal.signalReady()
      signal.signalReady()
      signal.signalReady()
    }).not.toThrow()
  })

  it('resolves all waiting promises when signalReady is called', async () => {
    // Arrange
    const signal = new UIReadySignal()
    const results: number[] = []
    const promise1 = signal.ready.then(() => results.push(1))
    const promise2 = signal.ready.then(() => results.push(2))
    const promise3 = signal.ready.then(() => results.push(3))

    // Act
    signal.signalReady()
    await Promise.all([promise1, promise2, promise3])

    // Assert
    expect(results).toEqual([1, 2, 3])
  })

  it('ready promise remains resolved after initial signal', async () => {
    // Arrange
    const signal = new UIReadySignal()

    // Act
    signal.signalReady()
    await signal.ready
    await signal.ready

    // Assert - if we reach here, the promise is still resolved
    expect(true).toBe(true)
  })

  it('executes callbacks attached after signalReady immediately', async () => {
    // Arrange
    const signal = new UIReadySignal()
    let executed = false

    // Act
    signal.signalReady()
    await signal.ready.then(() => {
      executed = true
    })

    // Assert
    expect(executed).toBe(true)
  })

  it('works with async/await pattern', async () => {
    // Arrange
    const signal = new UIReadySignal()
    const callback = vi.fn()

    // Act
    const waitForReady = async () => {
      await signal.ready
      callback()
    }

    const promise = waitForReady()
    signal.signalReady()
    await promise

    // Assert
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
