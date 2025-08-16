import { z } from 'zod'
import { buttonSchema } from './button'

const gameMenuComponentSchema = z.object({
    type: z.literal('game-menu'),
    buttons: z.array(buttonSchema)
})

const imageComponentSchema = z.object({
    type: z.literal('image'),
    image: z.string()
})

const squaresMapComponentSchema = z.object({
    type: z.literal('squares-map'),
    mapSize: z.object({
        rows: z.number().int().positive(),
        columns: z.number().int().positive()
    })
})

const inputMatrxComponentSchema = z.object({
    type: z.literal('input-matrix'),
    matrixSize: z.object({
        width: z.number().int().positive(),
        height: z.number().int().positive()
    })
})

const inventoryComponentSchema = z.object({
    type: z.literal('inventory')
})

const contextComponentSchema = z.object({
    type: z.literal('context')
})

const characterComponentSchema = z.object({
    type: z.literal('character')
})

const outputComponentSchema = z.object({
    type: z.literal('output-log'),
    logSize: z.number().int().positive()
})

export const componentSchema = z.discriminatedUnion('type', [
    gameMenuComponentSchema, 
    imageComponentSchema, 
    squaresMapComponentSchema,
    inputMatrxComponentSchema,
    inventoryComponentSchema,
    contextComponentSchema,
    characterComponentSchema,
    outputComponentSchema
])

export type Component = z.infer<typeof componentSchema>
