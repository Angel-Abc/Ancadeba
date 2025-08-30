import { describe, it, expect, vi } from 'vitest'
import { GameDataProvider } from '../../packages/editor/providers/gameDataProvider'
import { rootPath, type IGameDataStoreProvider } from '../../packages/editor/providers/gameDataStoreProvider'
import type { Game } from '../../packages/engine/loader/data/game'
import type { ILogger } from '@utils/logger'
import type { IMessageBus } from '@utils/messageBus'
import { SET_EDITOR_CONTENT } from '../../packages/editor/messages/editor'

describe('editor GameDataProvider', () => {
  const createDeps = () => {
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn((c, m, ...a) => `[${c}] ${m.replace('{0}', String(a[0]))}`)
    }
    const messageBus: IMessageBus = {
      postMessage: vi.fn(),
      registerMessageListener: vi.fn(),
      registerNotificationMessage: vi.fn(),
      unregisterNotificationMessage: vi.fn(),
      disableEmptyQueueAfterPost: vi.fn(),
      enableEmptyQueueAfterPost: vi.fn(),
      shutDown: vi.fn()
    }
    const gameDataStoreProvider: IGameDataStoreProvider = {
      store: vi.fn(),
      update: vi.fn(),
      retrieve: vi.fn(),
      retrieveItem: vi.fn(),
      hasData: vi.fn(),
      get IsChanged () { return false },
      getChangedItems: vi.fn(),
      markSaved: vi.fn()
    }
    return { logger, messageBus, gameDataStoreProvider }
  }

  const createGame = (): Game => ({
    title: 'Test Game',
    description: '',
    version: '1.0',
    initialData: { language: 'en', startPage: 'start' },
    languages: {
      zLang: ['z2.json', 'z1.json'],
      aLang: ['b.json', 'a.json']
    },
    pages: {
      bPage: 'b.json',
      aPage: 'a.json'
    },
    maps: {},
    tiles: {},
    dialogs: {},
    actions: [],
    virtualKeys: [],
    virtualInputs: [],
    cssFiles: []
  })

  it('creates tree, stores root and dispatches message', () => {
    const { logger, messageBus, gameDataStoreProvider } = createDeps()
    const provider = new GameDataProvider(logger, messageBus, gameDataStoreProvider)
    const game = createGame()

    provider.setGame(game)
    const root = provider.root

    expect(root.label).toBe('Test Game')
    expect(root.children.map(c => c.label)).toEqual(['Languages', 'Pages'])

    const pagesItem = root.children.find(c => c.type === 'pages')!
    expect(pagesItem.children.map(c => c.label)).toEqual(['aPage', 'bPage'])

    const languagesItem = root.children.find(c => c.type === 'languages')!
    expect(languagesItem.children.map(c => c.label)).toEqual(['aLang', 'zLang'])
    const aLang = languagesItem.children[0]
    expect(aLang.children.map(c => c.label)).toEqual(['a.json', 'b.json'])

    expect(gameDataStoreProvider.store).toHaveBeenCalledWith(root.id, game, rootPath)
    expect(messageBus.postMessage).toHaveBeenCalledWith({
      message: SET_EDITOR_CONTENT,
      payload: {
        id: root.id,
        label: root.label,
        type: root.type
      }
    })
  })
})

