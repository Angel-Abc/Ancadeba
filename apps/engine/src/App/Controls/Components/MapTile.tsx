import { Tile } from '@ancadeba/schemas'
import { CSSCustomProperties } from '@ancadeba/ui'

interface MapTileProps {
  tile: Tile
  assetsUrl: string
}

export function MapTile({ tile, assetsUrl }: MapTileProps) {
  const tileStyle: CSSCustomProperties = {
    '--ge-map-tile-color': tile.color || 'transparent',
  }
  const imageUrl = tile.image ? `${assetsUrl}/${tile.image}` : null

  return (
    <div style={tileStyle}>
      {imageUrl && <img src={imageUrl} />}
    </div>
  )
}
