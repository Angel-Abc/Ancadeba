import {z} from 'zod'

export const gameSchema = z.object({
    name: z.string()
})

export type Game =  z.infer<typeof gameSchema>
