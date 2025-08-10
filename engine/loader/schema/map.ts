import { z } from 'zod'
import { actionSchema } from './action'

export const mapTileSchema = z.object({
    key: z.string(),
    tile: z.string(),
    onEnter: actionSchema.optional()
})

export const squaresMapSchema = z.object({
    key: z.string(),
    type: z.literal('squares-map'),
    width: z.int().positive(),
    height: z.int().positive(),
    tileSets: z.array(z.string()),
    tiles: z.array(mapTileSchema),
    map: z.array(z.string()),
})

export type MapTile = z.infer<typeof mapTileSchema>
export type SquaresMap = z.infer<typeof squaresMapSchema>
export type GameMap = SquaresMap
