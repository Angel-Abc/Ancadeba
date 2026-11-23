import { describe, expect, it, vi } from 'vite-plus/test'
import { ActionInfo } from '@ancadeba/ui-components'
import {
  actionBarComponentSchema,
  actionInfoComponentSchema,
  assertGameLanguages,
  buttonComponentSchema,
  gameSchema,
  localizeDefinitions,
  sceneSchema,
} from '@ancadeba/schemas'
import { applyCommand, createStarterProject, inspectProject } from '@ancadeba/editor-core'

const placement = { row: 1, column: 1, rowSpan: 1, columnSpan: 1 }

describe('action information presentation', () => {
  it('follows the latest pointer or keyboard interaction and restores the remaining source', () => {
    const information = new ActionInfo()
    const keyboard = Symbol('keyboard')
    const pointer = Symbol('pointer')
    const first = { label: 'Read', description: 'Read the letter.', reason: '' }

    const second = {
      label: 'Travel',
      description: 'Walk to the harbour.',
      reason: 'The gate is locked.',
    }

    const changed = vi.fn()
    const unsubscribe = information.subscribe(changed)
    information.update(keyboard, first)
    information.update(pointer, second)
    expect(information.value).toBeUndefined()
    information.focus(keyboard, true)
    expect(information.value).toEqual(first)
    information.hover(pointer, true)
    expect(information.value).toEqual(second)
    information.focus(keyboard, true)
    expect(information.value).toEqual(first)
    information.focus(keyboard, false)
    expect(information.value).toEqual(second)
    information.hover(pointer, false)
    expect(information.value).toBeUndefined()
    unsubscribe()
    changed.mockClear()
    information.focus(keyboard, true)
    expect(changed).not.toHaveBeenCalled()
  })

  it('updates active explanations without redundant notifications and clears hidden or disposed sources', () => {
    const information = new ActionInfo()
    const source = Symbol('action')
    const value = { label: 'Strike', description: 'A heavy strike.', reason: 'Requires level 3.' }
    const changed = vi.fn()
    information.subscribe(changed)
    information.update(source, value)
    information.hover(source, true)
    information.update(source, { ...value })
    expect(changed).toHaveBeenCalledOnce()
    information.update(source, { ...value, reason: '' })
    expect(information.value?.reason).toBe('')
    information.update(source, undefined)
    expect(information.value).toBeUndefined()
    information.hover(source, true)
    expect(information.value).toBeUndefined()
  })
})

describe('action information authoring and localization', () => {
  it('saves the panel and action descriptions, and removes cleared translations and overrides', () => {
    let project = {
      revision: 'initial',
      documents: createStarterProject({
        title: 'Descriptions',
        path: 'descriptions',
        description: '',
      }),
    }

    const save = (command: Parameters<typeof applyCommand>[1]) => {
      project = applyCommand(project, command).project
    }

    save({
      type: 'scene.upsertComponent',
      sceneId: 'adventure',
      component: actionInfoComponentSchema.parse({
        id: 'information',
        type: 'action-info',
        placement,
      }),
    })

    const bar = actionBarComponentSchema.parse({
      id: 'actions',
      type: 'action-bar',
      placement,
      slots: {
        '1': {
          label: 'Travel',
          showOnlyWhenActive: true,
          description: 'Return to the menu.',
          unavailableText: 'Finish the conversation first.',
          action: { type: 'enter-scene', scene: 'start' },
        },
      },
    })

    save({ type: 'scene.setActionBar', sceneId: 'adventure', component: bar })

    const button = buttonComponentSchema.parse({
      id: 'travel',
      type: 'button',
      placement,
      label: 'Travel',
      showOnlyWhenActive: true,
      description: 'Return to the menu.',
      unavailableText: 'Finish the conversation first.',
      action: { type: 'enter-scene', scene: 'start' },
    })

    save({ type: 'scene.upsertComponent', sceneId: 'adventure', component: button })
    expect(inspectProject(project).diagnostics).toEqual([])
    expect(inspectProject(project).scenes.find(({ id }) => id === 'adventure')?.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'action-info' }),
        expect.objectContaining({
          type: 'button',
          description: button.description,
          showOnlyWhenActive: true,
        }),
        expect.objectContaining({ type: 'action-bar', slots: bar.slots }),
      ]),
    )
    delete bar.slots['1']!.description
    delete bar.slots['1']!.showOnlyWhenActive
    delete bar.slots['1']!.unavailableText
    save({ type: 'scene.setActionBar', sceneId: 'adventure', component: bar })
    delete button.description
    delete button.showOnlyWhenActive
    delete button.unavailableText
    save({ type: 'scene.upsertComponent', sceneId: 'adventure', component: button })

    const components = inspectProject(project).scenes.find(
      ({ id }) => id === 'adventure',
    )!.components

    const savedButton = components.find(
      (component) => component.type === 'button' && component.id === 'travel',
    )

    expect(savedButton).toHaveProperty('description', undefined)
    expect(savedButton).toHaveProperty('showOnlyWhenActive', undefined)
    const savedBar = components.find((component) => component.type === 'action-bar')!
    expect(savedBar.slots['1']?.description).toBeUndefined()
    expect(savedBar.slots['1']?.showOnlyWhenActive).toBeUndefined()
    expect(savedBar.slots['1']?.unavailableText).toBeUndefined()
  })

  it('localizes descriptions, unavailable explanations and panel text, with default-language fallback', () => {
    const game = gameSchema.parse({
      'schema-version': '1.0.0',
      id: 'test',
      title: 'Test',
      version: '1',
      scenes: ['play'],
    })

    const scenes = new Map([
      [
        'play',
        sceneSchema.parse({
          'schema-version': '1.0.0',
          id: 'play',
          title: 'Play',
          type: 'game',
          screen: { type: 'grid', grid: { rows: 2, columns: 2 } },
          components: [
            { id: 'info', type: 'action-info', labelKey: 'info', emptyTextKey: 'empty', placement },
            {
              id: 'button',
              type: 'button',
              label: 'Travel',
              descriptionKey: 'description',
              unavailableTextKey: 'unavailable',
              placement,
            },
            {
              id: 'actions',
              type: 'action-bar',
              placement,
              slots: {
                '1': {
                  label: 'Travel',
                  descriptionKey: 'description',
                  unavailableTextKey: 'unavailable',
                  action: { type: 'enter-scene', scene: 'play' },
                },
              },
            },
          ],
        }),
      ],
    ])

    expect(() => assertGameLanguages(game, scenes)).toThrow('Translation keys')

    const translation = {
      fallback: {
        info: 'Action information',
        empty: 'Choose an action.',
        description: 'Walk to the harbour.',
        unavailable: 'The gate is locked.',
      },
      messages: { info: 'Actie-informatie', description: 'Loop naar de haven.' },
    }

    const localized = localizeDefinitions(game, scenes, translation).scenes.get('play')!
    expect(localized.components[0]).toMatchObject({
      label: 'Actie-informatie',
      emptyText: 'Choose an action.',
    })
    expect(localized.components[1]).toMatchObject({
      description: 'Loop naar de haven.',
      unavailableText: 'The gate is locked.',
    })
    expect(localized.components[2]).toMatchObject({
      slots: {
        '1': { description: 'Loop naar de haven.', unavailableText: 'The gate is locked.' },
      },
    })
    expect(() => localizeDefinitions(game, scenes, { fallback: {}, messages: {} })).toThrow(
      'Missing default translation',
    )
  })
})
