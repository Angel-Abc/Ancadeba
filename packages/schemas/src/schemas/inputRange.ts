import { z } from 'zod'

export const inputSchema = z.object({
  virtualInput: z.string(),
  label: z.string(),
})

export const inputRangeSchema = z.array(z.array(inputSchema))

export type Input = z.infer<typeof inputSchema>
export type InputRange = z.infer<typeof inputRangeSchema>
