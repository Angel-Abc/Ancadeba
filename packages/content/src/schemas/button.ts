import { z } from 'zod'

const navigateActionSchema = z.object({
  type: z.literal('navigate'),
  targetSurfaceId: z.string(),
})

const exitActionSchema = z.object({
  type: z.literal('exit'),
})

const actionSchema = z.discriminatedUnion('type', [
  navigateActionSchema,
  exitActionSchema,
])

export const buttonSchema = z.object({
  label: z.string(),
  action: actionSchema,
})

export type NavigateAction = z.infer<typeof navigateActionSchema>
export type ExitAction = z.infer<typeof exitActionSchema>
export type Action = z.infer<typeof actionSchema>
export type Button = z.infer<typeof buttonSchema>
