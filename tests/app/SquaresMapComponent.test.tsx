// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { services } from './testUtils'
import { SquaresMap } from '@app/controls/component/SquaresMap'
import { messageBusToken, type IMessageBus } from '@utils/messageBus'
import { gameDataProviderToken, type IGameDataProvider } from '@providers/gameDataProvider'
import { POSITION_CHANGED } from '@messages/system'
import { SquaresMapComponent } from '@loader/data/component'
import type { Tile as TileData } from '@loader/data/tile'

vi.mock('@app/controls/component/controls/Tile', () => ({
  Tile: ({ tile, isPlayerPosition }: { tile: TileData & { id: string }; isPlayerPosition: boolean }) => (
    <div data-testid={`tile-${tile.id}`} data-player={isPlayerPosition ? 'true' : 'false'} />
  )
}))

describe('SquaresMapComponent', () => {
  beforeEach(() => services.clear())

  it('renders nothing when map id is missing', () => {
    const provider = {
      context: { currentMap: { id: null }, player: { position: { x: 0, y: 0 } } },
      game: { loadedMaps: {}, loadedTiles: new Map<string, TileData>() }
    } as unknown as IGameDataProvider
    services.set(gameDataProviderToken, provider)
    services.set(messageBusToken, { registerMessageListener: vi.fn() } as unknown as IMessageBus)

    const component: SquaresMapComponent = { type: 'squares-map', mapSize: { columns: 1, rows: 1 } }
    const { container } = render(<SquaresMap component={component} />)
    expect(container.innerHTML).toBe('')
  })

  it('updates player position on POSITION_CHANGED', () => {
    const listeners = new Map<string, () => void>()
    const messageBus = {
      registerMessageListener: (message: string, handler: () => void) => {
        listeners.set(message, handler)
        return () => {}
      }
    } as unknown as IMessageBus

    const provider = {
      context: { currentMap: { id: 'map1' }, player: { position: { x: 0, y: 0 } } },
      game: {
        loadedMaps: {
          map1: {
            width: 2,
            height: 2,
            map: [['a', 'b'], ['c', 'd']],
            tiles: {
              a: { tile: 'tile1' },
              b: { tile: 'tile2' },
              c: { tile: 'tile3' },
              d: { tile: 'tile4' }
            }
          }
        },
        loadedTiles: new Map<string, TileData & { id: string }>([
          ['tile1', { id: 't1', key: 't1', description: '', color: 'red' } as TileData & { id: string }],
          ['tile2', { id: 't2', key: 't2', description: '', color: 'green' } as TileData & { id: string }],
          ['tile3', { id: 't3', key: 't3', description: '', color: 'blue' } as TileData & { id: string }],
          ['tile4', { id: 't4', key: 't4', description: '', color: 'yellow' } as TileData & { id: string }]
        ])
      }
    } as unknown as IGameDataProvider

    services.set(messageBusToken, messageBus)
    services.set(gameDataProviderToken, provider)

    const component: SquaresMapComponent = { type: 'squares-map', mapSize: { columns: 3, rows: 3 } }
    render(<SquaresMap component={component} />)

    expect(screen.getByTestId('tile-t1').getAttribute('data-player')).toBe('true')

    provider.context.player.position = { x: 1, y: 1 }
    act(() => {
      listeners.get(POSITION_CHANGED)!()
    })

    expect(screen.getByTestId('tile-t1').getAttribute('data-player')).toBe('false')
    expect(screen.getByTestId('tile-t4').getAttribute('data-player')).toBe('true')
  })
})

