import { z } from 'zod'

export const tileSchema = z.object({
    key: z.string(),
    description: z.string(),
    color: z.string(),
    image: z.string().optional()
})

export const tileSetSchema = z.object({
    id: z.string(),
    tiles: z.array(tileSchema)
})

export type Tile = z.infer<typeof tileSchema>
export type TileSet = z.infer<typeof tileSetSchema>
