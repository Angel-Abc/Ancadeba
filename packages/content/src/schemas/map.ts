import { z } from 'zod'

const tileReferencePattern = /^[^.]+\.[^.]+$/

export const mapTileSchema = z.object({
  key: z.string(),
  tile: z.string().regex(tileReferencePattern),
})

export const mapSchema = z
  .object({
    id: z.string(),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    tiles: z.array(mapTileSchema),
    map: z.array(z.string()),
  })
  .superRefine((map, context) => {
    const tileKeys = new Set<string>()

    map.tiles.forEach((tile, index) => {
      if (tileKeys.has(tile.key)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate tile key "${tile.key}".`,
          path: ['tiles', index, 'key'],
        })
      }

      tileKeys.add(tile.key)
    })

    if (map.map.length !== map.height) {
      context.addIssue({
        code: 'custom',
        message: `Map row count ${map.map.length} does not match height ${map.height}.`,
        path: ['map'],
      })
    }

    map.map.forEach((row, rowIndex) => {
      const rowTileKeys = row.split(',')

      if (rowTileKeys.length !== map.width) {
        context.addIssue({
          code: 'custom',
          message: `Map row ${rowIndex} width ${rowTileKeys.length} does not match width ${map.width}.`,
          path: ['map', rowIndex],
        })
      }

      rowTileKeys.forEach((tileKey, columnIndex) => {
        if (!tileKeys.has(tileKey)) {
          context.addIssue({
            code: 'custom',
            message: `Map tile key "${tileKey}" is not declared.`,
            path: ['map', rowIndex, columnIndex],
          })
        }
      })
    })
  })

export type MapTile = z.infer<typeof mapTileSchema>
export type GameMap = z.infer<typeof mapSchema>
