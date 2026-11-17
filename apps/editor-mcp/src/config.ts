import { parseArgs } from 'node:util'
import { workspaceProjectPathSchema } from './projectPath.js'

export interface AdapterConfig {
  editorServerUrl: string
  game: string | null
  timeoutMs: number
}

export const gameUsage =
  'Omit --game to start without a selection. Call ancadeba_list_projects, then ancadeba_switch_project before editing. Use --game "" to select the workspace root.'

export const usage =
  'Usage: node apps/editor-mcp/dist/main.js --editor-server-url http://127.0.0.1:3100 [--game basic] [--timeout-ms 10000]\n' +
  gameUsage +
  ' Start the editor server separately.'

export const adapterOptions = {
  'editor-server-url': { type: 'string' as const },
  game: { type: 'string' as const },
  'timeout-ms': { type: 'string' as const, default: '10000' },
}

export function parseAdapterConfig(args: string[]): AdapterConfig {
  const { values } = parseArgs({
    args,
    strict: true,
    allowPositionals: false,
    options: adapterOptions,
  })

  return adapterConfigFromValues(values)
}

export function adapterConfigFromValues(values: {
  'editor-server-url'?: string | undefined
  game?: string | undefined
  'timeout-ms'?: string | undefined
}): AdapterConfig {
  if (values['editor-server-url'] === undefined) {
    throw new Error('--editor-server-url is required')
  }

  const url = new URL(values['editor-server-url'])

  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Editor server URL must be a loopback HTTP origin without credentials, path, query, or fragment',
    )
  }

  const game = values.game ?? null

  if (game !== null && !workspaceProjectPathSchema.safeParse(game).success) {
    throw new Error(
      'Game must be a workspace-relative folder using / separators, or empty for the root',
    )
  }

  const timeoutMs = Number(values['timeout-ms'])

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new Error('Timeout must be an integer between 1 and 60000 milliseconds')
  }

  return { editorServerUrl: url.origin, game, timeoutMs }
}
