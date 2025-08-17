import { describe, it, expect, vi } from 'vitest'
import { ContainerBuilder } from '@builders/containerBuilder'
import { gameEngineToken } from '@core/gameEngine'
import { messageBusToken } from '@utils/messageBus'
import { messageQueueToken } from '@utils/messageQueue'
import { GameEngine } from '@core/gameEngine'
import { MessageBus } from '@utils/messageBus'
import { MessageQueue } from '@utils/messageQueue'
import { TurnScheduler, turnSchedulerToken } from '@core/turnScheduler'
import { ServiceProvider, serviceProviderToken } from '@providers/serviceProvider'
import { dataPathProviderToken } from '@providers/configProviders'
import { GameDataProvider, gameDataProviderToken } from '@providers/gameDataProvider'
import { VirtualKeyProvider, virtualKeyProviderToken } from '@providers/virtualKeyProvider'
import { VirtualInputProvider, virtualInputProviderToken } from '@providers/virtualInputProvider'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'
import { ProvidersBuilder } from '@builders/containerBuilders/providersBuilder'
import { MapManager, mapManagerToken } from '@managers/mapManager'
import { TileSetManager, tileSetManagerToken } from '@managers/tileSetManager'
import { PlayerPositionManager, playerPositionManagerToken } from '@managers/playerPositionManager'
import { InputManager, inputManagerToken } from '@managers/inputManager'
import { PageInputs, pageInputsToken } from '@inputs/pageInputs'
import type { ILogger } from '@utils/logger'

describe('ContainerBuilder', () => {
  it('registers default dependencies', () => {
    const builder = new ContainerBuilder(() => () => {}, '/data')
    const container = builder.build()
    const engine = container.resolve(gameEngineToken)
    const bus = container.resolve(messageBusToken)
    const queue = container.resolve(messageQueueToken)
    const scheduler = container.resolve(turnSchedulerToken)
    const mapManager = container.resolve(mapManagerToken)
    const tileSetManager = container.resolve(tileSetManagerToken)
    const playerPositionManager = container.resolve(playerPositionManagerToken)
    const inputManager = container.resolve(inputManagerToken)
    expect(engine).toBeInstanceOf(GameEngine)
    expect(bus).toBeInstanceOf(MessageBus)
    expect(queue).toBeInstanceOf(MessageQueue)
    expect(scheduler).toBeInstanceOf(TurnScheduler)
    expect(mapManager).toBeInstanceOf(MapManager)
    expect(tileSetManager).toBeInstanceOf(TileSetManager)
    expect(playerPositionManager).toBeInstanceOf(PlayerPositionManager)
    expect(inputManager).toBeInstanceOf(InputManager)

    const providers: { token: Token<unknown>, assert: (resolved: unknown) => void }[] = [
      { token: serviceProviderToken, assert: r => expect(r).toBeInstanceOf(ServiceProvider) },
      { token: dataPathProviderToken, assert: r => expect(r).toEqual({ dataPath: '/data' }) },
      { token: gameDataProviderToken, assert: r => expect(r).toBeInstanceOf(GameDataProvider) },
      { token: virtualKeyProviderToken, assert: r => expect(r).toBeInstanceOf(VirtualKeyProvider) },
      { token: virtualInputProviderToken, assert: r => expect(r).toBeInstanceOf(VirtualInputProvider) },
      { token: pageInputsToken, assert: r => expect(r).toBeInstanceOf(PageInputs) }
    ]

    providers.forEach(p => p.assert(container.resolve(p.token as Token<unknown>)))

    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn((category: string, message: string, ...args: unknown[]) =>
        `[${category}] ${message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))}`),
    }
    const providerContainer = new Container(logger)
    new ProvidersBuilder('/data').register(providerContainer)
    const registeredTokens = Array.from(
      (providerContainer as unknown as { providers: Map<Token<unknown>, unknown> }).providers.keys()
    )
    expect(registeredTokens).toHaveLength(providers.length)
    expect(new Set(registeredTokens)).toEqual(new Set(providers.map(p => p.token)))
  })

  it('uses supplied callback when queue empties', async () => {
    const callback = vi.fn()
    const builder = new ContainerBuilder(() => callback, '/data')
    const container = builder.build()
    const queue = container.resolve(messageQueueToken)
    queue.setHandler(() => {})
    queue.postMessage({ message: 'test', payload: null })
    await queue.emptyQueue()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('resolves gameEngine without circular dependency', () => {
    const builder = new ContainerBuilder(
      container => () => {
        const scheduler = container.resolve(turnSchedulerToken)
        scheduler.onQueueEmpty()
      },
      '/data',
    )
    const container = builder.build()
    const engine = container.resolve(gameEngineToken)
    expect(engine).toBeInstanceOf(GameEngine)
  })
})
