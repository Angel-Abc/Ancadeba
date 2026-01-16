import { Tile } from '@ancadeba/schemas'
import { CSSCustomProperties } from '@ancadeba/ui'
import type { ReactNode } from 'react'

interface MapTileProps {
  tile: Tile
  assetsUrl: string
  children?: ReactNode
}

export function MapTile({ tile, assetsUrl, children }: MapTileProps) {
  const tileStyle: CSSCustomProperties = {
    '--ge-map-tile-color': tile.color || 'transparent',
  }
  const imageUrl = tile.image ? `${assetsUrl}/${tile.image}` : null

  return (
    <div style={tileStyle}>
      {imageUrl && <img src={imageUrl} />}
      {children}
    </div>
  )
}
