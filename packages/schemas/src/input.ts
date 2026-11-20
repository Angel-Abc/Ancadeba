import { z } from 'zod'
import { gameIdSchema } from './game.js'

export const sceneControlSchema = z.enum([
  'map.north',
  'map.east',
  'map.south',
  'map.west',
  'menu.toggle',
])

export type SceneControl = z.infer<typeof sceneControlSchema>

export const defaultSceneKeys: Readonly<Record<SceneControl, string>> = {
  'map.north': 'ArrowUp',
  'map.east': 'ArrowRight',
  'map.south': 'ArrowDown',
  'map.west': 'ArrowLeft',
  'menu.toggle': 'Escape',
}

const sceneKeysSchema = z
  .partialRecord(sceneControlSchema, z.string().trim().min(1))
  .superRefine((overrides, context) => {
    const assigned = new Map<string, SceneControl>()

    for (const control of sceneControlSchema.options) {
      const code = overrides[control] ?? defaultSceneKeys[control]
      const previous = assigned.get(code)

      if (previous)
        context.addIssue({
          code: 'custom',
          path: [overrides[control] === undefined ? previous : control],
          message: `${code} is assigned to both ${previous} and ${control}`,
        })
      assigned.set(code, control)
    }
  })

export const inputSchema = z
  .object({
    'schema-version': z.literal('1.0.0'),
    'virtual-keys': z.array(gameIdSchema).min(1),
    keyboard: z.record(z.string().trim().min(1), gameIdSchema),
    contexts: z.record(gameIdSchema, z.record(gameIdSchema, gameIdSchema)),
    'initial-context': gameIdSchema,
    'scene-keys': sceneKeysSchema.optional(),
  })
  .superRefine((input, context) => {
    const keys = new Set(input['virtual-keys'])

    const issue = (path: string[], message: string) =>
      context.addIssue({ code: 'custom', path, message })

    if (keys.size !== input['virtual-keys'].length) {
      issue(['virtual-keys'], 'Virtual key IDs must be unique')
    }

    for (const [code, key] of Object.entries(input.keyboard)) {
      if (!keys.has(key)) issue(['keyboard', code], `Unknown virtual key: ${key}`)
    }

    if (Object.keys(input.contexts).length === 0) {
      issue(['contexts'], 'At least one input context is required')
    }

    for (const [name, mappings] of Object.entries(input.contexts)) {
      if (Object.keys(mappings).length === 0) {
        issue(['contexts', name], 'Input contexts must not be empty')
      }

      for (const key of Object.keys(mappings)) {
        if (!keys.has(key)) issue(['contexts', name, key], `Unknown virtual key: ${key}`)
      }
    }

    if (!Object.hasOwn(input.contexts, input['initial-context'])) {
      issue(['initial-context'], 'The initial context must name a declared context')
    }
  })

export type InputDefinition = z.infer<typeof inputSchema>
