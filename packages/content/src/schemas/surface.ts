import z from 'zod'

export const surfaceCapabilitySchema = z.enum([
  'boot:progress',
  'ecs:projections',
  'world:ready',
  'persistence:listSaves',
])

export const surfaceSchema = z.object({
  id: z.string(),
  tags: z.array(z.string()).optional(),
  requires: z.array(surfaceCapabilitySchema).optional(),
  forbids: z.array(surfaceCapabilitySchema).optional(),
  layout: z.record(z.string(), z.unknown()).optional(),
})

export type SurfaceCapability = z.infer<typeof surfaceCapabilitySchema>
export type Surface = z.infer<typeof surfaceSchema>
