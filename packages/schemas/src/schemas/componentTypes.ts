import { z } from 'zod'
import { menuOptionSchema } from './componentCommon'

export const sizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export const borderSchema = z
  .object({
    width: z.number().int().nonnegative().default(0),
    padding: z.number().int().nonnegative().default(0),
    margin: z.number().int().nonnegative().default(0),
  })
  .default({ width: 0, padding: 0, margin: 0 })

/**
 * Factory function to create component type schemas.
 * This ensures component types are defined once and reused in both
 * inline components and component definitions.
 */
export function createComponentTypeSchemas<
  TBase extends z.ZodObject<z.ZodRawShape>
>(baseSchema: TBase) {
  return {
    background: baseSchema.extend({
      type: z.literal('background'),
      color: z.string(),
      image: z.string(),
    }),
    inventory: baseSchema.extend({
      type: z.literal('inventory'),
    }),
    appearance: baseSchema.extend({
      type: z.literal('appearance'),
      categoryId: z.string(),
    }),
    textLog: baseSchema.extend({
      type: z.literal('text-log'),
    }),
    inputBar: baseSchema.extend({
      type: z.literal('input-bar'),
    }),
    characterSheet: baseSchema.extend({
      type: z.literal('character-sheet'),
    }),
    menu: baseSchema.extend({
      type: z.literal('menu'),
      options: z.array(menuOptionSchema).min(1),
    }),
    squaresMap: baseSchema.extend({
      type: z.literal('squares-map'),
      viewport: sizeSchema,
    }),
  }
}

export type Size = z.infer<typeof sizeSchema>
export type Border = z.infer<typeof borderSchema>
