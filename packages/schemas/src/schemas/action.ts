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
  z.object({
    type: z.literal('volume-up'),
  }),
  z.object({
    type: z.literal('volume-down'),
  }),
])

export type Action = z.infer<typeof actionSchema>
