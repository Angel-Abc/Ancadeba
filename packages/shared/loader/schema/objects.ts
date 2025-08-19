import { z } from 'zod'
import { positionSchema } from './map'
import { conditionSchema } from './condition'
import { actionSchema } from './action'

// TODO check and expand later, when inventory and npc's are going to be a thing

export const objectSchema = z.object({
    id: z.string()
})

export const scriptableObjectSchema = z.object({
    id: z.string(),
    position: positionSchema,
    conditions: z.object({
        activation: conditionSchema.optional()
    }),
    actions: z.object({
        onActivation: actionSchema.optional()
    })
})

export const itemSchema = z.union([
    scriptableObjectSchema, z.object({

    })
])

export const personSchema = z.union([
    scriptableObjectSchema, z.object({

    })
])
