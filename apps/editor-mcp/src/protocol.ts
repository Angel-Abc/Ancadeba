import { z } from 'zod'
import { sceneSchema } from '@ancadeba/schemas'
import { diagnosticSchema, projectViewSchema, projectListSchema } from '@ancadeba/editor-core'
import { commandSchemaTool, commandTool } from './commandSupport.js'
import { editorFeaturesSchema, operationsSchema } from './operationSupport.js'

export { apiErrorSchema, projectViewSchema } from '@ancadeba/editor-core'

export { projectListSchema } from '@ancadeba/editor-core'

export const projectDiscoveryResultSchema = projectListSchema.extend({ gamePath: z.string() })

export const projectCreationResultSchema = projectViewSchema.extend({
  gamePath: z.string(),
  configuredGamePath: z.string(),
})

export const projectSwitchResultSchema = projectViewSchema.extend({
  gamePath: z.string(),
  previousGamePath: z.string(),
})

export const gameExportResultSchema = z.object({
  gamePath: z.string(),
  fileName: z.string(),
  mimeType: z.literal('application/zip'),
  size: z.number().int().positive(),
  resourceUri: z.string(),
})

export const sceneViewSchema = z.object({
  revision: z.string().min(1),
  scene: sceneSchema,
  diagnostics: z.array(diagnosticSchema),
})

export const capabilitiesSchema = z.object({
  version: z.number().int(),
  requestSchema: z.record(z.string(), z.unknown()),
  commands: z.array(z.object({ type: z.string(), example: z.record(z.string(), z.unknown()) })),
  features: editorFeaturesSchema.optional(),
})

export const mcpCapabilitiesSchema = capabilitiesSchema.extend({
  gamePath: z.string(),
  commandTool: z.literal(commandTool),
  commandSchemaTool: z.literal(commandSchemaTool),
  operations: operationsSchema,
})

export const commandDetailSchema = z.object({
  gamePath: z.string(),
  type: z.string(),
  commandTool: z.literal(commandTool),
  schema: z.record(z.string(), z.unknown()),
  example: z.record(z.string(), z.unknown()),
})

/*
 * Advertised tool output schemas outline project views instead of repeating every definition
 * schema. Complete definition schemas would add megabytes to tool discovery; the editor client
 * already validates server responses with the precise schemas above.
 */
const definition = z.looseObject({})

const projectOutline = <T extends z.ZodRawShape>(shape: T) =>
  z.looseObject({
    revision: z.string(),
    game: definition.nullable(),
    scenes: z.array(definition),
    diagnostics: z.array(diagnosticSchema),
    history: projectViewSchema.shape.history,
    ...shape,
  })

export const advertisedGameSummarySchema = projectOutline({ gamePath: z.string() })

export const advertisedProjectSwitchResultSchema = projectOutline({
  gamePath: z.string(),
  previousGamePath: z.string(),
})

export const advertisedProjectCreationResultSchema = projectOutline({
  gamePath: z.string(),
  configuredGamePath: z.string(),
})

export const advertisedSceneViewSchema = z.object({
  gamePath: z.string(),
  revision: z.string(),
  scene: definition,
  diagnostics: z.array(diagnosticSchema),
})

export const appliedChangeSchema = projectViewSchema.extend({
  changedFiles: z.array(z.string()),
  summary: z.string(),
})

export const toolErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  status: z.number().optional(),
  diagnostics: z.array(diagnosticSchema),
  outcome: z.enum(['not_applied', 'unknown']),
  recovery: z.string(),
})

export const gameSummarySchema = projectViewSchema.extend({
  gamePath: z.string(),
  scenes: z.array(
    z.object({
      id: sceneSchema.shape.id,
      title: sceneSchema.shape.title,
      type: sceneSchema.shape.type,
      screen: sceneSchema.shape.screen,
    }),
  ),
})

export const changeSummarySchema = appliedChangeSchema
  .pick({
    revision: true,
    changedFiles: true,
    summary: true,
    diagnostics: true,
  })
  .extend({ gamePath: z.string() })

export const historyResultSchema = projectViewSchema
  .pick({ revision: true, history: true, diagnostics: true })
  .extend({ gamePath: z.string(), direction: z.enum(['undo', 'redo']) })

export function resultSchema<T extends z.ZodType>(data: T) {
  return z.object({ ok: z.boolean(), data: data.optional(), error: toolErrorSchema.optional() })
}
