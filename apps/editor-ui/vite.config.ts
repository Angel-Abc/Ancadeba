import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

type Tsconfig = {
  compilerOptions?: {
    paths?: Record<string, string[]>
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const tsconfigPath = path.resolve(repoRoot, 'tsconfig.base.json')

const trimStarSuffix = (value: string) => value.endsWith('/*') ? value.slice(0, -2) : value

const loadTsconfigAliases = (): Record<string, string> => {
  if (!fs.existsSync(tsconfigPath)) {
    return {}
  }

  const source = fs.readFileSync(tsconfigPath, 'utf8')
  const config = JSON.parse(source) as Tsconfig
  const paths = config.compilerOptions?.paths ?? {}

  return Object.entries(paths).reduce<Record<string, string>>((acc, [key, values]) => {
    const firstPath = values[0]
    if (!firstPath) {
      return acc
    }

    acc[trimStarSuffix(key)] = path.resolve(repoRoot, trimStarSuffix(firstPath))
    return acc
  }, {})
}

const alias = loadTsconfigAliases()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '')
  const editorServerPort = env.VITE_EDITOR_SERVER_PORT ?? env.PORT ?? '3001'

  return {
    envDir: repoRoot,
    plugins: [react()],
    resolve: {
      alias
    },
    define: {
      'import.meta.env.VITE_EDITOR_SERVER_PORT': JSON.stringify(editorServerPort)
    }
  }
})
