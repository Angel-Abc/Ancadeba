import {
  capabilities,
  commandRequestSchema,
  commandSchema,
  type EditorCommand,
} from '@ancadeba/editor-core'
import { z } from 'zod'
import { EditorApiError } from './editorApiError.js'
import { mcpOperations, type editorFeaturesSchema } from './operationSupport.js'

export const commandTool = 'ancadeba_apply_command'
export const commandSchemaTool = 'ancadeba_get_command_schema'

type CommandType = EditorCommand['type']

export const commandTypes: CommandType[] = commandSchema.options.map(
  (option) => option.shape.type.value,
)

/** Resolve aliases by command name so adding or reordering commands cannot change their meaning. */
export function schemaFor<T extends CommandType>(type: T) {
  const schema = commandSchema.options.find(
    (
      option,
    ): option is Extract<
      (typeof commandSchema.options)[number],
      { shape: { type: z.ZodLiteral<T> } }
    > => option.shape.type.value === type,
  )

  if (!schema) throw new Error(`Missing editor command schema: ${type}`)

  return schema
}

/**
 * Advertise only the command envelope and its type names. Complete command schemas are large,
 * so agents fetch one at a time and handlers validate the full command before dispatch.
 */
export function commandEnvelopeSchema(types: readonly string[]) {
  const [first, ...rest] = types

  return z.strictObject({
    expectedRevision: commandRequestSchema.shape.expectedRevision,
    command: first === undefined ? z.never() : z.looseObject({ type: z.enum([first, ...rest]) }),
  })
}

export const mcpCommandInputSchema = commandEnvelopeSchema(commandTypes)

/** Validate a complete command locally, reporting property paths relative to the tool arguments. */
export function parseCommand(
  input: unknown,
  types: readonly string[] = commandTypes,
): EditorCommand {
  const parsed = commandSchema.safeParse(input)

  if (parsed.success && types.includes(parsed.data.type)) return parsed.data

  throw new EditorApiError(
    'invalid_request',
    'Invalid editing request',
    parsed.success
      ? [
          {
            code: 'invalid_request',
            file: '',
            path: ['command', 'type'],
            message: `Use one of: ${types.join(', ')}`,
          },
        ]
      : parsed.error.issues.map((issue) => ({
          code: 'invalid_request',
          file: '',
          path: [
            'command',
            ...issue.path.map((part) => (typeof part === 'number' ? part : String(part))),
          ],
          message: issue.message,
        })),
  )
}

/** Describe one complete command, sharing repeated sub-schemas through JSON Schema references. */
export function commandDetail(type: CommandType) {
  return {
    type,
    commandTool,
    schema: z.toJSONSchema(schemaFor(type), { io: 'input', reused: 'ref' }),
    example: capabilities.commands.find((command) => command.type === type)?.example ?? { type },
  }
}

/** Advertise locally understood commands that the connected server currently supports. */
export function mcpCapabilities(remote: {
  version: number
  commands: { type: string }[]
  features?: z.infer<typeof editorFeaturesSchema> | undefined
}) {
  const supported = new Set(remote.commands.map(({ type }) => type))

  return {
    version: remote.version,
    commandTool,
    commandSchemaTool,
    requestSchema: z.toJSONSchema(
      commandEnvelopeSchema(commandTypes.filter((type) => supported.has(type))),
    ),
    commands: capabilities.commands.filter(({ type }) => supported.has(type)),
    ...(remote.features ? { features: remote.features } : {}),
    operations: mcpOperations(remote.features),
  }
}
