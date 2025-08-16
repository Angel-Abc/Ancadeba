import { describe, it, expect, vi } from 'vitest'
import { MapManager } from '../../engine/managers/mapManager'
import type { IGameMapLoader } from '../../engine/loader/gameMapLoader'
import type { IMessageBus } from '../../utils/messageBus'
import type { IGameDataProvider, GameData, GameContext } from '../../engine/providers/gameDataProvider'
import type { ITileSetManager } from '../../engine/managers/tileSetManager'
import type { IPlayerPositionManager } from '../../engine/managers/playerPositionManager'
import { MAP_SWITCHED } from '../../engine/messages/system'
import type { ILogger } from '../../utils/logger'

function createProvider(gameData: GameData, context: GameContext): IGameDataProvider {
  return {
    get Game() { return gameData },
    get Context() { return context },
    initialize: vi.fn()
  } as unknown as IGameDataProvider
}

describe('MapManager.setActiveMap', () => {
  it('loads map and ensures tile sets', async () => {
    const gameData = {
      game: { maps: { m1: 'm1.json' } },
      loadedMaps: {},
      loadedTileSets: new Set<string>(),
      loadedTiles: new Map()
    } as unknown as GameData
    const context = { currentMapId: null } as unknown as GameContext
    const provider = createProvider(gameData, context)
    const map = { tileSets: ['ts1'] }
    const mapLoader = { loadMap: vi.fn().mockResolvedValue(map) } as unknown as IGameMapLoader
    const ensureTileSets = vi.fn().mockResolvedValue(undefined)
    const tileSetManager = { ensureTileSets } as unknown as ITileSetManager
    const playerPositionManager = { changePosition: vi.fn() } as unknown as IPlayerPositionManager
    const postMessage = vi.fn()
    const messageBus = { registerMessageListener: vi.fn(), postMessage } as unknown as IMessageBus

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const manager = new MapManager(
      mapLoader,
      messageBus,
      provider,
      tileSetManager,
      playerPositionManager,
      logger,
    )
    await manager.setActiveMap('m1')

    expect(mapLoader.loadMap).toHaveBeenCalledWith('m1.json')
    expect(ensureTileSets).toHaveBeenCalledWith(['ts1'])
    expect(gameData.loadedMaps['m1']).toBe(map)
    expect(context.currentMapId).toBe('m1')
    expect(postMessage).toHaveBeenCalledWith({ message: MAP_SWITCHED, payload: 'm1' })
  })
})

describe('MapManager.initialize', () => {
  it('clears previous listeners on repeated initialization', () => {
    const cleanup1 = vi.fn()
    const cleanup2 = vi.fn()
    const register = vi.fn()
      .mockReturnValueOnce(cleanup1)
      .mockReturnValueOnce(cleanup2)
      .mockReturnValue(() => {})
    const messageBus = {
      registerMessageListener: register
    } as unknown as IMessageBus

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const manager = new MapManager(
      {} as IGameMapLoader,
      messageBus,
      {} as IGameDataProvider,
      {} as ITileSetManager,
      {} as IPlayerPositionManager,
      logger,
    )

    manager.initialize()
    manager.initialize()

    expect(cleanup1).toHaveBeenCalledTimes(1)
    expect(cleanup2).toHaveBeenCalledTimes(1)
    expect(register).toHaveBeenCalledTimes(4)
  })
})
