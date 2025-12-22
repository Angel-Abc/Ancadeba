import { describe, expect, it, vi } from 'vitest'
import { CORE_MESSAGES } from '../../messages/core'
import { GameEngine } from '../../core/gameEngine'
import { UIReadySignal } from '../../system/uiReadySignal'
import type { IEngineMessageBus } from '../../system/engineMessageBus'

describe('core/gameEngine', () => {
  it('publishes after the UI is ready', async () => {
    // Arrange
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
      subscribeRaw: vi.fn(() => () => undefined),
    }
    const uiReadySignal = new UIReadySignal()
    const engine = new GameEngine(messageBus, uiReadySignal)

    // Act
    const startPromise = engine.start()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    uiReadySignal.signalReady()
    await startPromise

    // Assert
    expect(messageBus.publish).toHaveBeenCalledTimes(1)
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.GAME_ENGINE_STARTED,
      undefined
    )
  })
})
