import type { AdapterConfig } from './config.js'
import { EditorApiClient } from './editorApiClient.js'
import { createMcpServer } from './mcpServer.js'

/** Both transports create the same tools with an independent project selection. */
export function createAdapterServer(
  config: AdapterConfig,
  fetcher: typeof fetch,
  signal: AbortSignal,
) {
  return createMcpServer(new EditorApiClient(config, fetcher, signal), config.game)
}
