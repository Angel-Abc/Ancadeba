import { describe, it, expect, vi } from 'vitest'
import { PageManager } from '../../packages/engine/managers/pageManager'
import { SWITCH_PAGE, PAGE_SWITCHED } from '../../packages/engine/messages/system'
import type { IMessageBus } from '@utils/messageBus'
import type { IGameDataProvider, GameData, GameContext } from '../../packages/engine/providers/gameDataProvider'
import type { IPageLoader } from '../../packages/engine/loader/pageLoader'
import type { ILogger } from '@utils/logger'

type Msg = { message: string, payload: unknown }

function createBus(): IMessageBus {
  const listeners = new Map<string, ((m: Msg) => void)[]>()
  const postMessage = vi.fn((msg: Msg) => {
    (listeners.get(msg.message) || []).forEach(h => h(msg))
  })
  const registerMessageListener = vi.fn((message: string, handler: (msg: Msg) => void) => {
    if (!listeners.has(message)) listeners.set(message, [])
    listeners.get(message)!.push(handler)
    return () => {
      const arr = listeners.get(message)!.filter(h => h !== handler)
      if (arr.length > 0) listeners.set(message, arr)
      else listeners.delete(message)
    }
  })
  return { postMessage, registerMessageListener } as unknown as IMessageBus
}

describe('PageManager', () => {
  it('loads pages and posts switch messages', async () => {
    const bus = createBus()
    const gameData = {
      game: { pages: { home: 'home.json' } },
      loadedLanguages: {},
      loadedPages: {} as Record<string, unknown>
    } as unknown as GameData
    const context = { currentPageId: null } as unknown as GameContext
    const provider = {
      get game() { return gameData },
      get context() { return context },
      initialize: vi.fn()
    } as unknown as IGameDataProvider
    const loadPage = vi.fn().mockResolvedValue({ id: 'home' })
    const loader = { loadPage } as unknown as IPageLoader
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const manager = new PageManager(provider, loader, bus, logger)

    await manager.setActivePage('home')

    expect(loadPage).toHaveBeenCalledWith('home.json')
    expect(gameData.loadedPages['home']).toEqual({ id: 'home' })
    expect(context.currentPageId).toBe('home')
    expect(bus.postMessage).toHaveBeenCalledWith({ message: PAGE_SWITCHED, payload: 'home' })
  })

  it('responds to SWITCH_PAGE messages and cleans up listeners', async () => {
    const bus = createBus()
    const provider = {} as IGameDataProvider
    const loader = {} as IPageLoader
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const manager = new PageManager(provider, loader, bus, logger)
    manager.initialize()
    const spy = vi.spyOn(manager, 'setActivePage').mockResolvedValue(undefined)

    manager.initialize()
    bus.postMessage({ message: SWITCH_PAGE, payload: 'home' })
    await Promise.resolve()
    expect(spy).toHaveBeenCalledWith('home')

    manager.cleanup()
    bus.postMessage({ message: SWITCH_PAGE, payload: 'home' })
    await Promise.resolve()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
