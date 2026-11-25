import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { request } from 'node:http'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build, createServer, preview, type ViteDevServer } from 'vite-plus'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test'
import { gameFilesPlugin, previewGameFilesPlugin } from '../apps/engine/tooling/gameFiles.js'
import { engineRuntimeConfigPlugin, loadEngineConfig } from '../apps/engine/tooling/config.js'
import { ContainerBuilder } from '../apps/engine/src/ioc/containerBuilder.js'
import { HttpGameResources } from '../apps/engine/src/gameResources.js'
import { loadRuntimeConfig } from '../apps/engine/src/config.js'

function gameDefinition(title: string) {
  return {
    'schema-version': '1.0.0' as const,
    id: 'test-game',
    title,
    description: 'Test game',
    version: '1.0.0',
    scenes: Array<string>(),
  }
}

function gameData(title: string) {
  return {
    saveCompatibility: expect.stringMatching(/^gameplay-v1:[a-f0-9]{16}$/),
    id: 'test-game',
    title,
    description: 'Test game',
    version: '1.0.0',
    scenes: new Map(),
  }
}

describe('engine development game files', () => {
  let temp: string
  let app: string
  let games: string
  let origin: string
  let server: ViteDevServer
  const game = gameDefinition('Development game')
  const bytes = new Uint8Array([0, 255, 128, 42])

  beforeAll(async () => {
    temp = await mkdtemp(fileURLToPath(new URL('./.tmp-engine-dev-', import.meta.url)))
    app = join(temp, 'app')
    games = join(temp, 'games')
    const myGames = join(temp, 'my-games')
    await mkdir(app)
    await mkdir(join(myGames, 'basic'), { recursive: true })
    await writeFile(join(myGames, 'basic/game.json'), JSON.stringify(gameDefinition('My game')))
    await mkdir(join(games, 'basic/assets'), { recursive: true })
    await mkdir(join(games, 'basic/.git'))
    await writeFile(join(app, 'index.html'), '<!doctype html><title>Engine fallback</title>')
    await writeFile(join(games, 'basic/game.json'), JSON.stringify(game))
    await writeFile(join(games, 'basic/assets/my sprite.png'), bytes)
    await writeFile(join(games, 'basic/.env'), 'PRIVATE_SETTING=value')
    await writeFile(join(games, 'basic/.git/config'), 'private metadata')
    await writeFile(join(temp, 'outside.txt'), 'outside the game directory')
    await symlink(
      app,
      join(games, 'basic/linked'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    const configFile = pathToFileURL(join(app, 'config.json'))
    await writeFile(
      configFile,
      JSON.stringify({
        gameUrl: './library/demos/basic/',
        gameMounts: {
          '/library/': '../my-games',
          '/library/demos/': '../games',
          '/sample-games/': games,
          '/my-games/': myGames,
        },
      }),
    )
    const config = loadEngineConfig(configFile, {})
    server = await createServer({
      configFile: false,
      root: app,
      base: '/nested/',
      logLevel: 'silent',
      plugins: [gameFilesPlugin(config.gameMounts), engineRuntimeConfigPlugin(config.gameUrl)],
      server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false },
    })
    await server.listen()
    const address = server.httpServer?.address()

    if (!address || typeof address === 'string')
      throw new Error('The development server has no TCP address')
    origin = `http://127.0.0.1:${address.port}`
  })

  afterAll(async () => {
    await server.close()
    await rm(temp, { recursive: true, force: true })
  })

  it('serves actual JSON and starts the engine from the development game directory', async () => {
    const response = await fetch(`${origin}/nested/library/demos/basic/game.json`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual(game)

    const applicationUrl = `${origin}/nested/`
    const config = await loadRuntimeConfig(applicationUrl, fetch)
    const mount = vi.fn(() => () => {})

    const container = new ContainerBuilder(
      config,
      applicationUrl,
      fetch,
      { mount },
      {
        clock: { now: () => 0 },
        scheduler: { schedule: () => () => {} },
      },
    ).build()

    const engine = container.resolve('engine')
    await engine.start()
    expect(engine.state).toBe('running')
    expect(mount).toHaveBeenCalledExactlyOnceWith(gameData('Development game'), {
      input: undefined,
      messages: expect.anything(),
      timers: expect.anything(),
      prepareMenu: expect.any(Function),
      actions: undefined,
      lifecycle: expect.anything(),
    })
    engine.stop()
  })

  it('also supports an absolute /sample-games/ URL with a nested engine base', async () => {
    const response = await fetch(`${origin}/sample-games/basic/game.json`)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(game)
  })

  it.each(['/my-games/', '/nested/my-games/', '/library/', '/nested/library/'])(
    'serves a personal game from %s',
    async (mount) => {
      const response = await fetch(`${origin}${mount}basic/game.json`)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual(gameDefinition('My game'))
    },
  )

  it('serves binary assets, content types, and HEAD requests', async () => {
    const url = `${origin}/nested/sample-games/basic/assets/my%20sprite.png`
    const response = await fetch(url)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes)
    const head = await fetch(url, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(head.headers.get('content-length')).toBe(String(bytes.length))
    expect(await head.text()).toBe('')
  })

  it('routes dotted siblings to the app or the enclosing game mount', async () => {
    await writeFile(join(app, 'library.txt'), 'app asset')
    await writeFile(join(temp, 'my-games/demos.txt'), 'parent mount asset')

    for (const [path, contents] of [
      ['/nested/library.txt', 'app asset'],
      ['/library/demos.txt', 'parent mount asset'],
      ['/nested/library/demos.txt', 'parent mount asset'],
    ]) {
      const response = await fetch(origin + path)
      expect(response.status).toBe(200)
      expect(await response.text()).toBe(contents)
    }
  })

  it('serves distinct literal filenames with reserved characters through the game resource loader', async () => {
    const resources = new HttpGameResources('./sample-games/basic/', `${origin}/nested/`, fetch)
    const files = ['review#art.svg', 'review%23art.svg', '100%.svg', 'literal%2f.svg']

    for (const name of files)
      await writeFile(join(games, 'basic/assets', name), `<svg><!--${name}--></svg>`)

    for (const name of files)
      expect(await resources.readText(`assets/${name}`)).toBe(`<svg><!--${name}--></svg>`)
    const url = `${origin}/nested/sample-games/basic/assets/review%23art.svg?rev=1`
    const head = await fetch(url, { method: 'HEAD' })
    expect(head.headers.get('content-type')).toBe('image/svg+xml')
    const partial = await fetch(url, { headers: { Range: 'bytes=0-3' } })
    expect(partial.status).toBe(206)
    expect(await partial.text()).toBe('<svg')
  })

  it.each(['missing/game.json', 'basic/missing.json', 'basic/assets/missing.png', 'basic/assets/'])(
    'returns a real 404 rather than HTML for %s',
    async (path) => {
      const response = await fetch(`${origin}/nested/sample-games/${path}`)
      expect(response.status).toBe(404)
      expect(response.headers.get('content-type')).toContain('application/json')
      await expect(response.json()).resolves.toEqual({ error: 'Game resource not found' })
    },
  )

  it.each([
    'basic/.env',
    'basic/.ENV',
    'basic/.git/config',
    'basic/.git./config',
    'basic/.git%20/config',
    'basic/linked/index.html',
    'basic/assets%2fmy%20sprite.png',
  ])('rejects inaccessible source content %s', async (path) => {
    const response = await fetch(`${origin}/nested/sample-games/${path}`)
    expect(response.status).toBe(403)
    const body = await response.text()
    expect(body).not.toContain(temp)
    expect(body).not.toContain('PRIVATE_SETTING')
  })

  it.each([
    '../outside.txt',
    '%2e%2e/outside.txt',
    'basic/../../outside.txt',
    'basic%5coutside.txt',
  ])('rejects raw traversal path %s before normalization', async (path) => {
    const result = await new Promise<{ status: number | undefined; body: string }>(
      (resolve, reject) => {
        const pending = request(origin, { path: `/nested/sample-games/${path}` }, (response) => {
          let body = ''
          response.setEncoding('utf8')
          response.on('data', (chunk: string) => {
            body += chunk
          })
          response.on('end', () => resolve({ status: response.statusCode, body }))
        })

        pending.on('error', reject)
        pending.end()
      },
    )

    expect(result.status).toBe(403)
    expect(result.body).not.toContain('outside the game directory')
  })

  it('rejects unsupported methods and malformed escapes', async () => {
    const unsupported = await fetch(`${origin}/nested/sample-games/basic/game.json`, {
      method: 'POST',
    })

    expect(unsupported.status).toBe(405)
    expect(unsupported.headers.get('allow')).toBe('GET, HEAD')
    const malformed = await fetch(`${origin}/nested/sample-games/basic/%invalid`)
    expect(malformed.status).toBe(400)
  })

  it('reads the latest saved contents without restarting', async () => {
    await writeFile(join(games, 'basic/game.json'), '{"title":"Updated game"}')
    const response = await fetch(`${origin}/nested/sample-games/basic/game.json`)
    await expect(response.json()).resolves.toEqual({ title: 'Updated game' })
  })

  it('keeps the local source route out of production builds', async () => {
    await build({
      configFile: false,
      root: app,
      logLevel: 'silent',
      plugins: [gameFilesPlugin({ '/sample-games/': games })],
    })
    await expect(readFile(join(app, 'dist/sample-games/basic/game.json'))).rejects.toHaveProperty(
      'code',
      'ENOENT',
    )
  })

  it('serves literal reserved filenames from an exported game in Vite preview', async () => {
    const outDir = join(temp, 'preview-export')
    await mkdir(join(outDir, 'game'), { recursive: true })
    await writeFile(join(outDir, 'index.html'), '<!doctype html><title>Engine</title>')
    await writeFile(join(outDir, 'game/scene#1.txt'), 'literal hash')
    await writeFile(join(outDir, 'game/scene%231.txt'), 'literal percent')

    const exported = await preview({
      configFile: false,
      root: app,
      base: '/export/',
      logLevel: 'silent',
      build: { outDir },
      plugins: [previewGameFilesPlugin()],
      preview: { host: '127.0.0.1', port: 0, strictPort: true },
    })

    try {
      const address = exported.httpServer.address()

      if (!address || typeof address === 'string') throw new Error('Expected a TCP address')

      const resources = new HttpGameResources(
        './game/',
        `http://127.0.0.1:${address.port}/export/`,
        fetch,
      )

      await expect(resources.readText('scene#1.txt')).resolves.toBe('literal hash')
      await expect(resources.readText('scene%231.txt')).resolves.toBe('literal percent')
    } finally {
      await exported.close()
    }
  })
})
