import { CSSCustomProperties } from '@app/types'
import { type Tile as TileData } from '@loader/data/tile'

export type TileProps = {
    tile: TileData
    isPlayerPosition: boolean
}

export const Tile: React.FC<TileProps> = ({ tile, isPlayerPosition }): React.JSX.Element => {
    const style: CSSCustomProperties = {
        '--ge-map-tile-color': tile.color || 'transparent',
    }
    return (
        <div style={style} className={isPlayerPosition ? 'player' : undefined}>
            {tile.image && <img src={tile.image} />}
        </div>
    )
}
