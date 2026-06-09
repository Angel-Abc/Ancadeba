import { z } from 'zod'

const navigateActionSchema = z.object({
  type: z.literal('navigate'),
  targetSurfaceId: z.string(),
})

const newGameActionSchema = z.object({
  type: z.literal('new-game'),
  newGameId: z.string(),
})

const exitActionSchema = z.object({
  type: z.literal('exit'),
})

const actionSchema = z.discriminatedUnion('type', [
  navigateActionSchema,
  newGameActionSchema,
  exitActionSchema,
])

export const buttonSchema = z.object({
  label: z.string(),
  action: actionSchema,
})

export type NavigateAction = z.infer<typeof navigateActionSchema>
export type NewGameAction = z.infer<typeof newGameActionSchema>
export type ExitAction = z.infer<typeof exitActionSchema>
export type Action = z.infer<typeof actionSchema>
export type Button = z.infer<typeof buttonSchema>
