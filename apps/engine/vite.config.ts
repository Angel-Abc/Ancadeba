import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '')
  const gameDir = env.GAME_DIR

  if (!gameDir) {
    throw new Error('GAME_DIR env variable is not set')
  }

  const sourcePath = path.isAbsolute(gameDir)
    ? gameDir
    : path.resolve(repoRoot, gameDir)

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Configured game directory at ${sourcePath} does not exist`)
  }

  const relativeGameDir = path.relative(__dirname, sourcePath)
  const normalizedGameDir = relativeGameDir.split(path.sep).join('/')
  const gameDirPrefix = normalizedGameDir.endsWith('/')
    ? normalizedGameDir.slice(0, -1)
    : normalizedGameDir
  const sourcePattern = `${gameDirPrefix}/**/*`

  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: sourcePattern,
            dest: 'data',
            rename: (_name, _ext, fullPath) => {
              const relativePath = path.relative(sourcePath, fullPath).split(path.sep).join('/')

              return relativePath || _name
            }
          }
        ]
      })
    ]
  }
})

