import { describe, expect, it, vi } from 'vitest'
import type { IMessageBus } from '@ancadeba/utils'
import type { Game } from '@ancadeba/content'
import type { IUIReadySignal } from '../src/signals/UIReadySignal'
import type { IGameDefinitionProvider } from '../src/providers/definition/types'
import type {
  IBootstrapBootSurface,
  IBootstrapGameDefinition,
} from '../src/bootstrap/types'
import { BootstrapEngine } from '../src/bootstrap/bootstrapEngine'
import { MESSAGE_ENGINE_BOOT_SURFACE_PRELOADED } from '../src/bootstrap/messages'

function createReadySignal(): IUIReadySignal {
  return {
    ready: Promise.resolve(),
    signalReady: vi.fn(),
  }
}

function createMessageBus(): IMessageBus {
  return {
    publish: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  }
}

describe('bootstrap engine', () => {
  it('waits for game definition bootstrap before publishing boot completion', async () => {
    // Arrange
    const gameDefinition: Game = {
      title: 'GAME.TITLE',
      version: '1.0.0',
      bootSurfaceId: 'boot-loader',
      language: 'en',
      styles: ['styles/theme.css'],
      surfaces: { 'boot-loader': 'surfaces/boot-loader.json' },
      widgets: { 'boot-progress': 'widgets/boot-progress.json' },
      languages: { en: ['languages/en/engine.json'] },
    }
    const gameDefinitionProvider: IGameDefinitionProvider = {
      getGameDefinition: vi.fn(async () => gameDefinition),
    }
    let resolveBootstrapGameDefinition!: () => void
    const bootstrapGameDefinition: IBootstrapGameDefinition = {
      execute: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveBootstrapGameDefinition = resolve
          }),
      ),
    }
    const bootstrapBootSurface: IBootstrapBootSurface = {
      execute: vi.fn(async () => undefined),
    }
    const messageBus = createMessageBus()
    const bootstrapEngine = new BootstrapEngine(
      createReadySignal(),
      gameDefinitionProvider,
      bootstrapGameDefinition,
      bootstrapBootSurface,
      messageBus,
    )

    // Act
    const executePromise = bootstrapEngine.execute()
    await Promise.resolve()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveBootstrapGameDefinition()
    await executePromise

    // Assert
    expect(bootstrapGameDefinition.execute).toHaveBeenCalledWith(gameDefinition)
    expect(bootstrapBootSurface.execute).toHaveBeenCalledWith('boot-loader')
    expect(messageBus.publish).toHaveBeenCalledWith(
      MESSAGE_ENGINE_BOOT_SURFACE_PRELOADED,
    )
  })
})
