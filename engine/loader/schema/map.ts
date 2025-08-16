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
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    tileSets: z.array(z.string()),
    tiles: z.array(mapTileSchema),
    map: z.array(z.string()),
})

export const positionSchema = z.object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative()
})

export const gameMapSchema = z.discriminatedUnion('type', [squaresMapSchema])

export type MapTile = z.infer<typeof mapTileSchema>
export type SquaresMap = z.infer<typeof squaresMapSchema>
export type GameMap = z.infer<typeof gameMapSchema>
export type Position = z.infer<typeof positionSchema>
