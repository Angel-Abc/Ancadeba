import { buttonComponentSchema, gameIdSchema, gameSchema, sceneSchema } from '@ancadeba/schemas'
import { z } from 'zod'
import type { ProjectDocuments } from './project.js'

/** New games live in a new, single folder beneath the configured workspace. */
export const createProjectRequestSchema = z.strictObject({
  path: gameIdSchema.max(64),
  title: z.string().trim().min(1).max(200),
  description: z.string().default(''),
  template: z.enum(['starter', 'empty']).optional(),
})

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>

/** Create the initial files for the selected template. Existing callers get the playable starter. */
export function createStarterProject(request: CreateProjectRequest): ProjectDocuments {
  const { path, title, description, template } = createProjectRequestSchema.parse(request)

  const manifest = {
    'schema-version': '1.0.0',
    id: path,
    title,
    ...(description && { description }),
    version: '1.0.0',
  }

  if (template === 'empty') return { 'game.json': { ...manifest, scenes: [] } }

  const screen = { type: 'grid', grid: { rows: 12, columns: 16 } }

  const documents = {
    'game.json': gameSchema.parse({
      ...manifest,
      stylesheet: 'theme.css',
      'initial-scene': 'start',
      'menu-scene': 'game-menu',
      saving: { manual: 'anywhere', autosave: 'automatic' },
      scenes: ['start', 'adventure', 'game-menu', 'save', 'load', 'settings'],
    }),
    'scenes/start.json': sceneSchema.parse({
      'schema-version': '1.0.0',
      id: 'start',
      title: 'Start',
      type: 'stand-alone',
      screen,
      components: [
        {
          id: 'title',
          type: 'text',
          text: title,
          placement: { row: 2, column: 2, rowSpan: 3, columnSpan: 14 },
          presentation: { variant: 'heading', align: 'center' },
        },
        {
          id: 'description',
          type: 'text',
          text: description || 'Your adventure begins here.',
          placement: { row: 5, column: 2, rowSpan: 3, columnSpan: 14 },
        },
        {
          id: 'play',
          type: 'button',
          label: 'New game',
          placement: { row: 9, column: 5, rowSpan: 2, columnSpan: 8 },
          action: { type: 'new-game', scene: 'adventure' },
        },
      ],
    }),
    'theme.css': `.ancadeba-scene {
  --ge-scene-font-size: calc(22 * var(--ge-scene-unit-size));
  --ge-scene-heading-size: calc(36 * var(--ge-scene-unit-size));
  --ge-scene-text-padding: 0.5em;
}

.ancadeba-button {
  --ge-scene-text-padding: 0.25em;
}
`,
    'scenes/adventure.json': sceneSchema.parse({
      'schema-version': '1.0.0',
      id: 'adventure',
      title: 'Adventure',
      type: 'game',
      screen,
      components: [
        {
          id: 'narrative',
          type: 'text',
          text: 'Edit this scene to tell your story.',
          placement: { row: 2, column: 2, rowSpan: 6, columnSpan: 14 },
        },
        {
          id: 'menu',
          type: 'button',
          label: 'Game menu',
          placement: { row: 9, column: 5, rowSpan: 2, columnSpan: 8 },
          action: { type: 'open-menu', scene: 'game-menu' },
        },
      ],
    }),
  }

  const button = (id: string, label: string, row: number, action: unknown) =>
    buttonComponentSchema.parse({
      id,
      type: 'button',
      label,
      placement: { row, column: 5, rowSpan: 1, columnSpan: 8 },
      action,
    })

  const menu = (id: string, title: string, components: unknown[]) =>
    sceneSchema.parse({
      'schema-version': '1.0.0',
      id,
      title,
      type: 'stand-alone',
      screen,
      components,
    })

  const gameMenu = menu('game-menu', 'Game menu', [
    button('resume', 'Resume', 2, { type: 'resume-game' }),
    button('main-menu', 'Main menu', 4, { type: 'main-menu', scene: 'start' }),
    button('save', 'Save game', 6, { type: 'enter-scene', scene: 'save' }),
    button('load', 'Load game', 8, { type: 'enter-scene', scene: 'load' }),
    button('settings', 'Settings', 10, { type: 'enter-scene', scene: 'settings' }),
  ])

  const saveScenes = Object.fromEntries(
    ['save', 'load'].map((id) => [
      `scenes/${id}.json`,
      menu(id, `${id === 'save' ? 'Save' : 'Load'} game`, [
        {
          id: 'slots',
          type: 'save-slots',
          placement: { row: 2, column: 2, rowSpan: 3, columnSpan: 14 },
        },
        button(id, `${id === 'save' ? 'Save' : 'Load'} game`, 6, { type: `${id}-game` }),
        {
          id: 'status',
          type: 'save-status',
          placement: { row: 8, column: 2, rowSpan: 2, columnSpan: 14 },
        },
        button('resume', 'Resume', 11, { type: 'resume-game' }),
        button('main-menu', 'Main menu', 12, { type: 'main-menu', scene: 'start' }),
      ]),
    ]),
  )

  const settings = menu('settings', 'Settings', [
    {
      id: 'help',
      type: 'text',
      text: 'Add your game settings here.',
      placement: { row: 2, column: 2, rowSpan: 3, columnSpan: 14 },
    },
    button('resume', 'Resume', 10, { type: 'resume-game' }),
  ])

  const start = sceneSchema.parse(documents['scenes/start.json'])
  start.components.push(button('load', 'Load game', 12, { type: 'enter-scene', scene: 'load' }))

  return {
    ...documents,
    ...saveScenes,
    'scenes/start.json': start,
    'scenes/game-menu.json': gameMenu,
    'scenes/settings.json': settings,
  }
}
