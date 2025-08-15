import { describe, it, expect, vi } from 'vitest'
import { MapManager } from '../../engine/managers/mapManager'
import type { IGameMapLoader } from '../../engine/loader/gameMapLoader'
import type { IMessageBus } from '../../utils/messageBus'
import type { IGameDataProvider, GameData, GameContext } from '../../engine/providers/gameDataProvider'
import type { ITileSetLoader } from '../../engine/loader/tileSetLoader'

function createManager(gameData: GameData, loadTileSet: ReturnType<typeof vi.fn>) {
    const provider = {
        get Game() { return gameData },
        get Context() { return {} as GameContext },
        initialize: vi.fn()
    } as unknown as IGameDataProvider
    const tileSetLoader = { loadTileSet } as unknown as ITileSetLoader
    const mapLoader = {} as IGameMapLoader
    const bus = {} as IMessageBus
    return new MapManager(mapLoader, bus, provider, tileSetLoader)
}

describe('MapManager.ensureTileSets', () => {
    it('loads tile sets that are not yet loaded', async () => {
        const gameData = {
            game: { tiles: { ts1: 'ts1.json' } },
            loadedTileSets: new Set<string>(),
            loadedTiles: new Map()
        } as unknown as GameData
        const loadTileSet = vi.fn().mockResolvedValue({ id: 'ts1', tiles: [{ key: 'tile1' }] })
        const manager = createManager(gameData, loadTileSet)

        await manager.ensureTileSets(['ts1'])

        expect(loadTileSet).toHaveBeenCalledWith('ts1.json')
        expect(gameData.loadedTileSets.has('ts1')).toBe(true)
        expect(gameData.loadedTiles.get('tile1')).toEqual({ key: 'tile1' })
    })

    it('does not reload tile sets that are already loaded', async () => {
        const gameData = {
            game: { tiles: { ts1: 'ts1.json' } },
            loadedTileSets: new Set<string>(['ts1']),
            loadedTiles: new Map([['tile1', { key: 'tile1' }]])
        } as unknown as GameData
        const loadTileSet = vi.fn().mockResolvedValue({ id: 'ts1-new', tiles: [{ key: 'tile2' }] })
        const manager = createManager(gameData, loadTileSet)

        await manager.ensureTileSets(['ts1'])

        expect(loadTileSet).not.toHaveBeenCalled()
        expect(gameData.loadedTileSets.has('ts1')).toBe(true)
        expect(gameData.loadedTiles.get('tile1')).toEqual({ key: 'tile1' })
    })
})
