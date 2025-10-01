import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { ILogger, IMessageBus, Message } from '@angelabc/utils/utils'
import type { GameData } from '../../src/loaders/data/gameData'
import type { IGameDataLoader } from '../../src/loaders/gameDataLoader'
import { GameDataProvider } from '../../src/providers/gameDataProvider'
import { GameEngine } from '../../src/core/gameEngine'
import { MESSAGE_ENGINE_LOADING, MESSAGE_ENGINE_START } from '../../src/core/messages'
import type { IEngineInitializer } from '../../src/core/initializers/engineInitializer'

const createLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => '')
})

const createMessageBus = (): { messageBus: IMessageBus, postMessage: Mock<[Message<unknown>], void> } => {
    const postMessage = vi.fn<(message: Message<unknown>) => void>() as Mock<[Message<unknown>], void>

    const messageBus: IMessageBus = {
        postMessage: postMessage as unknown as IMessageBus['postMessage'],
        registerMessageListener: vi.fn(),
        registerNotificationMessage: vi.fn(),
        unregisterNotificationMessage: vi.fn(),
        disableEmptyQueueAfterPost: vi.fn(),
        enableEmptyQueueAfterPost: vi.fn(),
        shutDown: vi.fn()
    }

    return { messageBus, postMessage }
}

const createGameDataProvider = (): { gameDataProvider: GameDataProvider, loadGameData: Mock<[], Promise<GameData>> } => {
    const loadGameData = vi.fn(async () => ({ name: 'test-game' })) as Mock<[], Promise<GameData>>
    const gameDataLoader: IGameDataLoader = {
        loadGameData: loadGameData as unknown as IGameDataLoader['loadGameData']
    }
    const gameDataProvider = new GameDataProvider(gameDataLoader)

    return { gameDataProvider, loadGameData }
}

describe('GameEngine', () => {
    it('awaits asynchronous engine initializer before broadcasting ENGINE-START', async () => {
        let resolveInitializer: () => void = () => {}
        const initializer: IEngineInitializer = {
            initialize: vi.fn(() => new Promise<void>(resolve => {
                resolveInitializer = resolve
            }))
        }

        const logger = createLogger()
        const { messageBus, postMessage } = createMessageBus()
        const { gameDataProvider, loadGameData } = createGameDataProvider()
        const engine = new GameEngine(logger, messageBus, initializer, gameDataProvider)

        const startPromise = engine.start()

        expect(initializer.initialize).toHaveBeenCalledTimes(1)
        expect(postMessage).not.toHaveBeenCalled()
        expect(loadGameData).not.toHaveBeenCalled()

        resolveInitializer()
        await startPromise

        expect(postMessage).toHaveBeenNthCalledWith(1, {
            message: MESSAGE_ENGINE_LOADING,
            payload: null
        })
        expect(loadGameData).toHaveBeenCalledTimes(1)
        expect(postMessage).toHaveBeenNthCalledWith(2, {
            message: MESSAGE_ENGINE_START,
            payload: null
        })
    })

    it('posts engine events when initializer resolves immediately', async () => {
        const initializer: IEngineInitializer = {
            initialize: vi.fn(async () => {})
        }

        const logger = createLogger()
        const { messageBus, postMessage } = createMessageBus()
        const { gameDataProvider, loadGameData } = createGameDataProvider()
        const engine = new GameEngine(logger, messageBus, initializer, gameDataProvider)

        await engine.start()

        expect(initializer.initialize).toHaveBeenCalledTimes(1)
        expect(loadGameData).toHaveBeenCalledTimes(1)
        expect(postMessage).toHaveBeenNthCalledWith(1, {
            message: MESSAGE_ENGINE_LOADING,
            payload: null
        })
        expect(postMessage).toHaveBeenNthCalledWith(2, {
            message: MESSAGE_ENGINE_START,
            payload: null
        })
    })
})
