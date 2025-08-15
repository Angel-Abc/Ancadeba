// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Tile } from '@app/controls/component/controls/tile'
import type { Tile as TileData } from '@loader/data/tile'

describe('Tile', () => {
  it('applies style, player class and image when provided', () => {
    const tileData: TileData = { key: 't1', description: 'tile', color: 'red', image: '/img.png' }
    const { container } = render(<Tile tile={tileData} isPlayerPosition={true} />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toBe('player')
    expect(div.style.getPropertyValue('--ge-map-tile-color')).toBe('red')
    const img = div.querySelector('img') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('/img.png')
  })

  it('renders without image and player class when not player position', () => {
    const tileData: TileData = { key: 't2', description: 'tile', color: 'blue' }
    const { container } = render(<Tile tile={tileData} isPlayerPosition={false} />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toBe('')
    expect(div.style.getPropertyValue('--ge-map-tile-color')).toBe('blue')
    expect(div.querySelector('img')).toBeNull()
  })
})

