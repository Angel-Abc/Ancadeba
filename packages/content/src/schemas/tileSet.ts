import { z } from 'zod'

export const tileSetTileSchema = z.object({
  id: z.string(),
  description: z.string(),
  image: z.string().optional(),
  color: z.string(),
  walkable: z.boolean(),
})

export const tileSetSchema = z
  .object({
    id: z.string(),
    tiles: z.array(tileSetTileSchema),
  })
  .superRefine((tileSet, context) => {
    const tileIds = new Set<string>()

    tileSet.tiles.forEach((tile, index) => {
      if (tileIds.has(tile.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate tile ID "${tile.id}".`,
          path: ['tiles', index, 'id'],
        })
      }

      tileIds.add(tile.id)
    })
  })

export type TileSetTile = z.infer<typeof tileSetTileSchema>
export type TileSet = z.infer<typeof tileSetSchema>
