import z from 'zod'
import { BaseSchema } from './base'

export const defaultSettingsSchema = z.object({
  language: z.string(),
  volume: z.number().min(0).max(1),
})

export const gameSchema = BaseSchema.extend({
  title: z.string(),
  description: z.string(),
  version: z.string(),
  initialState: z.object({
    scene: z.string(),
    map: z.string().optional(),
    flags: z.record(z.string(), z.boolean()).optional(),
  }),
  scenes: z.array(z.string()),
  styling: z.array(z.string()),
  tileSets: z.array(z.string()),
  maps: z.array(z.string()),
  languages: z.record(
    z.string(),
    z.object({
      name: z.string(),
      files: z.array(z.string()),
    })
  ),
  defaultSettings: defaultSettingsSchema,
})

export type Game = z.infer<typeof gameSchema>
export type DefaultSettings = z.infer<typeof defaultSettingsSchema>
