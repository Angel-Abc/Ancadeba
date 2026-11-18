import { z } from 'zod'
import { assetIdSchema, graphicAppearanceSchema } from './assets.js'
import { gameIdSchema } from './gameId.js'
import { translationKeySchema } from './languages.js'

const label = {
  label: z.string().trim().min(1),
  labelKey: translationKeySchema.optional(),
}

export const characterProfileSchema = z
  .strictObject({
    fields: z
      .array(
        z.strictObject({
          id: gameIdSchema,
          ...label,
          path: z.array(assetIdSchema).min(1),
          options: z.array(z.strictObject({ id: assetIdSchema, ...label })).min(1),
          default: assetIdSchema,
        }),
      )
      .min(1),
    portrait: z.strictObject({
      visual: assetIdSchema,
      appearance: graphicAppearanceSchema.prefault({}),
    }),
  })
  .superRefine(({ fields }, context) => {
    const ids = new Set<string>()
    const paths = new Set<string>()

    for (const [index, field] of fields.entries()) {
      const path = JSON.stringify(field.path)
      const options = new Set(field.options.map(({ id }) => id))

      if (ids.has(field.id) || paths.has(path))
        context.addIssue({
          code: 'custom',
          path: ['fields', index],
          message: 'Profile fields require unique IDs and Rules paths',
        })

      if (options.size !== field.options.length || !options.has(field.default))
        context.addIssue({
          code: 'custom',
          path: ['fields', index, 'options'],
          message: 'Profile options require unique IDs and a matching default',
        })

      ids.add(field.id)
      paths.add(path)
    }
  })

export type CharacterProfileDefinition = z.infer<typeof characterProfileSchema>
