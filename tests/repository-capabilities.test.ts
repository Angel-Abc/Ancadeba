import { ProjectArchiveWorkspace } from '../apps/editor-server/src/projectArchiveWorkspace.js'
import { once } from 'node:events'
import { createEditorServer } from '../apps/editor-server/src/server.js'
import { describe, expect, it, vi } from 'vite-plus/test'
import { createStarterProject } from '@ancadeba/editor-core'
import {
  WorkspaceProjectRepository,
  type ProjectWorkspace,
} from '../apps/editor-server/src/editorProjectRepository.js'
import { EditorProjectService } from '../apps/editor-server/src/editorProjectService.js'
import { EditorCoordinator } from '../apps/editor-server/src/editorCoordinator.js'
import { WorkspaceError } from '../apps/editor-server/src/workspace.js'

function fixture(createDirectories = false, removeDirectories = false, moveDirectories = false) {
  const files = new Map<string, Uint8Array>(
    Object.entries(createStarterProject({ path: 'game', title: 'Original', description: '' })).map(
      ([file, value]) => [`game/${file}`, new TextEncoder().encode(JSON.stringify(value))],
    ),
  )

  const write = vi.fn(async (path: string, bytes: Uint8Array) => {
    files.set(path, bytes)

    return true
  })

  const workspace: ProjectWorkspace = {
    list: async (path) => {
      const prefix = path ? `${path}/` : ''
      const entries = new Map<string, 'file' | 'directory'>()

      for (const file of files.keys())
        if (file.startsWith(prefix)) {
          const relative = file.slice(prefix.length)
          entries.set(relative.split('/')[0]!, relative.includes('/') ? 'directory' : 'file')
        }

      if (!entries.size) throw new WorkspaceError(404, 'Missing directory')

      return { entries: [...entries].map(([name, type]) => ({ name, type })) }
    },
    read: async (path) => {
      const bytes = files.get(path)

      if (!bytes) throw new WorkspaceError(404, 'Missing file')

      return bytes
    },
    write,
    create: async (path, bytes) => {
      files.set(path, bytes)
    },
    removeCreated: async (path) => {
      files.delete(path)
    },
    ...(createDirectories ? { createDirectory: vi.fn(async () => {}) } : {}),
    ...(removeDirectories ? { removeDirectory: vi.fn(async () => {}) } : {}),
    ...(moveDirectories ? { moveDirectory: vi.fn(async () => {}) } : {}),
  }

  const repository = new WorkspaceProjectRepository(workspace)

  return {
    files,
    write,
    workspace,
    service: new EditorProjectService(repository, new EditorCoordinator()),
  }
}

describe('explicit repository capabilities', () => {
  it.each(
    Array.from(
      { length: 8 },
      (_, mask) => [Boolean(mask & 1), Boolean(mask & 2), Boolean(mask & 4)] as const,
    ),
  )('derives support from create=%s remove=%s move=%s', (create, remove, move) => {
    const { service } = fixture(create, remove, move)
    expect(service.features).toMatchObject({
      projectCreation: create && remove,
      projectDuplication: create && remove,
      projectImport: create && remove,
      projectRenaming: true,
      projectFolderRenaming: create && remove && move,
      projectDeletion: create && remove && move,
      projectRestoration: create && remove && move,
    })
  })

  it('rejects unsupported directory operations before touching files', async () => {
    const { service, write } = fixture()
    expect(() =>
      service.rename({
        path: 'game',
        expectedRevision: 'revision',
        title: 'Changed',
        folderName: 'other',
      }),
    ).toThrow('Project folder management is unavailable')
    await expect(
      service.delete({ path: 'game', expectedRevision: 'revision', confirm: true }),
    ).rejects.toMatchObject({ code: 'unsupported_project_management' })
    await expect(service.listDeleted()).rejects.toMatchObject({
      code: 'unsupported_project_management',
    })
    await expect(service.create({ path: 'new', title: 'New' })).rejects.toMatchObject({
      code: 'unsupported_creation',
    })
    expect(write).not.toHaveBeenCalled()
  })

  it('retains title-only rename without directory support', async () => {
    const { service } = fixture()
    const source = await service.inspect('game')

    const result = await service.rename({
      path: 'game',
      expectedRevision: source.revision,
      title: 'Renamed',
    })

    expect(result.path).toBe('game')
    expect(result.game?.title).toBe('Renamed')
  })
})

it('advertises the same explicit capabilities over HTTP', async () => {
  const { workspace, service } = fixture()

  const server = createEditorServer(
    { workFolder: process.cwd(), host: '127.0.0.1', port: 3100 },
    workspace,
    undefined,
    service,
  )

  try {
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()

    if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server')
    const response = await fetch(`http://127.0.0.1:${address.port}/api/editor/capabilities`)
    expect(await response.json()).toMatchObject({
      features: {
        projectRenaming: true,
        projectFolderRenaming: false,
        projectDeletion: false,
        projectRestoration: false,
        projectCreation: false,
        projectDuplication: false,
        projectImport: false,
      },
    })
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})

it('does not advertise writes through a read-only archive workspace', () => {
  const repository = new WorkspaceProjectRepository(new ProjectArchiveWorkspace({}))
  expect(repository.capabilities).toMatchObject({
    history: false,
    assetImport: false,
    projectRenaming: false,
    projectRepair: false,
    projectCreation: false,
    projectDeletion: false,
    projectRestoration: false,
    projectExport: true,
  })
})
