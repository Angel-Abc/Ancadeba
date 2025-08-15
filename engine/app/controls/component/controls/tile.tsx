import { CSSCustomProperties } from '@app/types'
import { type Tile as TileData } from '@loader/data/tile'

/**
 * Properties for the {@link Tile} component.
 *
 * @property tile - Data describing how the tile should be rendered.
 * @property isPlayerPosition - Whether the tile matches the player's current position.
 */
export type TileProps = {
    /** Data describing how the tile should be rendered. */
    tile: TileData
    /** Indicates if this tile is at the player's current position. */
    isPlayerPosition: boolean
}

/**
 * Renders a map tile applying its color and optional image. Adds the `player`
 * class when the tile corresponds to the player's location.
 *
 * @param props - {@link TileProps} for the component.
 * @returns The rendered tile element.
 */
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
