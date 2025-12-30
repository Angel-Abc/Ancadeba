import { z } from 'zod'
import { BaseSchema } from './base'

export const tileSchema = z.object({
  id: z.string(),
  image: z.string().optional(),
  walkable: z.boolean(),
  color: z.string().optional(),
})

export const tileSetSchema = BaseSchema.extend({
  tiles: z.array(tileSchema),
})

export type TileSet = z.infer<typeof tileSetSchema>
export type Tile = z.infer<typeof tileSchema>
