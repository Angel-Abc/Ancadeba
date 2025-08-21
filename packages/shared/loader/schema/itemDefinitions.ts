import { z } from 'zod'

export const itemDefinitionSchema = z.object({
    key: z.string(),
    description: z.string(),
    label: z.string(),
    images: z.string(),
    tags: z.array(z.string())
})

export const itemDefinitionsSchema = z.array(itemDefinitionSchema)

export type ItemDefinition = z.infer<typeof itemDefinitionSchema>
export type ItemDefinitions = z.infer<typeof itemDefinitionsSchema>
