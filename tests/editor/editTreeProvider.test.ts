import { describe, it, expect, vi } from 'vitest'
import { EditTreeProvider } from '../../packages/editor/providers/editTreeProvider'
import type { ILogger } from '@utils/logger'
import type { IGameDataProvider } from '../../packages/editor/providers/gameDataProvider'
import type { RootItem, BaseItem } from '../../packages/editor/types/gameItems'
import type { Game } from '../../packages/engine/loader/data/game'

const logger: ILogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn((c, m) => `[${c}] ${m}`)
}

const createGame = (): Game => ({
  title: 'root',
  description: '',
  version: '1.0',
  initialData: { language: 'en', startPage: 'start' },
  languages: {},
  pages: {},
  maps: {},
  tiles: {},
  dialogs: {},
  actions: [],
  virtualKeys: [],
  virtualInputs: [],
  cssFiles: []
})

const createRoot = (): RootItem => ({
  type: 'root',
  id: 1,
  label: 'Root',
  game: createGame(),
  children: [
    {
      type: 'pages',
      id: 2,
      label: 'Pages',
      children: [
        {
          type: 'page',
          id: 3,
          label: 'First',
          key: 'first',
          path: 'first.json',
          children: []
        } as BaseItem
      ]
    } as BaseItem
  ]
})

describe('editor EditTreeProvider', () => {
  it('builds tree from game data', () => {
    const gameDataProvider: IGameDataProvider = {
      setGame: vi.fn(),
      get root () { return createRoot() }
    }
    const provider = new EditTreeProvider(logger, gameDataProvider)

    const root = provider.Root

    expect(root.label).toBe('Root')
    expect(root.children[0].label).toBe('Pages')
    expect(root.children[0].children[0].label).toBe('First')
    expect(root.children[0].children[0].data?.id).toBe(3)
  })

  it('returns placeholder when no data is available', () => {
    const gameDataProvider: IGameDataProvider = {
      setGame: vi.fn(),
      get root () { return null as unknown as RootItem }
    }
    const provider = new EditTreeProvider(logger, gameDataProvider)

    expect(provider.Root).toEqual({
      label: 'No data',
      data: null,
      id: 0,
      children: []
    })
  })
})

