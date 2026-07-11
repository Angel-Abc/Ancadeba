import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import sirv from 'sirv'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

interface GameFile {
  sourcePath: string
  outputPath: string
}

function collectGameFiles(gameDirectory: string): GameFile[] {
  const files: GameFile[] = []

  function visit(directory: string, relativeDirectory: string): void {
    const entries = readdirSync(directory, {
      withFileTypes: true,
    }).sort((left, right) => left.name.localeCompare(right.name))

    for (const entry of entries) {
      const sourcePath = join(directory, entry.name)
      const relativePath = join(relativeDirectory, entry.name)

      if (entry.isDirectory()) {
        visit(sourcePath, relativePath)
        continue
      }

      if (entry.isFile()) {
        files.push({
          sourcePath,
          outputPath: relativePath.split(sep).join('/'),
        })
      }
    }
  }

  visit(gameDirectory, '')

  return files
}

function gameDirectoryPlugin(gameDirectory: string): Plugin {
  return {
    name: 'ancadeba-game-manifest',

    buildStart() {
      for (const file of collectGameFiles(gameDirectory)) {
        this.addWatchFile(file.sourcePath)
      }
    },

    configureServer(server) {
      const serveGame = sirv(gameDirectory, {
        dev: true,
      })

      server.middlewares.use('/game', serveGame)

      server.middlewares.use('/game', (_request, response) => {
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/plain')
        response.end('Game resource not found.')
      })
    },

    generateBundle() {
      for (const file of collectGameFiles(gameDirectory)) {
        this.emitFile({
          type: 'asset',
          fileName: `game/${file.outputPath}`,
          source: readFileSync(file.sourcePath),
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, import.meta.dirname, '')
  const gameName = environment.ANCADEBA_GAME

  if (!gameName) {
    throw new Error('ANCADEBA_GAME is missing. Add it to apps/web/.env.local.')
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gameName)) {
    throw new Error(
      `ANCADEBA_GAME must be a lowercase game name, received: ${gameName}`,
    )
  }

  const gameDirectory = resolve(
    import.meta.dirname,
    '../../games/demos',
    gameName,
  )
  const gameManifest = resolve(gameDirectory, 'game.json')

  if (!existsSync(gameManifest)) {
    throw new Error(`Game manifest does not exist: ${gameManifest}`)
  }

  return {
    plugins: [react(), gameDirectoryPlugin(gameDirectory)],
  }
})
