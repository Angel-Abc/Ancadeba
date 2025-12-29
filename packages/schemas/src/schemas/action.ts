import { z } from 'zod'

export const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('switch-scene'),
    targetSceneId: z.string(),
  }),
  z.object({
    type: z.literal('exit-game'),
  }),
  z.object({
    type: z.literal('set-flag'),
    name: z.string(),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal('back'),
  }),
])

export type Action = z.infer<typeof actionSchema>
