import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { expect, it } from 'vite-plus/test'

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
