import { z } from 'zod'
import { componentSchema } from './component'
import { inputSchema } from './inputs'
import { conditionSchema } from './condition'

const gridScreenPositionSchema = z.object({
    top: z.int().nonnegative(),
    left: z.int().nonnegative(),
    right: z.int().nonnegative(),
    bottom: z.int().nonnegative()
})

const gridScreenItemSchema = z.object({
    position: gridScreenPositionSchema,
    component: componentSchema,
    condition: conditionSchema.optional()
})

const gridScreenSchema = z.object({
    type: z.literal('grid'),
    width: z.int().positive(),
    height: z.int().positive(),
    components: z.array(gridScreenItemSchema),
})
const screenSchema = z.discriminatedUnion('type', [gridScreenSchema])

export const pageSchema = z.object({
    id: z.string(),
    screen: screenSchema,
    inputs: z.array(inputSchema)
})

export type Page = z.infer<typeof pageSchema>
export type Screen = z.infer<typeof screenSchema>
export type GridScreenItem = z.infer<typeof gridScreenItemSchema>
