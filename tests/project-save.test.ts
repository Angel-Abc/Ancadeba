import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { format } from 'vite-plus/fmt'
import { object } from '@ancadeba/editor-core'
import { EditorProjectService } from '../apps/editor-server/src/editorProjectService.js'
import { WorkspaceProjectRepository } from '../apps/editor-server/src/editorProjectRepository.js'
import { EditorCoordinator } from '../apps/editor-server/src/editorCoordinator.js'
import { FileWorkspace } from '../apps/editor-server/src/workspace.js'

describe('project file serialization', () => {
  let root: string
  let repository: WorkspaceProjectRepository

  beforeEach(async () => {
    root = await mkdtemp(fileURLToPath(new URL('./.tmp-project-save-', import.meta.url)))
    repository = new WorkspaceProjectRepository(await FileWorkspace.open(root))
    await new EditorProjectService(repository, new EditorCoordinator()).create({
      path: 'game',
      title: 'Game',
    })
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('creates, duplicates and renames projects using formatter-compatible JSON', async () => {
    const service = new EditorProjectService(repository, new EditorCoordinator())
    const original = await service.inspect('game')

    const copied = await service.duplicate({
      path: 'game',
      destination: 'copy',
      title: 'Copy',
      expectedRevision: original.revision,
    })

    await service.rename({ path: 'copy', title: 'Renamed', expectedRevision: copied.revision })

    for (const folder of ['game', 'copy']) {
      for (const file of ['game.json', 'scenes/start.json', 'scenes/adventure.json']) {
        const text = await readFile(join(root, folder, file), 'utf8')
        expect(text, `${folder}/${file}`).toBe((await format(file, text)).code)
        expect(text.endsWith('\n')).toBe(true)
      }

      expect(await readFile(join(root, folder, 'game.json'), 'utf8')).toContain(
        '"scenes": ["start", "adventure", "game-menu", "save", "load", "settings"]',
      )
    }
  })

  it('publishes every changed file when several existing files change together', async () => {
    const current = await repository.load('game')
    const changedFiles = ['scenes/start.json', 'scenes/adventure.json', 'game.json']
    const documents = { ...current.documents }

    for (const file of changedFiles)
      documents[file] = { ...object(documents[file]), description: `Changed ${file}` }

    await repository.save('game', {
      project: { revision: current.revision, documents },
      changedFiles,
      diagnostics: [],
      summary: 'Changed three files',
    })

    for (const file of changedFiles) {
      const text = await readFile(join(root, 'game', file), 'utf8')
      expect(JSON.parse(text)).toEqual(documents[file])
      expect(text, file).toBe((await format(file, text)).code)
    }
  })

  it('rejects an unserializable document before publishing any files', async () => {
    const current = await repository.load('game')
    const before = await readFile(join(root, 'game/game.json'))

    await expect(
      repository.save('game', {
        project: {
          ...current,
          documents: {
            ...current.documents,
            'game.json': { ...object(current.documents['game.json']), title: 'Pending' },
            'rules/invalid.json': undefined,
          },
        },
        changedFiles: ['game.json', 'rules/invalid.json'],
        createdFiles: ['rules/invalid.json'],
        diagnostics: [],
        summary: 'Invalid change',
      }),
    ).rejects.toMatchObject({ code: 'invalid_project_document', outcome: 'not_applied' })
    expect(await readFile(join(root, 'game/game.json'))).toEqual(before)
    await expect(readFile(join(root, 'game/rules/invalid.json'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })
})
