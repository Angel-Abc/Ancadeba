import { z } from 'zod'
import { BaseSchema } from './base'

export const mapTileSchema = z.object({
  key: z.string(),
  tile: z.string(),
})

export const mapSchema = BaseSchema.extend({
  width: z.number(),
  height: z.number(),
  tiles: z.array(mapTileSchema),
  map: z.array(z.string()),
})

export type Map = z.infer<typeof mapSchema>
export type MapTile = z.infer<typeof mapTileSchema>
