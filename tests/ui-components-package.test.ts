import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { createServer, normalizePath } from 'vite-plus'
import { expect, it } from 'vite-plus/test'

it('serves the save slots renderer from source during browser development', async () => {
  const root = fileURLToPath(new URL('../apps/engine/', import.meta.url))
  const source = fileURLToPath(new URL('../packages/ui-components/src/', import.meta.url))
  const cacheDir = await mkdtemp(join(tmpdir(), 'ancadeba-ui-dev-'))

  const server = await createServer({
    root,
    configFile: false,
    cacheDir,
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })

  try {
    const client = server.environments.client

    const entry = await client.pluginContainer.resolveId(
      '@ancadeba/ui-components',
      join(root, 'src/main.ts'),
    )

    expect(entry?.id).toBe(normalizePath(join(source, 'index.ts')))

    const renderer = await client.pluginContainer.resolveId(
      './saveSlotsComponentRenderer.js',
      entry!.id,
    )

    expect(renderer?.id).toBe(normalizePath(join(source, 'saveSlotsComponentRenderer.ts')))
    const transformed = await client.transformRequest('/@fs/' + renderer!.id)
    expect(transformed?.code).toContain('export class SaveSlotsComponentRenderer')
  } finally {
    await server.close()
    await rm(cacheDir, { recursive: true, force: true })
  }
})

it('loads the built UI package and resolves its public type dependencies in isolation', async () => {
  const source = fileURLToPath(new URL('../packages/ui-components/', import.meta.url))
  const temp = await mkdtemp(join(tmpdir(), 'ancadeba-ui-package-'))

  try {
    const installed = join(temp, 'node_modules/@ancadeba/ui-components')
    await mkdir(installed, { recursive: true })
    await cp(join(source, 'dist'), join(installed, 'dist'), { recursive: true })
    await cp(join(source, 'package.json'), join(installed, 'package.json'))
    const manifest = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'))

    for (const name of Object.keys(manifest.dependencies)) {
      const local = join(installed, 'node_modules', name)
      await mkdir(dirname(local), { recursive: true })
      await symlink(
        await realpath(join(source, 'node_modules', name)),
        local,
        process.platform === 'win32' ? 'junction' : 'dir',
      )
    }

    const { stdout } = await promisify(execFile)(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { SceneRenderer } from '@ancadeba/ui-components'
         import.meta.resolve('@ancadeba/utilities')
         console.log(typeof SceneRenderer)`,
      ],
      { cwd: installed },
    )

    expect(stdout.trim()).toBe('function')
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})
