import z from 'zod'

export const gameSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  version: z.string(),
  bootSurfaceId: z.string(),
  initialSurfaceId: z.string(),
  widgets: z.array(z.string()).optional(),
  surfaces: z.array(z.string()).optional(),
})
export type Game = z.infer<typeof gameSchema>
