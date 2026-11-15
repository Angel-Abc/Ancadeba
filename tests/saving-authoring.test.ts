import { describe, expect, it } from 'vite-plus/test'
import { applyCommand, createStarterProject, object, validateProject } from '@ancadeba/editor-core'
import { GameLoader } from '@ancadeba/game-runtime'
import { JsonResourceLoader } from '@ancadeba/utilities'

const logger = { debug: () => '', info: () => '', warn: () => '', error: () => '' }

const project = () => ({
  revision: 'one',
  documents: createStarterProject({ path: 'menus', title: 'Menus', description: '' }),
})

describe('saving and menu authoring', () => {
  it('saves independent policies and menu selection and loads them into the runtime', async () => {
    const result = applyCommand(project(), {
      type: 'game.updateMetadata',
      title: 'Menus',
      description: '',
      version: '1.0.0',
      saving: { manual: 'save-points', autosave: 'disabled' },
      menuScene: 'game-menu',
    })

    const game = await new GameLoader(
      new JsonResourceLoader(
        {
          readText: async (path) => {
            const source = result.project.documents[path]

            return typeof source === 'string' ? source : JSON.stringify(source)
          },
          readBytes: async () => new Uint8Array(),
        },
        logger,
      ),
    ).load()

    expect(game.saving).toEqual({ manual: 'save-points', autosave: 'disabled' })
    expect(game.menuScene).toBe('game-menu')
    expect(validateProject(result.project.documents)).toEqual([])
    expect(() =>
      applyCommand(result.project, {
        type: 'game.updateMetadata',
        title: 'Menus',
        description: '',
        version: '1.0.0',
        menuScene: 'adventure',
      }),
    ).toThrow('invalid project')
  })

  it('authors whole-scene save points and protects their scene and menu references', () => {
    const result = applyCommand(project(), {
      type: 'scene.upsertComponent',
      sceneId: 'adventure',
      component: {
        id: 'camp',
        type: 'save-point',
        label: 'Rest at camp',
        placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 },
        menuScene: 'save',
      },
    })

    const renamed = applyCommand(result.project, {
      type: 'scene.rename',
      sceneId: 'save',
      newId: 'save-menu',
    })

    expect(object(renamed.project.documents['scenes/adventure.json']).components).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'camp', menuScene: 'save-menu' })]),
    )
    expect(() =>
      applyCommand(renamed.project, { type: 'scene.remove', sceneId: 'save-menu' }),
    ).toThrow('replacement scene')
    expect(() =>
      applyCommand(project(), {
        type: 'scene.upsertComponent',
        sceneId: 'start',
        component: {
          id: 'camp',
          type: 'save-point',
          label: 'Save',
          placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 },
        },
      }),
    ).toThrow('invalid project')
  })

  it('renames the configured Escape menu and protects it from deletion without replacement', () => {
    const renamed = applyCommand(project(), {
      type: 'scene.rename',
      sceneId: 'game-menu',
      newId: 'pause-menu',
    })

    expect(object(renamed.project.documents['game.json'])['menu-scene']).toBe('pause-menu')
    expect(validateProject(renamed.project.documents)).toEqual([])
    expect(() =>
      applyCommand(renamed.project, { type: 'scene.remove', sceneId: 'pause-menu' }),
    ).toThrow('replacement scene')
  })
})
