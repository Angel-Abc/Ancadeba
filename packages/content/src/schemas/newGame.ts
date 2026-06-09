import { z } from 'zod'

export const newGamePositionSchema = z.object({
  row: z.number().int().min(0),
  column: z.number().int().min(0),
})

export const newGameSchema = z.object({
  id: z.string(),
  startSurfaceId: z.string(),
  mapId: z.string(),
  player: z.object({
    position: newGamePositionSchema,
  }),
})

export type NewGamePosition = z.infer<typeof newGamePositionSchema>
export type NewGame = z.infer<typeof newGameSchema>
