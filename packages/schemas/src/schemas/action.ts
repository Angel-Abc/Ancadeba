import { z } from 'zod'

export const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('switch-scene'),
    targetSceneId: z.string(),
  }),
  z.object({
    type: z.literal('open-settings'),
  }),
  z.object({
    type: z.literal('exit-game'),
  }),
])

export type Action = z.infer<typeof actionSchema>
