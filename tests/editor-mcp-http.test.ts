import { once } from 'node:events'
import { createRequire } from 'node:module'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { request, type Server } from 'node:http'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createAdapterServer } from '../apps/editor-mcp/src/adapter.js'
import { parseHttpAdapterConfig } from '../apps/editor-mcp/src/httpConfig.js'
import { createHttpAdapter } from '../apps/editor-mcp/src/httpServer.js'
import { gameSummarySchema } from '../apps/editor-mcp/src/protocol.js'
import { maxMcpMessageBytes } from '../apps/editor-mcp/src/operationSupport.js'
import { object } from '@ancadeba/editor-core'
import { FileWorkspace } from '../apps/editor-server/src/workspace.js'
import { EditorCoordinator } from '../apps/editor-server/src/editorCoordinator.js'
import { WorkspaceProjectRepository } from '../apps/editor-server/src/editorProjectRepository.js'
import { EditorProjectService } from '../apps/editor-server/src/editorProjectService.js'
import { createEditorServer } from '../apps/editor-server/src/server.js'
import { WorkspaceGameExporter } from '../apps/editor-server/src/gameExports.js'
import { writeGameArchive } from '../apps/editor-server/src/gameArchive.js'

const origin = 'http://localhost:8081'
const args = ['--editor-server-url', 'http://127.0.0.1:3100', '--game', 'basic']
const loader = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const entry = fileURLToPath(new URL('../apps/editor-mcp/src/httpMain.ts', import.meta.url))

function baseUrl(server: Server) {
  const address = server.address()

  if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server')

  return `http://127.0.0.1:${address.port}`
}

describe('MCP HTTP configuration', () => {
  it('shares adapter options, defaults to a separate port, and allows exact browser origins', () => {
    expect(parseHttpAdapterConfig(args)).toEqual({
      editorServerUrl: 'http://127.0.0.1:3100',
      game: 'basic',
      timeoutMs: 10000,
      port: 3101,
      allowedOrigins: [],
    })
    expect(
      parseHttpAdapterConfig([
        ...args,
        '--port',
        '3201',
        '--allowed-origin',
        origin + '/',
        '--allowed-origin',
        origin,
        '--allowed-origin',
        'http://127.0.0.1:8081',
        '--timeout-ms',
        '250',
      ]),
    ).toMatchObject({
      port: 3201,
      timeoutMs: 250,
      allowedOrigins: [origin, 'http://127.0.0.1:8081'],
    })
    expect(parseHttpAdapterConfig([...args.slice(0, -1), '']).game).toBe('')
  })

  it.each(['0', '-1', '65536', '1.5', 'NaN'])('rejects invalid listening port %s', (port) => {
    expect(() => parseHttpAdapterConfig([...args, '--port=' + port])).toThrow('Port')
  })

  it.each([
    '*',
    'null',
    'file:///tmp',
    'http://user:secret@localhost:8081',
    origin + '/path',
    origin + '?query=1',
    origin + '#fragment',
  ])('rejects non-origin browser configuration %s', (value) => {
    expect(() => parseHttpAdapterConfig([...args, '--allowed-origin', value])).toThrow()
  })

  it('rejects unsupported common options and missing bindings', () => {
    expect(() => parseHttpAdapterConfig([])).toThrow('required')
    expect(() => parseHttpAdapterConfig([...args, '--host', '0.0.0.0'])).toThrow()
    expect(() =>
      parseHttpAdapterConfig(['--editor-server-url', 'http://example.com', '--game', 'basic']),
    ).toThrow('loopback')
  })
})

describe('MCP Streamable HTTP', () => {
  let root: string
  let editor: Server
  let adapter: ReturnType<typeof createHttpAdapter>
  let editorUrl: string
  let url: string
  let errors: unknown[]
  let signals: AbortSignal[]
  const connections: { client: Client; transport: StreamableHTTPClientTransport }[] = []

  beforeEach(async () => {
    root = await mkdtemp(fileURLToPath(new URL('./.tmp-mcp-http-', import.meta.url)))
    errors = []
    signals = []

    for (const game of ['basic', 'other']) {
      await mkdir(join(root, game))
      await writeFile(
        join(root, game, 'game.json'),
        JSON.stringify({
          'schema-version': '1.0.0',
          id: game,
          title: game,
          description: '',
          version: '1',
          scenes: [],
        }),
      )
    }

    const workspace = await FileWorkspace.open(root)
    editor = createEditorServer(
      { workFolder: root, host: '127.0.0.1', port: 3100 },
      workspace,
      new WorkspaceGameExporter(
        workspace,
        async (source, output) => {
          await mkdir(output)
          await writeFile(join(output, 'game.json'), await readFile(join(source, 'game.json')))
        },
        writeGameArchive,
        root,
      ),
      new EditorProjectService(new WorkspaceProjectRepository(workspace), new EditorCoordinator()),
    )
    editor.listen(0, '127.0.0.1')
    await once(editor, 'listening')
    editorUrl = baseUrl(editor)
    adapter = createHttpAdapter(
      { allowedOrigins: [origin] },
      (signal) => {
        signals.push(signal)

        return createAdapterServer(
          { editorServerUrl: editorUrl, game: 'basic', timeoutMs: 2000 },
          fetch,
          signal,
        )
      },
      (error) => errors.push(error),
    )
    adapter.server.listen(0, '127.0.0.1')
    await once(adapter.server, 'listening')
    url = baseUrl(adapter.server) + '/mcp'
  })

  afterEach(async () => {
    for (const connection of connections.splice(0)) await connection.client.close()
    await adapter.close()
    await new Promise<void>((resolve, reject) =>
      editor.close((error) => (error ? reject(error) : resolve())),
    )
    await rm(root, { recursive: true, force: true })
    expect(errors).toEqual([])
  })

  async function connect() {
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers: { Origin: origin } },
    })

    const client = new Client({ name: 'http-tests', version: '1' })
    connections.push({ client, transport })
    await client.connect(transport)

    return { client, transport }
  }

  it('discovers the shared tools and preserves isolated project selections across HTTP requests', async () => {
    const first = await connect()
    const second = await connect()
    expect((await first.client.listTools()).tools).toHaveLength(25)
    expect(first.transport.sessionId).toBeTruthy()
    expect(first.transport.sessionId).not.toBe(second.transport.sessionId)
    await first.client.callTool({ name: 'ancadeba_switch_project', arguments: { path: 'other' } })

    const inspected = await first.client.callTool({ name: 'ancadeba_inspect_game', arguments: {} })
    const selected = gameSummarySchema.parse(object(inspected.structuredContent).data)
    expect(selected).toMatchObject({ gamePath: 'other', game: { title: 'other' } })
    expect(
      (await second.client.callTool({ name: 'ancadeba_inspect_game', arguments: {} }))
        .structuredContent,
    ).toMatchObject({ data: { gamePath: 'basic', game: { title: 'basic' } } })

    const edit = {
      expectedRevision: selected.revision,
      title: 'Saved over HTTP',
      description: 'Shared editor commands',
      version: '2',
    }

    expect(
      (await first.client.callTool({ name: 'ancadeba_update_game_metadata', arguments: edit }))
        .isError,
    ).toBe(false)
    expect(JSON.parse(await readFile(join(root, 'other/game.json'), 'utf8')).title).toBe(
      'Saved over HTTP',
    )
    expect(
      (await first.client.callTool({ name: 'ancadeba_update_game_metadata', arguments: edit }))
        .isError,
    ).toBe(true)
    expect(JSON.parse(await readFile(join(root, 'basic/game.json'), 'utf8')).title).toBe('basic')
  })

  it('allows browser preflights and exposes the session header without enabling a proxy', async () => {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,mcp-session-id,mcp-protocol-version',
      },
    })

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe(origin)
    expect(response.headers.get('access-control-allow-methods')).toContain('DELETE')
    expect(response.headers.get('access-control-allow-headers')).toContain('MCP-Session-Id')
    expect(response.headers.get('access-control-expose-headers')).toContain('MCP-Session-Id')
    expect(signals).toHaveLength(0)
  })

  it('rejects unlisted origins and hostile Host headers before creating sessions', async () => {
    expect(
      (await fetch(url, { method: 'POST', headers: { Origin: 'http://localhost:8082' } })).status,
    ).toBe(403)
    expect((await fetch(url, { headers: { Origin: 'https://example.com' } })).status).toBe(403)

    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(url, { headers: { Host: 'attacker.example' } }, (response) => {
        response.resume()
        resolve(response.statusCode)
      })

      req.on('error', reject)
      req.end()
    })

    expect(status).toBe(403)
    expect(signals).toHaveLength(0)
  })

  it('handles invalid requests and removes uninitialized sessions', async () => {
    expect((await fetch(url.replace('/mcp', '/other'))).status).toBe(404)
    expect((await fetch(url, { method: 'PUT' })).status).toBe(405)
    expect((await fetch(url)).status).toBe(400)

    const malformed = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: '{',
    })

    expect(malformed.status).toBe(400)
    expect(signals).toHaveLength(1)
    expect(signals[0]?.aborted).toBe(true)
    expect((await fetch(url, { headers: { 'MCP-Session-Id': 'unknown' } })).status).toBe(404)
    expect((await connect()).transport.sessionId).toBeTruthy()
  })

  it('terminates only the selected HTTP session and aborts its API requests', async () => {
    const first = await connect()
    const second = await connect()
    const id = first.transport.sessionId!
    const response = await fetch(url, { method: 'DELETE', headers: { 'MCP-Session-Id': id } })
    expect(response.status).toBe(200)
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    expect((await fetch(url, { headers: { 'MCP-Session-Id': id } })).status).toBe(404)
    expect((await second.client.listTools()).tools).toHaveLength(25)
  })

  it('accepts image uploads larger than the SDK default HTTP body limit', async () => {
    const { client } = await connect()
    const inspection = await client.callTool({ name: 'ancadeba_inspect_game', arguments: {} })
    const before = gameSummarySchema.parse(object(inspection.structuredContent).data)

    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><!--' +
      'x'.repeat(4 * 1024 * 1024) +
      '--></svg>'

    const uploaded = await client.callTool({
      name: 'ancadeba_upload_asset',
      arguments: {
        expectedRevision: before.revision,
        id: 'http-art',
        format: 'svg',
        dataBase64: Buffer.from(svg).toString('base64'),
      },
    })

    expect(uploaded.isError).toBe(false)
    const inspected = await client.callTool({ name: 'ancadeba_inspect_game', arguments: {} })
    const saved = gameSummarySchema.parse(object(inspected.structuredContent).data)
    expect(
      await readFile(join(root, 'basic', saved.assets!.images['http-art']!.source), 'utf8'),
    ).toBe(svg)

    const oversized = await fetch(url, {
      method: 'POST',
      headers: {
        'MCP-Session-Id': (await connect()).transport.sessionId!,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: 'x'.repeat(maxMcpMessageBytes + 1),
    })

    expect(oversized.status).toBe(413)
  })

  it('closes active sessions and releases its listener on shutdown', async () => {
    await connect()
    await connect()
    await adapter.close()
    await adapter.close()
    expect(signals.every((signal) => signal.aborted)).toBe(true)
    expect(adapter.server.listening).toBe(false)
  })

  it('launches the standalone HTTP wrapper from an unrelated directory and reports startup errors', async () => {
    // The test listener reserves a free port until just before the child binds it.
    const port = new URL(url).port
    await adapter.close()

    const child = spawn(
      process.execPath,
      [
        '--import',
        loader,
        entry,
        '--editor-server-url',
        editorUrl,
        '--game',
        'basic',
        '--port',
        port,
        '--allowed-origin',
        origin,
      ],
      { cwd: root, stdio: 'pipe' },
    )

    const exited = once(child, 'exit')
    const stdout: string[] = []
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk.toString('utf8')))

    try {
      const [ready] = await once(child.stderr, 'data')
      expect(String(ready)).toContain('Ancadeba MCP listening')
      expect((await (await connect()).client.listTools()).tools).toHaveLength(25)
      expect(stdout).toEqual([])
    } finally {
      child.kill()
      await exited
    }

    const run = promisify(execFile)
    const help = await run(process.execPath, ['--import', loader, entry, '--help'], { cwd: root })
    expect(help.stdout).toBe('')
    expect(help.stderr).toContain('Streamable HTTP')
    await expect(
      run(process.execPath, ['--import', loader, entry], { cwd: root }),
    ).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('required') })
  })
})
