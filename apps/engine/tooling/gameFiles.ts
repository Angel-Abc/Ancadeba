import { lstat, open, realpath } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { lookup } from 'mrmime'
import type { Plugin } from 'vite-plus'

const sampleGamesDirectory = fileURLToPath(new URL('../../../sample-games/', import.meta.url))
const excludedNames = new Set(['.git', '.hg', '.svn', 'node_modules', '.ds_store', 'thumbs.db'])

class GameFileError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

function within(root: string, target: string): boolean {
  const path = relative(root, target)

  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))
}

async function checkFile(directory: string, url: string): Promise<string> {
  const path = (url.split('?')[0] ?? '').replace(/^\//, '')

  if (!path || path.endsWith('/')) throw new GameFileError(404, 'Game resource not found')
  let parts: string[]

  try {
    parts = path.split('/').map(decodeURIComponent)
  } catch {
    throw new GameFileError(400, 'Invalid game resource path')
  }

  if (
    parts.some((part) => {
      const name = part.toLowerCase()

      return (
        !part ||
        /[/\\:]/.test(part) ||
        Array.from(part).some((character) => character.charCodeAt(0) < 32) ||
        name === '.' ||
        name === '..' ||
        /[. ]$/.test(part) ||
        excludedNames.has(name) ||
        name === '.env' ||
        name.startsWith('.env.')
      )
    })
  ) {
    throw new GameFileError(403, 'Game resource path is not accessible')
  }

  const rootInfo = await lstat(directory)

  if (rootInfo.isSymbolicLink()) throw new GameFileError(403, 'Links are not accessible')

  if (!rootInfo.isDirectory()) throw new GameFileError(404, 'Game resource not found')
  const root = await realpath(directory)
  let target = root

  for (const [index, part] of parts.entries()) {
    target = resolve(target, part)
    const info = await lstat(target)

    if (info.isSymbolicLink()) throw new GameFileError(403, 'Links are not accessible')
    target = await realpath(target)

    if (!within(root, target)) throw new GameFileError(403, 'Game resource path is not accessible')

    if (index === parts.length - 1 ? !info.isFile() : !info.isDirectory()) {
      throw new GameFileError(404, 'Game resource not found')
    }
  }

  return target
}

/** Stream from the checked filename so reserved URL characters are interpreted only once. */
async function serveFile(
  path: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const file = await open(path, 'r')

  try {
    const { size, mtime } = await file.stat()
    const encoding = path.endsWith('.gz') ? 'gzip' : path.endsWith('.br') ? 'br' : undefined
    const type = lookup(encoding ? path.slice(0, -3) : path) ?? 'application/octet-stream'
    response.setHeader('Content-Type', type === 'text/html' ? 'text/html;charset=utf-8' : type)

    if (encoding) response.setHeader('Content-Encoding', encoding)
    response.setHeader('Last-Modified', mtime.toUTCString())
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Accept-Ranges', 'bytes')

    let start = 0
    let end = size - 1
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '')

    if (range && (range[1] || range[2])) {
      start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))

      if (range[1] && range[2]) end = Math.min(end, Number(range[2]))

      if (start > end) {
        response.writeHead(416, { 'Content-Range': `bytes */${size}` })
        response.end()

        return
      }

      response.statusCode = 206
      response.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
    }

    response.setHeader('Content-Length', end - start + 1)

    if (request.method === 'HEAD' || size === 0) response.end()
    else await pipeline(file.createReadStream({ start, end }), response)
  } finally {
    await file.close()
  }
}

function failure(response: ServerResponse, error: unknown): void {
  if (response.headersSent || response.destroyed) {
    response.destroy()

    return
  }

  const code = error instanceof Error && 'code' in error ? error.code : undefined

  const status =
    error instanceof GameFileError
      ? error.status
      : code === 'ENOENT' || code === 'ENOTDIR'
        ? 404
        : code === 'EACCES' || code === 'EPERM'
          ? 403
          : 500

  const message =
    error instanceof GameFileError
      ? error.message
      : status === 404
        ? 'Game resource not found'
        : 'Game resource unavailable'

  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify({ error: message }))
}

export function gameFilesPlugin(directory = sampleGamesDirectory): Plugin {
  const root = resolve(directory)

  return {
    name: 'engine-local-game-files',
    apply: 'serve',
    configureServer(server) {
      const mounts = new Set(['/sample-games/', `${server.config.base}sample-games/`])

      for (const mount of mounts) {
        server.middlewares.use(mount, (request, response) => {
          if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.setHeader('Allow', 'GET, HEAD')
            failure(response, new GameFileError(405, 'Method not allowed'))

            return
          }

          void checkFile(root, request.url ?? '')
            .then((path) => serveFile(path, request, response))
            .catch((error: unknown) => failure(response, error))
        })
      }
    },
  }
}
