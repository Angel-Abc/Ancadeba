/// <reference lib="dom" />
import { describe, expect, it, vi } from 'vite-plus/test'
import {
  applyCommand,
  createStarterProject,
  inspectProject,
  type EditorCommand,
  type ProjectView,
} from '@ancadeba/editor-core'
import { assetCatalogSchema, mapDefinitionSchema, sceneComponentSchema } from '@ancadeba/schemas'
import { MapDraft } from '../apps/editor-ui/src/mapDraft.js'
import { captureEditorDrafts, restoreEditorDrafts } from '../apps/editor-ui/src/editorDraftState.js'
import { bindMapEditor } from '../apps/editor-ui/src/mapEditor.js'
import { createEditorConfirmation } from '../apps/editor-ui/src/editorConfirmation.js'
import { mapFileNodes } from '../apps/editor-ui/src/projectTree.js'
import { editorLocalization } from '../apps/editor-ui/src/localization.js'
import type { ProjectEditorState } from '../apps/editor-ui/src/projectController.js'

class Element extends EventTarget {
  children: (Element | string)[] = []
  parent: Element | undefined
  value = ''
  className = ''
  type = ''
  disabled = false
  readOnly = false
  tabIndex = -1
  min = ''
  step = ''
  title = ''
  open = false
  hidden = false
  id = ''
  width = 0
  height = 0
  clientWidth = 0
  clientHeight = 0
  clientLeft = 0
  clientTop = 0
  scrollLeft = 0
  scrollTop = 0
  src = ''
  context = {
    fillStyle: '',
    imageSmoothingEnabled: true,
    clearRect: vi.fn<(x: number, y: number, width: number, height: number) => void>(),
    fillRect: vi.fn<(x: number, y: number, width: number, height: number) => void>(),
    drawImage: vi.fn<(source: Element, ...coordinates: number[]) => void>(),
  }
  getContext() {
    return this.context
  }
  dataset: Record<string, string> = {}
  attributes = new Map<string, string>()
  style = {
    width: '',
    height: '',
    left: '',
    top: '',
    properties: new Map<string, string>(),
    backgroundColor: '',
    backgroundImage: '',
    backgroundRepeat: '',
    backgroundSize: '',
    backgroundPosition: '',
    setProperty: (name: string, value: string) => {
      this.style.properties.set(name, value)
    },
  }
  classList = {
    add: (value: string) => {
      this.className += ` ${value}`
    },
    toggle: (value: string, force: boolean) => {
      const names = new Set(this.className.split(' '))

      if (force) names.add(value)
      else names.delete(value)
      this.className = [...names].join(' ')

      return force
    },
  }
  constructor(
    readonly ownerDocument: DocumentFixture,
    readonly tagName: string,
  ) {
    super()
  }
  get textContent(): string {
    return this.children
      .map((child) => (typeof child === 'string' ? child : child.textContent))
      .join('')
  }
  set textContent(value: string) {
    this.children = [value]
  }
  append(...children: (Element | string)[]) {
    for (const child of children) {
      if (typeof child !== 'string') child.parent = this
      this.children.push(child)
    }
  }
  replaceChildren(...children: (Element | string)[]) {
    this.children = []
    this.append(...children)
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this)
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)

    if (name === 'tabindex') this.tabIndex = Number(value)
  }
  all(): Element[] {
    return [
      this,
      ...this.children.flatMap((child) => (typeof child === 'string' ? [] : child.all())),
    ]
  }
  querySelector(selector: string) {
    return this.all().find((element) => element.tagName.toLowerCase() === selector) ?? null
  }
  querySelectorAll(selector: string) {
    return this.all().filter((element) => element.tagName.toLowerCase() === selector)
  }
  focus() {
    this.ownerDocument.activeElement = this
    this.dispatchEvent(new Event('focus'))
  }
  showModal() {
    this.open = true
  }
  close() {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
  contains(element: Element) {
    return this.all().includes(element)
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 672, height: 448 }
  }
  asElement(): HTMLElement {
    // @ts-expect-error -- Partial DOM fixture implements the editor's controls and event targets.
    return this
  }
}

class DocumentFixture extends EventTarget {
  created: Element[] = []
  body = new Element(this, 'BODY')
  activeElement: Element | undefined
  defaultView = new EventTarget()
  observers = new Map<Element, () => void>()
  constructor() {
    super()
    const observers = this.observers
    this.defaultView = Object.assign(new EventTarget(), {
      ResizeObserver: class {
        target: Element | undefined
        constructor(readonly callback: () => void) {}
        observe(target: Element) {
          this.target = target
          observers.set(target, this.callback)
        }
        disconnect() {
          if (this.target) observers.delete(this.target)
        }
      },
    })
  }
  resize(element: Element, width: number, height: number) {
    element.clientWidth = width
    element.clientHeight = height
    this.observers.get(element)?.()
  }
  createElement(tag: string) {
    const element = new Element(this, tag.toUpperCase())
    this.created.push(element)

    return element
  }
}

const documents = createStarterProject({ path: 'game', title: 'Map editor', description: '' })
const view = inspectProject({ revision: 'one', documents })

const state = (
  current: ProjectView,
  extra: Partial<ProjectEditorState> = {},
): ProjectEditorState => ({
  path: 'game',
  view: current,
  busy: false,
  error: '',
  conflict: false,
  changedElsewhere: false,
  lastCommand: null,
  preserveDrafts: false,
  ...extra,
})

function setup(current = view) {
  const document = new DocumentFixture()
  const root = document.createElement('section')
  const saved: EditorCommand[] = []
  const confirm = vi.fn<(message: string) => boolean | Promise<boolean>>(() => true)
  const selected = vi.fn<(id: string | undefined) => void>()
  const navigated = vi.fn<(id: string | undefined) => void>()
  let localization = editorLocalization()

  const editor = bindMapEditor(
    root.asElement(),
    (command) => {
      saved.push(structuredClone(command))
    },
    (key, values) => localization.t(key, values),
    {
      confirm,
      onSaved: selected,
      onNavigate: navigated,
      createGraphics: () => ({
        acquire: async () => ({ url: 'blob:sheet', release: () => {} }),
        dispose: () => {},
      }),
    },
  )

  editor.render(state(current), true)

  const control = (title: string) => {
    const label = root
      .all()
      .find((element) => element.tagName === 'LABEL' && element.children.includes(title))

    const input = label?.children.find((child): child is Element => child instanceof Element)

    if (!input) throw new Error(`Missing control ${title}`)

    return input
  }

  const edit = (title: string, value: string, event = 'input') => {
    const input = control(title)
    input.value = value
    input.dispatchEvent(new Event(event))
  }

  const button = (title: string) => {
    const button = root
      .all()
      .find(
        (element) =>
          element.tagName === 'BUTTON' &&
          (element.textContent === title || element.attributes.get('aria-label') === title),
      )

    if (!button) throw new Error(`Missing button ${title}`)

    return button
  }

  const tile = (x: number, y: number) => {
    const tile = root
      .all()
      .find((element) => element.dataset.mapX === String(x) && element.dataset.mapY === String(y))

    if (!tile) throw new Error(`Missing tile ${x},${y}`)

    return tile
  }

  return {
    root,
    document,
    editor,
    saved,
    selected,
    navigated,
    confirm,
    edit,
    control,
    button,
    tile,
    submit: async () => {
      root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }))
      await Promise.resolve()
    },
    language: (language: string) => {
      localization = editorLocalization([language])
    },
  }
}

describe('map editor pages', () => {
  const page = (ui: ReturnType<typeof setup>, id: string) =>
    ui.root.all().find((element) => element.id === `map-page-${id}`)!

  const select = (ui: ReturnType<typeof setup>, title: string) =>
    ui.button(title).dispatchEvent(new Event('click'))

  const current = (map = new MapDraft().data): ProjectView => ({
    ...view,
    game: { ...view.game!, maps: ['garden'] },
    maps: { garden: map },
    rules: { state: [], actions: { inspect: [{ when: [], effects: [] }] } },
  })

  it('shows four accessible task pages with keyboard navigation and common draft actions', () => {
    const ui = setup(current())

    try {
      const tabs = ui.root.all().filter((element) => element.attributes.get('role') === 'tab')
      expect(tabs.map((tab) => tab.textContent)).toEqual([
        'Paint',
        'Terrain & tilesets',
        'Objects & triggers',
        'Map settings',
      ])
      expect(page(ui, 'paint').hidden).toBe(false)
      expect(page(ui, 'paint').contains(ui.control('Paint terrain'))).toBe(true)
      const paintElements = page(ui, 'paint').all()
      const canvas = paintElements.find((element) => element.className === 'map-canvas')!
      const details = paintElements.find((element) => element.className === 'map-view-details')!
      expect(paintElements.indexOf(canvas)).toBeLessThan(paintElements.indexOf(details))
      expect(details.contains(ui.button('Next columns'))).toBe(true)
      expect(details.contains(ui.button('Pan right'))).toBe(true)
      expect(details.open).toBe(false)
      expect(page(ui, 'terrain').contains(ui.control('Terrain to edit'))).toBe(true)
      expect(page(ui, 'objects').contains(ui.button('Edit tile-entry triggers'))).toBe(true)
      expect(page(ui, 'settings').contains(ui.control('Width in tiles'))).toBe(true)
      expect(page(ui, 'settings').contains(ui.button('Delete map'))).toBe(true)

      const press = (key: string) =>
        ui.document.activeElement!.dispatchEvent(
          Object.assign(new Event('keydown', { cancelable: true }), { key }),
        )

      ui.button('Paint').focus()
      press('ArrowRight')
      expect(ui.document.activeElement).toBe(ui.button('Terrain & tilesets'))
      expect(page(ui, 'terrain').hidden).toBe(false)
      expect(page(ui, 'paint').hidden).toBe(true)
      expect(ui.button('Terrain & tilesets').attributes.get('aria-selected')).toBe('true')
      expect(ui.button('Terrain & tilesets').tabIndex).toBe(0)
      press('End')
      expect(ui.document.activeElement).toBe(ui.button('Map settings'))
      press('ArrowRight')
      expect(ui.document.activeElement).toBe(ui.button('Paint'))
      press('ArrowLeft')
      expect(ui.document.activeElement).toBe(ui.button('Map settings'))
      press('Home')
      expect(ui.document.activeElement).toBe(ui.button('Paint'))
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.button('Undo map edit').disabled).toBe(true)
      expect(ui.button('Save map').parent).toBe(ui.button('Undo map edit').parent)
      expect(ui.saved).toEqual([])
    } finally {
      ui.editor.dispose()
    }
  })

  it('edits terrain independently of the paint brush and opens the current brush through its shortcut', async () => {
    const ui = setup(current())

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      select(ui, 'Terrain & tilesets')
      expect(ui.control('Terrain to edit').value).toBe('ground')
      ui.edit('Terrain color', '#112233')
      ui.edit('Terrain to edit', 'wall', 'change')
      ui.edit('Movement time (ms)', '250')
      select(ui, 'Paint')
      expect(ui.control('Paint terrain').value).toBe('wall')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      ui.edit('Paint terrain', 'ground', 'change')
      select(ui, 'Edit terrain')
      expect(page(ui, 'terrain').hidden).toBe(false)
      expect(ui.control('Terrain to edit').value).toBe('ground')
      expect(ui.control('Terrain color').value).toBe('#112233')
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: { terrain: { ground: { color: '#112233' }, wall: { movementCostMs: 250 } } },
      })
      expect(ui.saved[0]!.type === 'game.upsertMap' && ui.saved[0]!.map.tiles[0]![0]).toBe('wall')
    } finally {
      ui.editor.dispose()
    }
  })

  it('retains pending fields, terrain selection and shared undo/redo across all pages and draft recovery', () => {
    const initial = current()
    const ui = setup(initial)
    const recovered = setup(initial)

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      select(ui, 'Terrain & tilesets')
      ui.edit('Terrain to edit', 'wall', 'change')
      ui.edit('Movement time (ms)', '200')
      ui.edit('New terrain ID', 'water')
      ui.edit('New tileset ID', 'nature')
      select(ui, 'Map settings')
      ui.edit('Width in tiles', '32')
      select(ui, 'Objects & triggers')
      select(ui, 'Paint')
      ui.edit('New layer ID', 'trees')
      select(ui, 'Terrain & tilesets')
      expect(ui.control('Terrain to edit').value).toBe('wall')
      expect(ui.control('New terrain ID').value).toBe('water')
      expect(ui.control('New tileset ID').value).toBe('nature')
      expect(ui.control('New layer ID').value).toBe('trees')
      expect(ui.control('Width in tiles').value).toBe('32')
      select(ui, 'Undo map edit')
      expect(ui.control('Movement time (ms)').value).toBe('0')
      expect(page(ui, 'terrain').hidden).toBe(false)
      select(ui, 'Map settings')
      select(ui, 'Undo map edit')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
      expect(ui.editor.hasDrafts()).toBe(true)
      select(ui, 'Redo map edit')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      select(ui, 'Terrain & tilesets')
      select(ui, 'Redo map edit')
      expect(ui.control('Movement time (ms)').value).toBe('200')
      const drafts = JSON.parse(JSON.stringify(captureEditorDrafts(ui.root.asElement())))
      expect(restoreEditorDrafts(recovered.root.asElement(), drafts)).toEqual([])
      expect(page(recovered, 'terrain').hidden).toBe(false)
      expect(recovered.control('Terrain to edit').value).toBe('wall')
      expect(recovered.control('Paint terrain').value).toBe('wall')
      expect(recovered.control('New terrain ID').value).toBe('water')
      expect(recovered.control('New tileset ID').value).toBe('nature')
      expect(recovered.control('New layer ID').value).toBe('trees')
      expect(recovered.control('Width in tiles').value).toBe('32')
      expect(recovered.editor.hasDrafts()).toBe(true)
    } finally {
      ui.editor.dispose()
      recovered.editor.dispose()
    }
  })

  it('keeps the camera, focused tile and cut clipboard when visiting other pages', async () => {
    const map = new MapDraft()
    map.resize(64, 40, 'ground')
    map.paint(30, 20, 'wall')
    const ui = setup(current(map.data))

    try {
      ui.edit('Map zoom', '200', 'change')
      select(ui, 'Next columns')
      select(ui, 'Next columns')
      select(ui, 'Next rows')
      select(ui, 'Next rows')
      ui.edit('Paint tool', 'select', 'change')
      ui.tile(30, 20).dispatchEvent(new Event('click'))
      select(ui, 'Cut selection')
      ui.tile(31, 20).focus()
      select(ui, 'Terrain & tilesets')
      select(ui, 'Map settings')
      select(ui, 'Objects & triggers')
      expect(ui.control('Map zoom').value).toBe('200')
      expect(ui.tile(31, 20).tabIndex).toBe(0)
      select(ui, 'Paint')
      expect(ui.control('Paint tool').value).toBe('paste')
      expect(ui.control('Map zoom').value).toBe('200')
      expect(ui.tile(31, 20).tabIndex).toBe(0)
      ui.tile(31, 20).dispatchEvent(new Event('click'))
      await ui.submit()
      const command = ui.saved[0]!
      expect(command.type).toBe('game.upsertMap')

      if (command.type !== 'game.upsertMap') throw new Error('Expected map command')
      expect(command.map.tiles[20]!.slice(30, 32)).toEqual(['ground', 'wall'])
    } finally {
      ui.editor.dispose()
    }
  })

  it('places objects and triggers beside their properties without changing the retained paint tool', () => {
    const ui = setup(current())

    try {
      ui.edit('Paint tool', 'select', 'change')
      select(ui, 'Objects & triggers')

      const undoWithoutDraft = Object.assign(new Event('keydown', { cancelable: true }), {
        key: 'z',
        ctrlKey: true,
      })

      ui.tile(0, 0).dispatchEvent(undoWithoutDraft)
      expect(undoWithoutDraft.defaultPrevented).toBe(false)
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      ui.edit('Object label', 'Chest')
      const objectProperties = ui.control('Object label').parent!.parent!.parent!
      expect(objectProperties.hidden).toBe(false)
      select(ui, 'Edit tile-entry triggers')
      expect(ui.control('Object label').parent!.parent!.parent!.hidden).toBe(true)
      ui.tile(2, 1).dispatchEvent(new Event('click'))
      ui.edit('Trigger ID', 'exit')
      select(ui, 'Map settings')
      select(ui, 'Undo map edit')
      select(ui, 'Objects & triggers')
      expect(ui.control('Trigger ID').value).toBe('entry')
      select(ui, 'Place or edit map objects')
      expect(ui.control('Object label').value).toBe('Chest')
      select(ui, 'Paint')
      expect(ui.control('Paint tool').value).toBe('select')
      expect(ui.tile(1, 1).attributes.get('aria-label')).toContain('ground')
      expect(ui.saved).toEqual([])
    } finally {
      ui.editor.dispose()
    }
  })
})

describe('map drafts', () => {
  it('paints a detached map, resizes without sharing rows, and replaces terrain before removing it', () => {
    const original = new MapDraft().data
    const draft = new MapDraft(original)
    expect(draft.paint(0, 0, 'wall')).toBe(true)
    expect(original.tiles[0]![0]).toBe('ground')
    expect(draft.paint(-1, 0, 'wall')).toBe(false)
    expect(draft.paint(0, 0, 'unknown')).toBe(false)
    draft.resize(18, 14, 'wall')
    expect(draft.data.tiles[0]![17]).toBe('wall')
    expect(draft.data.tiles[13]![0]).toBe('wall')
    expect(draft.data.tiles[12]).not.toBe(draft.data.tiles[13])
    expect(() => draft.removeTerrain('wall')).toThrow('replacementRequired')
    draft.removeTerrain('wall', 'ground')
    expect(draft.data.tiles.flat().every((tile) => tile === 'ground')).toBe(true)
    expect(() => draft.removeTerrain('ground')).toThrow('lastTerrain')
    expect(() => draft.addTerrain('__proto__')).toThrow('invalidTerrain')
    expect(() => draft.resize(1_000_000, 2, 'ground')).toThrow('invalidSize')
    expect(() => draft.resize(0.5, 2, 'ground')).toThrow('invalidSize')
    draft.resize(2, 2, 'ground')
    draft.addTerrain('water')
    draft.fill('water')
    expect(mapDefinitionSchema.parse(draft.data).tiles).toEqual([
      ['water', 'water'],
      ['water', 'water'],
    ])
  })
})

describe('visual map editor', () => {
  const triggerView = (): ProjectView => {
    const draft = new MapDraft()
    draft.resize(3, 3, 'ground')
    draft.paint(1, 0, 'wall')
    draft.data.entryTriggers = [
      { id: 'depart', x: 0, y: 0, action: 'travel' },
      { id: 'return', x: 2, y: 2, action: 'inspect' },
    ]

    return {
      ...view,
      game: { ...view.game!, maps: ['gates'] },
      maps: { gates: draft.data },
      rules: {
        state: [],
        actions: { travel: [{ when: [], effects: [] }], inspect: [{ when: [], effects: [] }] },
      },
      scenes: view.scenes.map((scene) =>
        scene.type === 'game'
          ? {
              ...scene,
              components: [
                ...scene.components,
                sceneComponentSchema.parse({
                  type: 'map-view',
                  id: 'gate-view',
                  map: 'gates',
                  label: 'Gates',
                  placement: { row: 1, column: 1 },
                  viewport: { columns: 3, rows: 3 },
                  playerSpawn: { x: 0, y: 0 },
                }),
              ],
            }
          : scene,
      ),
    }
  }

  const hasMarker = (tile: Element) =>
    tile.all().some((element) => element.className === 'map-entry-trigger-marker')

  it('shows object states and selection tools in the editor language', () => {
    const ui = setup(triggerView())

    try {
      ui.language('nl')
      ui.editor.render(state(triggerView()), false)
      ui.button('Kaartobjecten plaatsen of bewerken').dispatchEvent(new Event('click'))
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      expect(ui.button('Objecttoestand toevoegen')).toBeDefined()
      expect(() => ui.button('Add object state')).toThrow()
    } finally {
      ui.editor.dispose()
    }
  })

  it('authors visibility-only object states, keeps hidden objects editable and recovers visibility drafts', async () => {
    const view = triggerView()
    view.rules!.state = [{ path: ['collected'], value: false }]
    const ui = setup(view)
    const recovered = setup(view)

    try {
      ui.button('Place or edit map objects').dispatchEvent(new Event('click'))
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      ui.edit('Object visible', 'no', 'change')
      expect(
        ui
          .tile(1, 1)
          .all()
          .some((element) => element.dataset.mapObject === 'object'),
      ).toBe(true)
      ui.button('Add object state').dispatchEvent(new Event('click'))
      ui.edit('Object state ID', 'collected')
      ui.edit('State appearance terrain', '', 'change')
      ui.edit('State visible', 'false', 'change')
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: {
          objects: [
            {
              visible: false,
              states: [
                { id: 'collected', when: { path: ['collected'], value: true }, visible: false },
              ],
            },
          ],
        },
      })
      ui.edit('Object state ID', '')
      expect(
        restoreEditorDrafts(
          recovered.root.asElement(),
          JSON.parse(JSON.stringify(captureEditorDrafts(ui.root.asElement()))),
        ),
      ).toEqual([])
      expect(recovered.control('Object visible').value).toBe('no')
      expect(recovered.control('State visible').value).toBe('false')
      recovered.edit('Object state ID', 'reveal')
      recovered.edit('State visible', 'true', 'change')
      await recovered.submit()
      expect(recovered.saved[0]).toMatchObject({
        map: { objects: [{ states: [{ id: 'reveal', visible: true }] }] },
      })
      recovered.edit('State label override', 'Inherited visibility')
      recovered.edit('State visible', '', 'change')
      recovered.editor.restoreDraft('undo')
      expect(recovered.control('State visible').value).toBe('true')
      recovered.editor.restoreDraft('redo')
      expect(recovered.control('State visible').value).toBe('')
      await recovered.submit()
      expect(recovered.saved.at(-1)).toMatchObject({
        map: { objects: [{ states: [{ id: 'reveal', label: 'Inherited visibility' }] }] },
      })
      const saved = recovered.saved.at(-1)!
      expect(
        saved.type === 'game.upsertMap' && saved.map.objects![0]!.states![0]!.visible,
      ).toBeUndefined()
    } finally {
      ui.editor.dispose()
      recovered.editor.dispose()
    }
  })

  it('draws a patrol from adjacent tiles, edits seconds, and supports undo and redo', async () => {
    const ui = setup(triggerView())

    try {
      ui.button('Place or edit map objects').dispatchEvent(new Event('click'))
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      ui.edit('Movement trigger', 'timer', 'change')
      ui.edit('Interval (seconds)', '1.25')
      ui.button('Select route tiles').dispatchEvent(new Event('click'))
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      ui.tile(0, 1).dispatchEvent(new Event('click'))
      ui.button('Finish route').dispatchEvent(new Event('click'))
      ui.button('Remove last tile').dispatchEvent(new Event('click'))
      ui.editor.restoreDraft('undo')
      ui.editor.restoreDraft('redo')
      ui.editor.restoreDraft('undo')
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: {
          objects: [
            {
              patrol: {
                mode: 'reverse',
                trigger: { type: 'timer', intervalMs: 1250 },
                route: [
                  { x: 1, y: 1 },
                  { x: 0, y: 1 },
                ],
              },
            },
          ],
        },
      })
    } finally {
      ui.editor.dispose()
    }
  })

  it('authors a one-way crossing and guard, and can undo clearing its optional return delay', async () => {
    const ui = setup(triggerView())

    try {
      ui.button('Place or edit map objects').dispatchEvent(new Event('click'))
      ui.tile(2, 1).dispatchEvent(new Event('click'))
      ui.edit('Object ID', 'guard')
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      ui.edit('Movement trigger', 'player-turn', 'change')
      ui.edit('Player turns per tile', '2')
      ui.edit('Route behavior', 'one-way', 'change')
      ui.button('Select route tiles').dispatchEvent(new Event('click'))
      ui.tile(0, 1).dispatchEvent(new Event('click'))
      ui.button('Finish route').dispatchEvent(new Event('click'))
      ui.edit('Guard to spawn on approach', 'guard', 'change')
      ui.edit('Approach distance (tiles)', '3')
      ui.edit('Action when a warned player steps closer', 'inspect', 'change')
      const delay = 'Return delay (seconds, leave blank for one crossing)'
      ui.edit(delay, '2.5')
      ui.control(delay).dispatchEvent(new Event('blur'))
      ui.edit(delay, '')
      ui.editor.restoreDraft('undo')
      expect(ui.control(delay).value).toBe('2.5')
      await ui.submit()
      expect(ui.saved.at(-1)).toMatchObject({
        map: {
          objects: [
            { id: 'guard' },
            {
              patrol: {
                mode: 'one-way',
                approach: { guard: 'guard', radius: 3, onWarnedApproach: 'inspect' },
                returnDelayMs: 2500,
                trigger: { type: 'player-turn', intervalTurns: 2 },
                route: [
                  { x: 1, y: 1 },
                  { x: 0, y: 1 },
                ],
              },
            },
          ],
        },
      })
      ui.edit(delay, '')
      await ui.submit()
      const command = ui.saved.at(-1)!
      expect(
        command.type === 'game.upsertMap' && command.map.objects![1]!.patrol!.returnDelayMs,
      ).toBeUndefined()
    } finally {
      ui.editor.dispose()
    }
  })

  it('authors ordered boolean object states, recovers incomplete state drafts and undoes removal', async () => {
    const view = triggerView()
    view.rules!.state = [{ path: ['opened'], value: false }]
    const ui = setup(view)
    const recovered = setup(view)

    try {
      ui.button('Place or edit map objects').dispatchEvent(new Event('click'))
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      ui.button('Add object state').dispatchEvent(new Event('click'))
      ui.edit('Object state ID', 'open')
      ui.edit('State appearance terrain', 'wall', 'change')
      ui.edit('State label override', 'Open chest')
      ui.edit('State blocks movement', 'false', 'change')
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: {
          objects: [
            {
              states: [
                {
                  id: 'open',
                  when: { path: ['opened'], value: true },
                  terrain: 'wall',
                  label: 'Open chest',
                  blocking: false,
                },
              ],
            },
          ],
        },
      })
      ui.edit('Object state ID', '')
      expect(
        restoreEditorDrafts(
          recovered.root.asElement(),
          JSON.parse(JSON.stringify(captureEditorDrafts(ui.root.asElement()))),
        ),
      ).toEqual([])
      expect(recovered.control('Object state ID').value).toBe('')
      recovered.edit('Object state ID', 'restored')
      recovered.button('Add object state').dispatchEvent(new Event('click'))
      recovered.button('Move object state up').dispatchEvent(new Event('click'))
      expect(recovered.control('Object state ID').value).toBe('state')
      recovered.button('Remove object state').dispatchEvent(new Event('click'))
      expect(recovered.control('Object state ID').value).toBe('restored')
      recovered.editor.restoreDraft('undo')
      expect(recovered.control('Object state ID').value).toBe('state')
      await recovered.submit()
      expect(recovered.saved[0]).toMatchObject({
        map: { objects: [{ states: [{ id: 'state' }, { id: 'restored' }] }] },
      })
    } finally {
      ui.editor.dispose()
      recovered.editor.dispose()
    }
  })

  it('requires a boolean Rules flag before adding object states and replaces state-only terrain references', () => {
    const ui = setup(triggerView())

    try {
      ui.button('Place or edit map objects').dispatchEvent(new Event('click'))
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      expect(ui.button('Add object state').disabled).toBe(true)
      const model = new MapDraft()
      model.addTerrain('open-art')
      model.data.objects = [
        {
          id: 'chest',
          label: 'Chest',
          terrain: 'ground',
          action: 'inspect',
          x: 1,
          y: 1,
          states: [{ id: 'open', when: { path: ['opened'], value: true }, terrain: 'open-art' }],
        },
      ]
      expect(() => model.removeTerrain('open-art')).toThrow('replacementRequired')
      model.removeTerrain('open-art', 'ground')
      expect(model.data.objects[0]!.states![0]!.terrain).toBe('ground')
    } finally {
      ui.editor.dispose()
    }
  })

  it('places and edits map objects on the grid, recovers unfinished fields and restores removal through undo', async () => {
    const ui = setup(triggerView())
    const recovered = setup(triggerView())

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      ui.button('Place or edit map objects').dispatchEvent(new Event('click'))
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      expect(ui.document.activeElement?.value).toBe('object')
      expect(ui.button('Place or edit map objects').attributes.get('aria-pressed')).toBe('true')
      ui.edit('Object label', 'Chest')
      ui.edit('Object action', 'inspect', 'change')
      expect(ui.tile(1, 1).title).toContain('Chest')
      expect(
        ui
          .tile(1, 1)
          .all()
          .some((node) => node.dataset.mapObject === 'object'),
      ).toBe(true)
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: {
          objects: [
            {
              id: 'object',
              label: 'Chest',
              x: 1,
              y: 1,
              terrain: 'wall',
              action: 'inspect',
              blocking: true,
            },
          ],
        },
      })
      ui.edit('Object label', '')
      expect(
        restoreEditorDrafts(
          recovered.root.asElement(),
          JSON.parse(JSON.stringify(captureEditorDrafts(ui.root.asElement()))),
        ),
      ).toEqual([])
      expect(recovered.button('Place or edit map objects').attributes.get('aria-pressed')).toBe(
        'true',
      )
      expect(recovered.control('Object label').value).toBe('')
      recovered.edit('Object label', 'Recovered chest')
      recovered.button('Remove map object').dispatchEvent(new Event('click'))
      expect(
        recovered
          .tile(1, 1)
          .all()
          .some((node) => node.dataset.mapObject === 'object'),
      ).toBe(false)
      recovered.editor.restoreDraft('undo')
      expect(recovered.tile(1, 1).title).toContain('Recovered chest')
      recovered.editor.restoreDraft('redo')
      await recovered.submit()
      expect(recovered.saved[0]).toMatchObject({ map: { objects: [] } })
    } finally {
      ui.editor.dispose()
      recovered.editor.dispose()
    }
  })

  it('requires saved actions for new objects and protects spawn tiles during grid placement', () => {
    const ui = setup(triggerView())
    const empty = setup()

    try {
      ui.button('Place or edit map objects').dispatchEvent(new Event('click'))
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      expect(ui.root.textContent).toContain('Choose a tile away from player spawns')
      expect(ui.editor.hasDrafts()).toBe(false)
      empty.button('Place or edit map objects').dispatchEvent(new Event('click'))
      empty.tile(1, 1).dispatchEvent(new Event('click'))
      expect(empty.root.textContent).toContain('Create and save an action in Rules')
      expect(empty.button('Add map object').disabled).toBe(true)
      const model = new MapDraft()
      model.addTerrain('object-art')
      model.data.objects = [
        { id: 'art', label: 'Art', terrain: 'object-art', action: 'inspect', x: 1, y: 1 },
      ]
      expect(() => model.removeTerrain('object-art')).toThrow('replacementRequired')
      model.removeTerrain('object-art', 'ground')
      expect(model.data.objects[0]!.terrain).toBe('ground')
    } finally {
      ui.editor.dispose()
      empty.editor.dispose()
    }
  })

  it('shows trigger badges with action details alongside spawn markers and opens existing triggers without dirtying the map', async () => {
    const ui = setup(triggerView())

    try {
      expect(hasMarker(ui.tile(0, 0))).toBe(true)
      expect(
        ui
          .tile(0, 0)
          .all()
          .some((element) => element.className === 'map-spawn-marker'),
      ).toBe(true)
      expect(ui.tile(0, 0).title).toContain('Trigger depart: travel, zero-based tile (0, 0)')
      expect(ui.tile(2, 2).attributes.get('aria-label')).toContain('Trigger return: inspect')
      ui.button('Edit tile-entry triggers').dispatchEvent(new Event('click'))
      expect(ui.button('Edit tile-entry triggers').attributes.get('aria-pressed')).toBe('true')
      ui.tile(2, 2).dispatchEvent(new Event('click'))
      expect(ui.document.activeElement?.value).toBe('return')
      expect(ui.tile(2, 2).attributes.get('aria-selected')).toBe('true')
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.editor.draftHistory().canUndo).toBe(false)
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: { entryTriggers: [{ id: 'depart' }, { id: 'return' }] },
      })
    } finally {
      ui.editor.dispose()
    }
  })

  it('adds exactly one trigger with a pointer gesture without painting, dragging or duplicating an existing trigger', async () => {
    const current = triggerView()
    current.maps!.gates!.entryTriggers = []
    const ui = setup(current)

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      ui.button('Edit tile-entry triggers').dispatchEvent(new Event('click'))
      ui.tile(1, 2).dispatchEvent(
        Object.assign(new Event('pointerdown', { cancelable: true }), { button: 0, pointerId: 1 }),
      )
      ui.tile(2, 1).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))
      ui.document.dispatchEvent(new Event('pointerup'))
      ui.tile(1, 2).dispatchEvent(Object.assign(new Event('click'), { detail: 1 }))
      expect(ui.control('Trigger tile X').value).toBe('1')
      expect(ui.control('Trigger tile Y').value).toBe('2')
      expect(ui.tile(1, 2).attributes.get('aria-label')).toContain('ground')
      expect(ui.tile(2, 1).attributes.get('aria-label')).toContain('ground')
      expect(hasMarker(ui.tile(2, 1))).toBe(false)
      ui.tile(1, 2).dispatchEvent(new Event('click'))
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: { entryTriggers: [{ id: 'entry', x: 1, y: 2, action: 'travel' }] },
      })
      ui.editor.restoreDraft('undo')
      expect(hasMarker(ui.tile(1, 2))).toBe(false)
      expect(ui.editor.hasDrafts()).toBe(false)
      ui.editor.restoreDraft('redo')
      expect(hasMarker(ui.tile(1, 2))).toBe(true)
      ui.button('Remove tile-entry trigger').dispatchEvent(new Event('click'))
      expect(hasMarker(ui.tile(1, 2))).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('updates markers immediately after form edits and restores the selected trigger through draft recovery', () => {
    const ui = setup(triggerView())
    const recovered = setup(triggerView())

    try {
      ui.button('Edit tile-entry triggers').dispatchEvent(new Event('click'))
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      ui.edit('Trigger ID', 'new-exit')
      ui.edit('Trigger tile X', '1')
      ui.edit('Trigger tile Y', '2')
      ui.edit('Entry action', 'inspect', 'change')
      expect(hasMarker(ui.tile(0, 0))).toBe(false)
      expect(ui.tile(1, 2).title).toContain('Trigger new-exit: inspect, zero-based tile (1, 2)')
      expect(ui.tile(1, 2).attributes.get('aria-selected')).toBe('true')
      ui.edit('Trigger ID', '')
      const drafts = JSON.parse(JSON.stringify(captureEditorDrafts(ui.root.asElement())))
      expect(restoreEditorDrafts(recovered.root.asElement(), drafts)).toEqual([])
      expect(recovered.button('Edit tile-entry triggers').attributes.get('aria-pressed')).toBe(
        'true',
      )
      expect(recovered.tile(1, 2).title).toContain('inspect')
      recovered.tile(1, 2).dispatchEvent(new Event('click'))
      expect(recovered.document.activeElement?.value).toBe('')
      expect(recovered.control('Trigger tile X').value).toBe('1')
      expect(recovered.tile(1, 2).attributes.get('aria-selected')).toBe('true')
    } finally {
      ui.editor.dispose()
      recovered.editor.dispose()
    }
  })

  it('supports arrow navigation and Enter/Space activation, suppresses tile clipboard shortcuts, and exits trigger mode with Escape', async () => {
    const ui = setup(triggerView())

    const press = (x: number, y: number, key: string, extra: Record<string, boolean> = {}) => {
      const event = Object.assign(new Event('keydown', { cancelable: true }), { key, ...extra })
      ui.tile(x, y).dispatchEvent(event)

      return event
    }

    try {
      ui.button('Edit tile-entry triggers').dispatchEvent(new Event('click'))
      ui.tile(0, 1).focus()
      press(0, 1, 'ArrowRight', { shiftKey: true })
      expect(ui.document.activeElement).toBe(ui.tile(1, 1))
      press(1, 1, 'Enter')
      expect(ui.document.activeElement?.value).toBe('entry')
      expect(hasMarker(ui.tile(1, 1))).toBe(true)
      expect(press(1, 1, 'x', { ctrlKey: true }).defaultPrevented).toBe(true)
      press(2, 2, ' ')
      expect(ui.document.activeElement?.value).toBe('return')
      press(2, 2, 'Escape')
      expect(ui.control('Paint tool').value).toBe('paint')
      expect(hasMarker(ui.tile(1, 1))).toBe(true)
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: { entryTriggers: [{ id: 'depart' }, { id: 'return' }, { id: 'entry', x: 1, y: 1 }] },
      })
    } finally {
      ui.editor.dispose()
    }
  })

  it('rejects new triggers on blocked ground or collision layers and requires Rules while allowing existing triggers to be edited', () => {
    const current = triggerView()
    current.maps!.gates!.layers = [
      {
        id: 'objects',
        tiles: [
          [null, null, null],
          [null, 'wall', null],
          [null, null, null],
        ],
      },
    ]
    const ui = setup(current)
    const withoutRules = setup({ ...current, rules: { state: [], actions: {} } })

    try {
      ui.button('Edit tile-entry triggers').dispatchEvent(new Event('click'))

      for (const [x, y] of [
        [1, 0],
        [1, 1],
      ]) {
        ui.tile(x!, y!).dispatchEvent(new Event('click'))
        expect(ui.root.textContent).toContain('Choose a walkable tile')
        expect(ui.editor.hasDrafts()).toBe(false)
      }

      withoutRules.button('Edit tile-entry triggers').dispatchEvent(new Event('click'))
      withoutRules.tile(0, 2).dispatchEvent(new Event('click'))
      expect(withoutRules.root.textContent).toContain('Create and save an action in Rules')
      expect(withoutRules.editor.hasDrafts()).toBe(false)
      withoutRules.tile(2, 2).dispatchEvent(new Event('click'))
      expect(withoutRules.document.activeElement?.value).toBe('return')
      expect(withoutRules.editor.hasDrafts()).toBe(false)
    } finally {
      ui.editor.dispose()
      withoutRules.editor.dispose()
    }
  })

  it('edits map triggers independently of hidden paint layers and keeps badges through zoom while respecting busy state', () => {
    const current = triggerView()
    current.maps!.gates!.layers = [
      {
        id: 'hidden',
        visible: false,
        tiles: [
          [null, null, null],
          [null, 'wall', null],
          [null, null, null],
        ],
      },
    ]
    const ui = setup(current)

    try {
      ui.edit('Paint layer', 'hidden', 'change')
      ui.button('Edit tile-entry triggers').dispatchEvent(new Event('click'))
      ui.tile(1, 1).dispatchEvent(new Event('click'))
      expect(hasMarker(ui.tile(1, 1))).toBe(true)
      ui.button('Zoom in').dispatchEvent(new Event('click'))
      expect(hasMarker(ui.tile(1, 1))).toBe(true)
      expect(ui.tile(1, 1).attributes.get('aria-selected')).toBe('true')
      ui.editor.render(state(current, { busy: true }), false)
      ui.tile(0, 2).dispatchEvent(new Event('click'))
      expect(hasMarker(ui.tile(0, 2))).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('authors, recovers, undoes and removes tile-entry triggers without losing unfinished fields', async () => {
    const current = {
      ...view,
      rules: { state: [], actions: { travel: [{ when: [], effects: [] }] } },
    }

    const first = setup(current)
    const recovered = setup(current)

    try {
      first.button('Add tile-entry trigger').dispatchEvent(new Event('click'))
      first.edit('Trigger ID', 'exit')
      first.edit('Trigger tile X', '2')
      first.edit('Trigger tile Y', '3')
      expect(first.control('Entry action').value).toBe('travel')
      await first.submit()
      expect(first.saved[0]).toMatchObject({
        type: 'game.upsertMap',
        map: { entryTriggers: [{ id: 'exit', x: 2, y: 3, action: 'travel' }] },
      })
      first.edit('Trigger ID', '')
      const drafts = JSON.parse(JSON.stringify(captureEditorDrafts(first.root.asElement())))
      expect(restoreEditorDrafts(recovered.root.asElement(), drafts)).toEqual([])
      expect(recovered.control('Trigger ID').value).toBe('')
      expect(recovered.control('Trigger tile X').value).toBe('2')
      expect(recovered.control('Trigger tile Y').value).toBe('3')
      await recovered.submit()
      expect(recovered.saved).toEqual([])
      recovered.edit('Trigger ID', 'exit')
      recovered.button('Remove tile-entry trigger').dispatchEvent(new Event('click'))
      recovered.editor.restoreDraft('undo')
      expect(recovered.control('Trigger ID').value).toBe('exit')
      recovered.editor.restoreDraft('redo')
      await recovered.submit()
      expect(recovered.saved[0]).toMatchObject({
        type: 'game.upsertMap',
        map: { entryTriggers: [] },
      })
    } finally {
      first.editor.dispose()
      recovered.editor.dispose()
    }
  })

  it('requires a saved Rules action before adding triggers', () => {
    const ui = setup()

    try {
      expect(ui.button('Add tile-entry trigger').disabled).toBe(true)
      expect(ui.root.textContent).toContain('Create and save an action in Rules')
    } finally {
      ui.editor.dispose()
    }
  })

  it('chooses an unused tile after editing another trigger position', async () => {
    const ui = setup({
      ...view,
      rules: { state: [], actions: { travel: [{ when: [], effects: [] }] } },
    })

    try {
      ui.button('Add tile-entry trigger').dispatchEvent(new Event('click'))
      ui.edit('Trigger tile X', '1')
      ui.button('Add tile-entry trigger').dispatchEvent(new Event('click'))
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        type: 'game.upsertMap',
        map: {
          entryTriggers: [
            { id: 'entry', x: 1, y: 0, action: 'travel' },
            { id: 'entry-2', x: 0, y: 0, action: 'travel' },
          ],
        },
      })
    } finally {
      ui.editor.dispose()
    }
  })

  it('recovers painted tiles, an unsaved map ID and pending dimensions without saving', async () => {
    const first = setup()
    const second = setup()

    try {
      first.edit('Map ID', 'recovered-map')
      first.edit('Paint terrain', 'wall', 'change')
      first.tile(0, 0).dispatchEvent(new Event('click'))
      first.edit('Width in tiles', '18')
      const drafts = JSON.parse(JSON.stringify(captureEditorDrafts(first.root.asElement())))
      expect(restoreEditorDrafts(second.root.asElement(), drafts)).toEqual([])
      expect(second.control('Map ID').value).toBe('recovered-map')
      expect(second.control('Width in tiles').value).toBe('18')
      expect(second.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      expect(second.editor.hasDrafts()).toBe(true)
      expect(second.saved).toEqual([])
    } finally {
      first.editor.dispose()
      second.editor.dispose()
    }
  })

  it('selects rectangles by dragging, copies groups, previews keyboard paste, and moves only the active layer', async () => {
    const map = new MapDraft()
    map.resize(8, 6, 'ground')
    map.addLayer('buildings')
    map.paint(1, 1, 'wall', 'buildings')
    map.paint(2, 1, 'wall', 'buildings')
    map.paint(1, 2, 'wall', 'buildings')
    const current = { ...view, game: { ...view.game!, maps: ['city'] }, maps: { city: map.data } }
    const ui = setup(current)

    const key = (x: number, y: number, key: string, extra: Record<string, boolean> = {}) =>
      ui
        .tile(x, y)
        .dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key, ...extra }))

    try {
      ui.edit('Paint layer', 'buildings', 'change')
      ui.edit('Paint tool', 'select', 'change')
      ui.tile(1, 1).dispatchEvent(
        Object.assign(new Event('pointerdown', { cancelable: true }), { button: 0, pointerId: 1 }),
      )
      ui.tile(2, 2).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))
      ui.document.dispatchEvent(new Event('pointerup'))
      ui.tile(2, 2).dispatchEvent(Object.assign(new Event('click'), { detail: 1 }))
      expect(
        ui.root
          .all()
          .filter(
            (element) =>
              element.attributes.get('role') === 'gridcell' &&
              element.attributes.get('aria-selected') === 'true',
          ),
      ).toHaveLength(4)
      expect(ui.editor.hasDrafts()).toBe(false)
      ui.button('Copy selection').dispatchEvent(new Event('click'))
      expect(ui.control('Paint tool').value).toBe('paste')
      expect(ui.document.activeElement).toBe(ui.tile(2, 2))
      expect(ui.editor.hasDrafts()).toBe(false)
      key(4, 1, 'v', { ctrlKey: true })
      expect(
        ui
          .tile(4, 1)
          .children.some(
            (child) => typeof child !== 'string' && child.className === 'map-paste-ghost',
          ),
      ).toBe(true)
      key(4, 1, 'Enter')
      expect(ui.tile(4, 1).attributes.get('aria-label')).toContain('wall')
      expect(ui.tile(1, 1).attributes.get('aria-label')).toContain('wall')
      key(4, 1, 'x', { ctrlKey: true })
      key(7, 5, 'Enter')
      expect(ui.root.textContent).toContain('entire copied group must fit')
      expect(ui.tile(4, 1).attributes.get('aria-label')).toContain('wall')
      key(0, 3, 'Enter')
      expect(ui.tile(4, 1).attributes.get('aria-label')).toContain('Empty')
      expect(ui.tile(0, 3).attributes.get('aria-label')).toContain('wall')
      await ui.submit()
      const command = ui.saved[0]!

      if (command.type !== 'game.upsertMap') throw new Error('Expected a saved map')
      expect(command.map.tiles.every((row) => row.every((tile) => tile === 'ground'))).toBe(true)
      expect(command.map.layers![0]!.tiles[1]![4]).toBeNull()
      expect(command.map.layers![0]!.tiles[3]![0]).toBe('wall')
      const next = { ...current, revision: 'two', maps: { city: command.map } }
      ui.editor.render(state(next, { preserveDrafts: true, lastCommand: command.type }), true)
      expect(ui.control('Paint tool').value).toBe('paste')
      expect(ui.button('Paste tiles').disabled).toBe(false)
      expect(ui.editor.navigate(undefined, true)).toBe(true)
      expect(ui.button('Paste tiles').disabled).toBe(true)
    } finally {
      ui.editor.dispose()
    }
  })

  it('extends keyboard selections across map pages, cancels moves, and leaves text fields and hidden layers alone', () => {
    const map = new MapDraft()
    map.resize(30, 20, 'ground')
    map.addLayer('buildings')
    map.paint(23, 15, 'wall', 'buildings')
    const ui = setup({ ...view, game: { ...view.game!, maps: ['city'] }, maps: { city: map.data } })

    const key = (x: number, y: number, key: string, extra: Record<string, boolean> = {}) =>
      ui
        .tile(x, y)
        .dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key, ...extra }))

    try {
      ui.edit('Paint layer', 'buildings', 'change')
      ui.edit('Paint tool', 'select', 'change')
      key(23, 15, 'Enter')
      key(23, 15, 'ArrowRight', { shiftKey: true })
      key(24, 15, 'ArrowDown', { shiftKey: true })
      expect(ui.root.textContent).toContain('Selection: 2 × 2, column 23, row 15')
      key(24, 16, 'x', { metaKey: true })
      expect(ui.root.textContent).toContain('Move ready: 2 × 2')
      key(24, 16, 'Escape')
      expect(ui.tile(23, 15).attributes.get('aria-label')).toContain('wall')
      expect(ui.root.textContent).not.toContain('Move ready:')

      const textCopy = Object.assign(new Event('keydown', { cancelable: true }), {
        key: 'c',
        ctrlKey: true,
      })

      ui.control('Layer name').dispatchEvent(textCopy)
      expect(textCopy.defaultPrevented).toBe(false)
      ui.edit('Layer visible', 'no', 'change')
      key(24, 16, 'v', { ctrlKey: true })
      key(24, 16, 'Enter')
      expect(ui.tile(24, 16).attributes.get('aria-label')).toContain('Empty')
    } finally {
      ui.editor.dispose()
    }
  })

  it('paints and erases objects without touching ground and retains the active layer after saving', async () => {
    const ui = setup()

    try {
      ui.edit('New layer ID', 'objects')
      ui.button('Add overlay layer').dispatchEvent(new Event('click'))
      ui.edit('Layer name', 'Trees')
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      expect(
        ui
          .tile(0, 0)
          .children.some(
            (child) => typeof child !== 'string' && child.dataset.mapLayer === 'objects',
          ),
      ).toBe(true)
      ui.edit('Paint tool', 'erase', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('Empty')
      ui.edit('Paint tool', 'paint', 'change')
      ui.tile(1, 0).dispatchEvent(new Event('click'))
      ui.edit('Paint tool', 'erase', 'change')
      ui.edit('Width in tiles', '18')
      await ui.submit()
      const command = ui.saved[0]!
      expect(command.type).toBe('game.upsertMap')

      if (command.type !== 'game.upsertMap') throw new Error('Expected a saved map')
      expect(command.map.tiles[0]!.slice(0, 2)).toEqual(['ground', 'ground'])
      expect(command.map.tiles[0]![17]).toBe('ground')
      expect(command.map.layers![0]!.tiles[0]![17]).toBeNull()
      expect(command.map.layers![0]).toMatchObject({ id: 'objects', name: 'Trees' })
      expect(command.map.layers![0]!.tiles[0]!.slice(0, 2)).toEqual([null, 'wall'])

      const next = inspectProject({
        ...applyCommand({ revision: 'one', documents }, command).project,
        revision: 'two',
      })

      ui.editor.render(state(next, { preserveDrafts: true, lastCommand: command.type }), true)
      expect(ui.control('Paint layer').value).toBe('objects')
      expect(ui.control('Paint terrain').value).toBe('wall')
      expect(ui.control('Paint tool').value).toBe('erase')
      ui.edit('Paint layer', '', 'change')
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('ground')
      expect(
        ui
          .tile(1, 0)
          .children.some(
            (child) => typeof child !== 'string' && child.dataset.mapLayer === 'objects',
          ),
      ).toBe(true)
    } finally {
      ui.editor.dispose()
    }
  })

  it('hides layers, clears only the active layer after confirmation, and safely removes a layer', async () => {
    const ui = setup()

    try {
      ui.edit('New layer ID', 'objects')
      ui.button('Add overlay layer').dispatchEvent(new Event('click'))
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      ui.edit('Layer visible', 'no', 'change')
      ui.tile(1, 0).dispatchEvent(new Event('click'))
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('Empty')
      expect(ui.tile(0, 0).children).toHaveLength(0)
      ui.edit('Layer visible', 'yes', 'change')
      ui.confirm.mockReturnValueOnce(false)
      ui.button('Clear layer').dispatchEvent(new Event('click'))
      await vi.waitFor(() => expect(ui.confirm).toHaveBeenCalledOnce())
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      ui.button('Clear layer').dispatchEvent(new Event('click'))
      await vi.waitFor(() => expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('Empty'))
      ui.button('Remove layer').dispatchEvent(new Event('click'))
      await vi.waitFor(() => expect(ui.control('Paint layer').value).toBe(''))
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
    } finally {
      ui.editor.dispose()
    }
  })

  it('creates tilesets, selects image overlays and image-only terrain, paints and saves without JSON editing', async () => {
    const assets = assetCatalogSchema.parse({
      'schema-version': '1.0.0',
      images: {
        sheet: {
          format: 'png',
          source: 'assets/sheet.png',
          bounds: { x: 0, y: 0, width: 64, height: 32 },
        },
      },
    })

    const ui = setup({ ...view, assets })

    try {
      ui.edit('New tileset ID', 'nature')
      ui.button('Add tileset').dispatchEvent(new Event('click'))
      expect(ui.control('Tile width (pixels)').value).toBe('32')

      const tile = ui.root
        .all()
        .find((element) => element.attributes.get('aria-label') === 'Use tile at column 1, row 0')!

      tile.dispatchEvent(new Event('click'))
      expect(ui.control('Terrain tileset').value).toBe('nature')
      await vi.waitFor(() => expect(ui.tile(0, 0).style.backgroundImage).toBe('url("blob:sheet")'))
      expect(ui.tile(0, 0).style.backgroundPosition).toBe('100% 0%')
      expect(ui.tile(0, 0).style.backgroundColor).toBe('#608c4f')
      ui.edit('Use base color', 'no', 'change')
      expect(ui.tile(0, 0).style.backgroundColor).toBe('transparent')
      ui.button('Remove tileset').dispatchEvent(new Event('click'))
      expect(ui.root.textContent).toContain('Remove or replace terrain image selections')
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        map: {
          tilesets: { nature: { image: 'sheet', tileWidth: 32, tileHeight: 32 } },
          terrain: { ground: { tile: { tileset: 'nature', column: 1, row: 0 } } },
        },
      })
      expect(
        ui.saved[0]!.type === 'game.upsertMap' && ui.saved[0]!.map.terrain.ground!.color,
      ).toBeUndefined()
      ui.edit('Terrain tileset', '', 'change')
      expect(ui.tile(0, 0).style.backgroundImage).toBe('none')
      expect(ui.tile(0, 0).style.backgroundColor).toBe('#608c4f')
      ui.button('Remove tileset').dispatchEvent(new Event('click'))
      expect(ui.root.textContent).not.toContain('Selected tile:')
    } finally {
      ui.editor.dispose()
    }
  })

  it('creates a map through controls, saves palette and tiles, and lists it in the explorer', async () => {
    const ui = setup()

    try {
      ui.edit('Map ID', 'garden')
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      ui.edit('New terrain ID', 'water')
      ui.button('Add terrain').dispatchEvent(new Event('click'))
      ui.edit('Terrain color', '#2266aa')
      ui.edit('Walkable', 'no', 'change')
      ui.edit('Movement time (ms)', '300')
      ui.edit('Paint terrain', 'water', 'change')
      ui.tile(1, 0).dispatchEvent(new Event('click'))
      await ui.submit()
      expect(ui.saved[0]).toMatchObject({
        type: 'game.upsertMap',
        mapId: 'garden',
        createOnly: true,
        map: { terrain: { water: { color: '#2266aa', walkable: false, movementCostMs: 300 } } },
      })
      const command = ui.saved[0]!

      if (command.type !== 'game.upsertMap') throw new Error('Expected map command')
      expect(command.map.tiles[0]!.slice(0, 3)).toEqual(['wall', 'water', 'ground'])
      const result = applyCommand({ revision: 'one', documents }, command)
      const next = inspectProject(result.project)
      ui.editor.render(state(next, { preserveDrafts: true, lastCommand: command.type }), true)
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.selected).toHaveBeenLastCalledWith('garden')
      expect(mapFileNodes(next, editorLocalization().t).map((node) => node.key)).toEqual([
        'map:garden',
        'map-new',
      ])
      expect(ui.control('Map ID').readOnly).toBe(true)
    } finally {
      ui.editor.dispose()
    }
  })

  it('keeps painted drafts through conflicts, unrelated saves and language changes, and guards navigation', () => {
    const ui = setup()

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      ui.editor.render(
        state(view, { error: 'Conflict', conflict: true, preserveDrafts: true }),
        false,
      )
      const updated = { ...view, revision: 'two', game: { ...view.game!, title: 'Changed' } }
      ui.editor.render(
        state(updated, { preserveDrafts: true, lastCommand: 'game.updateMetadata' }),
        true,
      )
      expect(ui.editor.hasDrafts()).toBe(true)
      expect(ui.editor.navigate('other')).toBe(false)
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      ui.language('nl')
      ui.editor.render(state(updated, { preserveDrafts: true }), false)
      expect(ui.tile(0, 0).attributes.get('aria-label')).toBe('Kolom 0, rij 0: wall')
      ui.button('Kaartwijzigingen verwerpen').dispatchEvent(new Event('click'))
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
    } finally {
      ui.editor.dispose()
    }
  })

  it('supports drag painting and keyboard navigation while stopping strokes after pointer release', async () => {
    const ui = setup()

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(
        Object.assign(new Event('pointerdown', { cancelable: true }), { button: 0, pointerId: 1 }),
      )
      ui.tile(1, 0).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))
      ui.document.dispatchEvent(new Event('pointerup'))
      ui.tile(2, 0).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('wall')
      expect(ui.tile(2, 0).attributes.get('aria-label')).toContain('ground')
      ui.tile(0, 0).dispatchEvent(Object.assign(new Event('keydown'), { key: 'ArrowRight' }))
      expect(ui.document.activeElement).toBe(ui.tile(1, 0))
      ui.editor.render(state(view, { busy: true, preserveDrafts: true }), false)
      ui.tile(2, 0).dispatchEvent(new Event('click'))
      await ui.submit()
      expect(ui.saved).toEqual([])
      expect(ui.tile(2, 0).attributes.get('aria-label')).toContain('ground')
    } finally {
      ui.editor.dispose()
    }
  })

  it('confirms cropping and fills, keeps canceled changes intact, and applies dimensions when saving', async () => {
    const ui = setup()

    try {
      ui.edit('Width in tiles', '2')
      ui.edit('Height in tiles', '2')
      ui.confirm.mockReturnValueOnce(false)
      ui.button('Apply size').dispatchEvent(new Event('click'))
      await Promise.resolve()
      await Promise.resolve()
      expect(
        ui.root.all().filter((element) => element.attributes.get('role') === 'gridcell'),
      ).toHaveLength(192)
      ui.edit('Paint terrain', 'wall', 'change')
      ui.button('Fill map with selected terrain').dispatchEvent(new Event('click'))
      await Promise.resolve()
      await Promise.resolve()
      await ui.submit()
      await vi.waitFor(() => expect(ui.saved).toHaveLength(1))
      const command = ui.saved[0]!
      expect(command).toMatchObject({
        map: {
          width: 2,
          height: 2,
          tiles: [
            ['wall', 'wall'],
            ['wall', 'wall'],
          ],
        },
      })
    } finally {
      ui.editor.dispose()
    }
  })

  it('notifies explorer navigation only when the map selection changes successfully', () => {
    const map = new MapDraft().data
    const current = { ...view, game: { ...view.game!, maps: ['garden'] }, maps: { garden: map } }
    const ui = setup(current)

    try {
      ui.edit('Map', '', 'change')
      expect(ui.navigated).toHaveBeenLastCalledWith(undefined)
      expect(ui.control('Map ID').value).toBe('new-map')
      ui.edit('Map ID', 'draft')
      ui.edit('Map', 'garden', 'change')
      expect(ui.navigated).toHaveBeenCalledTimes(1)
      expect(ui.control('Map').value).toBe('')
      ui.button('Discard map draft').dispatchEvent(new Event('click'))
      ui.edit('Map', 'garden', 'change')
      expect(ui.navigated).toHaveBeenLastCalledWith('garden')
      expect(ui.control('Map ID').value).toBe('garden')
    } finally {
      ui.editor.dispose()
    }
  })

  it('waits for crop confirmation and prevents duplicate saves and painting while it is open', async () => {
    const ui = setup()
    let answer: (value: boolean) => void = () => {}

    ui.confirm.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        answer = resolve
      }),
    )

    try {
      ui.edit('Width in tiles', '2')
      const saving = ui.submit()
      await ui.submit()
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      expect(ui.saved).toHaveLength(0)
      expect(ui.confirm).toHaveBeenCalledTimes(1)
      answer(true)
      await saving
      await vi.waitFor(() => expect(ui.saved).toHaveLength(1))
      expect(ui.saved[0]).toMatchObject({ map: { width: 2 } })
    } finally {
      ui.editor.dispose()
    }
  })

  it('limits the visible grid for large maps and pans when keyboard focus leaves the window', () => {
    const map = new MapDraft()
    map.resize(30, 20, 'ground')
    const current = { ...view, game: { ...view.game!, maps: ['large'] }, maps: { large: map.data } }
    const ui = setup(current)

    try {
      expect(
        ui.root.all().filter((element) => element.attributes.get('role') === 'gridcell'),
      ).toHaveLength(384)
      ui.tile(23, 0).dispatchEvent(Object.assign(new Event('keydown'), { key: 'ArrowRight' }))
      expect(ui.document.activeElement).toBe(ui.tile(24, 0))
      ui.button('Next rows').dispatchEvent(new Event('click'))
      expect(ui.tile(1, 19)).toBeDefined()
      ui.edit('Paint terrain', 'wall', 'change')
      expect(ui.tile(1, 19)).toBeDefined()
      ui.edit('New layer ID', 'objects')
      ui.button('Add overlay layer').dispatchEvent(new Event('click'))
      expect(ui.tile(1, 19).attributes.get('aria-label')).toContain('Empty')
      expect(
        ui.root.all().filter((element) => element.attributes.get('role') === 'gridcell'),
      ).toHaveLength(384)
    } finally {
      ui.editor.dispose()
    }
  })
})

describe('unsaved map history', () => {
  const savedView = (map = new MapDraft().data) => ({
    ...view,
    game: { ...view.game!, maps: ['city'] },
    maps: { city: map },
  })

  const press = (element: Element, key: string, extra: Record<string, boolean> = {}) => {
    const event = Object.assign(new Event('keydown', { cancelable: true }), { key, ...extra })
    element.dispatchEvent(event)

    return event
  }

  const start = (element: Element) =>
    element.dispatchEvent(
      Object.assign(new Event('pointerdown', { cancelable: true }), { button: 0, pointerId: 1 }),
    )

  it('undoes an entire paint or erase drag in one step, without saving or losing redo on no-op strokes', () => {
    const map = new MapDraft()
    map.addLayer('objects')
    const ui = setup(savedView(map.data))

    try {
      ui.edit('Paint layer', 'objects', 'change')
      ui.edit('Paint terrain', 'wall', 'change')
      expect(ui.button('Undo map edit').disabled).toBe(true)
      start(ui.tile(0, 0))
      ui.tile(1, 0).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))
      ui.tile(2, 0).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))
      expect(ui.button('Undo map edit').disabled).toBe(false)
      ui.document.dispatchEvent(new Event('pointerup'))
      ui.button('Undo map edit').dispatchEvent(new Event('click'))

      for (const x of [0, 1, 2])
        expect(ui.tile(x, 0).attributes.get('aria-label')).toContain('Empty')
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.button('Undo map edit').disabled).toBe(true)
      ui.edit('Paint tool', 'erase', 'change')
      start(ui.tile(0, 0))
      ui.document.dispatchEvent(new Event('pointerup'))
      expect(ui.button('Redo map edit').disabled).toBe(false)
      expect(press(ui.tile(0, 0), 'y', { ctrlKey: true }).defaultPrevented).toBe(true)

      for (const x of [0, 1, 2])
        expect(ui.tile(x, 0).attributes.get('aria-label')).toContain('wall')
      start(ui.tile(0, 0))
      ui.tile(1, 0).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))
      ui.document.dispatchEvent(new Event('pointerup'))
      press(ui.tile(0, 0), 'z', { metaKey: true })

      for (const x of [0, 1, 2])
        expect(ui.tile(x, 0).attributes.get('aria-label')).toContain('wall')
      press(ui.tile(0, 0), 'z', { metaKey: true, shiftKey: true })
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('Empty')
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('Empty')
      expect(ui.tile(2, 0).attributes.get('aria-label')).toContain('wall')
      press(ui.tile(0, 0), 'z', { ctrlKey: true })
      ui.edit('Paint tool', 'paint', 'change')
      ui.tile(3, 0).dispatchEvent(new Event('click'))
      expect(ui.button('Redo map edit').disabled).toBe(true)
      expect(ui.saved).toEqual([])
      ui.edit('Paint layer', '', 'change')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
    } finally {
      ui.editor.dispose()
    }
  })

  it.each(['pointercancel', 'blur', 'undo'] as const)('finishes a pending stroke on %s', (end) => {
    const ui = setup(savedView())

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      start(ui.tile(0, 0))
      ui.tile(1, 0).dispatchEvent(Object.assign(new Event('pointerenter'), { buttons: 1 }))

      if (end === 'blur') ui.document.defaultView.dispatchEvent(new Event('blur'))
      else if (end === 'pointercancel') ui.document.dispatchEvent(new Event('pointercancel'))
      ui.editor.restoreDraft('undo')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('ground')
      expect(ui.editor.hasDrafts()).toBe(false)
      ui.editor.restoreDraft('redo')
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('wall')
    } finally {
      ui.editor.dispose()
    }
  })

  it('restores overlapping moves and cross-layer pastes atomically and keeps the copied building reusable', () => {
    const map = new MapDraft()
    map.addLayer('buildings')
    map.addLayer('decorations')

    for (const y of [0, 1]) for (const x of [0, 1]) map.paint(x, y, 'wall', 'buildings')
    const ui = setup(savedView(map.data))

    try {
      ui.edit('Paint layer', 'buildings', 'change')
      ui.edit('Paint tool', 'select', 'change')
      press(ui.tile(0, 0), 'Enter')
      press(ui.tile(0, 0), 'ArrowRight', { shiftKey: true })
      press(ui.tile(1, 0), 'ArrowDown', { shiftKey: true })
      press(ui.tile(1, 1), 'x', { ctrlKey: true })
      expect(ui.editor.draftHistory().active).toBe(false)
      press(ui.tile(1, 0), 'Enter')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('Empty')
      expect(ui.tile(2, 1).attributes.get('aria-label')).toContain('wall')
      ui.editor.restoreDraft('undo')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      expect(ui.tile(2, 1).attributes.get('aria-label')).toContain('Empty')
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.control('Paint tool').value).toBe('select')
      expect(ui.button('Paste tiles').disabled).toBe(false)
      ui.editor.restoreDraft('redo')
      ui.edit('Paint layer', 'decorations', 'change')
      ui.button('Paste tiles').dispatchEvent(new Event('click'))
      press(ui.tile(4, 3), 'Enter')
      expect(ui.tile(5, 4).attributes.get('aria-label')).toContain('wall')
      ui.editor.restoreDraft('undo')
      expect(ui.control('Paint layer').value).toBe('decorations')
      expect(ui.tile(5, 4).attributes.get('aria-label')).toContain('Empty')
      ui.editor.restoreDraft('redo')
      expect(ui.tile(5, 4).attributes.get('aria-label')).toContain('wall')
      ui.edit('Paint layer', 'buildings', 'change')
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('wall')
      expect(ui.saved).toEqual([])
    } finally {
      ui.editor.dispose()
    }
  })

  it('undoes resize, fills, layer removal and metadata while leaving pending inputs and native text undo alone', async () => {
    const map = new MapDraft()
    map.addLayer('objects')
    const ui = setup(savedView(map.data))

    try {
      ui.edit('Paint layer', 'objects', 'change')
      const name = ui.control('Layer name')
      name.focus()
      ui.edit('Layer name', 'T')
      ui.edit('Layer name', 'Trees')
      expect(press(name, 'z', { ctrlKey: true }).defaultPrevented).toBe(false)
      name.dispatchEvent(new Event('blur'))
      ui.editor.restoreDraft('undo')
      expect(ui.control('Layer name').value).toBe('objects')
      expect(ui.editor.hasDrafts()).toBe(false)
      ui.editor.restoreDraft('redo')
      expect(ui.control('Layer name').value).toBe('Trees')
      ui.edit('Paint terrain', 'wall', 'change')
      ui.button('Fill selected layer').dispatchEvent(new Event('click'))
      await vi.waitFor(() => expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall'))
      ui.edit('Width in tiles', '18')
      ui.button('Apply size').dispatchEvent(new Event('click'))
      await Promise.resolve()
      ui.editor.restoreDraft('undo')
      expect(ui.control('Width in tiles').value).toBe('16')
      ui.editor.restoreDraft('redo')
      expect(ui.control('Width in tiles').value).toBe('18')
      ui.button('Remove layer').dispatchEvent(new Event('click'))
      await vi.waitFor(() => expect(ui.control('Paint layer').value).toBe(''))
      ui.editor.restoreDraft('undo')
      ui.edit('Paint layer', 'objects', 'change')
      expect(ui.control('Layer name').value).toBe('Trees')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      ui.editor.restoreDraft('undo')
      ui.edit('Width in tiles', '19')
      ui.editor.restoreDraft('undo')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('Empty')
      expect(ui.control('Width in tiles').value).toBe('19')
      expect(ui.editor.hasDrafts()).toBe(true)
    } finally {
      ui.editor.dispose()
    }
  })

  it('preserves draft history through failed saves, unrelated saves and language changes; clears it after save or discard', async () => {
    const current = savedView()
    const ui = setup(current)

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      await ui.submit()
      ui.editor.render(
        state(current, { error: 'Conflict', conflict: true, preserveDrafts: true }),
        false,
      )
      ui.editor.restoreDraft('undo')
      expect(ui.editor.hasDrafts()).toBe(false)
      const unrelated = { ...current, revision: 'two', game: { ...current.game, title: 'Changed' } }
      ui.editor.render(
        state(unrelated, { preserveDrafts: true, lastCommand: 'game.updateMetadata' }),
        true,
      )
      expect(ui.editor.draftHistory().canRedo).toBe(true)
      ui.language('nl')
      ui.editor.render(state(unrelated, { preserveDrafts: true }), false)
      ui.button('Kaartbewerking opnieuw uitvoeren').dispatchEvent(new Event('click'))
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
      await ui.submit()
      const command = ui.saved.at(-1)!

      if (command.type !== 'game.upsertMap') throw new Error('Expected map save')
      const next = { ...unrelated, revision: 'three', maps: { city: command.map } }
      ui.editor.render(state(next, { preserveDrafts: true, lastCommand: command.type }), true)
      expect(ui.editor.draftHistory().active).toBe(false)
      expect(ui.editor.hasDrafts()).toBe(false)
      ui.edit('Terrein tekenen', 'ground', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      ui.button('Kaartwijzigingen verwerpen').dispatchEvent(new Event('click'))
      expect(ui.editor.draftHistory().active).toBe(false)
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
    } finally {
      ui.editor.dispose()
    }
  })

  it('reloads clean maps after external changes and keeps local history dirty against a changed baseline', () => {
    const current = savedView()
    const ui = setup(current)
    const next = structuredClone(current)
    next.revision = 'two'
    next.maps.city.tiles[0]![1] = 'wall'

    try {
      ui.editor.render(state(next, { preserveDrafts: true }), true)
      expect(ui.tile(1, 0).attributes.get('aria-label')).toContain('wall')
      expect(ui.editor.hasDrafts()).toBe(false)
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      const external = structuredClone(next)
      external.revision = 'three'
      external.maps.city.tiles[0]![2] = 'wall'
      ui.editor.render(state(external, { preserveDrafts: true, changedElsewhere: true }), false)
      ui.editor.restoreDraft('undo')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
      expect(ui.tile(2, 0).attributes.get('aria-label')).toContain('ground')
      expect(ui.editor.hasDrafts()).toBe(true)
      ui.button('Discard map draft').dispatchEvent(new Event('click'))
      expect(ui.tile(2, 0).attributes.get('aria-label')).toContain('wall')
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.editor.draftHistory().active).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })
})

describe('map zoom and pan', () => {
  const largeView = () => {
    const map = new MapDraft()
    map.resize(64, 40, 'ground')
    map.addLayer('objects')

    return { ...view, game: { ...view.game!, maps: ['city'] }, maps: { city: map.data } }
  }

  const surface = (ui: ReturnType<typeof setup>) =>
    ui.root.all().find((element) => element.className.includes('map-canvas'))!

  const grid = (ui: ReturnType<typeof setup>) =>
    ui.root.all().find((element) => element.attributes.get('role') === 'grid')!

  const pointer = (target: Element, type: string, x: number, y: number, button = 0, buttons = 1) =>
    target.dispatchEvent(
      Object.assign(new Event(type, { cancelable: true }), {
        clientX: x,
        clientY: y,
        button,
        buttons,
        pointerId: 1,
      }),
    )

  const key = (target: Element, key: string, extra: Record<string, boolean> = {}) =>
    target.dispatchEvent(
      Object.assign(new Event('keydown', { cancelable: true }), { key, ...extra }),
    )

  const scroll = (ui: ReturnType<typeof setup>, left: number, top: number) => {
    surface(ui).scrollLeft = left
    surface(ui).scrollTop = top
    surface(ui).dispatchEvent(new Event('scroll'))
  }

  it('scrolls both axes across the entire map and keeps the minimap and pan controls synchronized', () => {
    const ui = setup(largeView())

    try {
      ui.document.resize(surface(ui), 280, 224)
      const extent = surface(ui).children[0]
      expect(extent).toMatchObject({ style: { width: '1792px', height: '1120px' } })
      scroll(ui, 140, 112)
      expect(ui.tile(5, 4)).toBeDefined()
      expect(ui.tile(14, 11)).toBeDefined()
      expect(grid(ui).style).toMatchObject({ left: '140px', top: '112px' })
      expect(ui.button('Navigate using minimap').attributes.get('aria-description')).toBe(
        'Columns 5–14, rows 4–11',
      )
      expect(
        ui.button('Navigate using minimap').querySelector('span')!.style.properties.get('width'),
      ).toBe('15.625%')
      expect(
        grid(ui)
          .all()
          .filter((cell) => cell.attributes.get('role') === 'gridcell'),
      ).toHaveLength(80)
      scroll(ui, 1512, 896)
      expect(ui.tile(54, 32)).toBeDefined()
      expect(ui.tile(63, 39)).toBeDefined()
      expect(ui.button('Pan right').disabled).toBe(true)
      expect(ui.button('Pan down').disabled).toBe(true)
      ui.button('Reset view').dispatchEvent(new Event('click'))
      expect(surface(ui)).toMatchObject({ scrollLeft: 0, scrollTop: 0 })
      expect(ui.tile(0, 0)).toBeDefined()
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.editor.draftHistory().active).toBe(false)
      expect(ui.saved).toEqual([])
    } finally {
      ui.editor.dispose()
    }
  })

  it('renders partially visible edge tiles and preserves the exact scroll position across tabs and resizing', () => {
    const ui = setup(largeView())

    try {
      ui.document.resize(surface(ui), 294, 238)
      scroll(ui, 147, 91)
      expect(() => ui.tile(16, 3)).toThrow()
      scroll(ui, 161, 91)
      expect(ui.tile(5, 3)).toBeDefined()
      expect(ui.tile(16, 11)).toBeDefined()
      scroll(ui, 161, 105)
      expect(ui.tile(16, 12)).toBeDefined()
      scroll(ui, 161, 91)
      expect(ui.button('Navigate using minimap').attributes.get('aria-description')).toBe(
        'Columns 5–16, rows 3–11',
      )
      const outline = ui.button('Navigate using minimap').querySelector('span')!
      expect(outline.style.properties.get('left')).toBe('8.984375%')
      expect(outline.style.properties.get('top')).toBe('8.125%')
      ui.button('Terrain & tilesets').dispatchEvent(new Event('click'))
      ui.button('Objects & triggers').dispatchEvent(new Event('click'))
      ui.button('Paint').dispatchEvent(new Event('click'))
      ui.document.resize(surface(ui), 294, 238)
      expect(surface(ui)).toMatchObject({ scrollLeft: 161, scrollTop: 91 })
      expect(ui.tile(16, 11)).toBeDefined()
      scroll(ui, 1498, 882)
      ui.button('Map settings').dispatchEvent(new Event('click'))
      ui.button('Paint').dispatchEvent(new Event('click'))
      ui.document.resize(surface(ui), 294, 238)
      expect(surface(ui)).toMatchObject({ scrollLeft: 1498, scrollTop: 882 })
      expect(ui.tile(63, 39)).toBeDefined()
      ui.document.resize(surface(ui), 448, 280)
      expect(ui.tile(63, 39)).toBeDefined()
      expect(ui.button('Pan right').disabled).toBe(true)
      expect(ui.button('Pan down').disabled).toBe(true)
      expect(ui.editor.hasDrafts()).toBe(false)
    } finally {
      ui.editor.dispose()
      expect(ui.document.observers.size).toBe(0)
    }
  })

  it('updates native scroll positions after minimap jumps, zoom and toolbar navigation', () => {
    const ui = setup(largeView())

    try {
      ui.document.resize(surface(ui), 294, 238)
      ui.button('Navigate using minimap').dispatchEvent(
        Object.assign(new Event('keydown', { cancelable: true }), { key: 'End' }),
      )
      expect(surface(ui)).toMatchObject({ scrollLeft: 1498, scrollTop: 882 })
      expect(ui.tile(63, 39)).toBeDefined()
      ui.button('Pan left').dispatchEvent(new Event('click'))
      expect(surface(ui).scrollLeft).toBe(1456)
      ui.edit('Map zoom', '200', 'change')
      expect(surface(ui).scrollLeft).toBeGreaterThan(1498)
      const extent = surface(ui).children[0]
      expect(extent).toMatchObject({ style: { width: '3584px', height: '2240px' } })
      expect(
        ui.button('Navigate using minimap').querySelector('span')!.style.properties.get('width'),
      ).toBe('8.203125%')
      ui.button('Reset view').dispatchEvent(new Event('click'))
      ui.button('Next columns').dispatchEvent(new Event('click'))
      ui.button('Next rows').dispatchEvent(new Event('click'))
      expect(surface(ui)).toMatchObject({ scrollLeft: 308, scrollTop: 252 })
      expect(ui.editor.draftHistory().active).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('finishes a stroke when scrolling without painting additional tiles or adding a navigation undo step', () => {
    const ui = setup(largeView())

    try {
      ui.document.resize(surface(ui), 280, 224)
      ui.edit('Paint terrain', 'wall', 'change')
      ui.document.resize(surface(ui), 280, 224)
      pointer(ui.tile(0, 0), 'pointerdown', 10, 10)
      scroll(ui, 140, 112)
      pointer(ui.tile(5, 4), 'pointerenter', 10, 10)
      expect(ui.tile(5, 4).attributes.get('aria-label')).toContain('ground')
      ui.editor.restoreDraft('undo')
      ui.document.resize(surface(ui), 280, 224)
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(surface(ui)).toMatchObject({ scrollLeft: 140, scrollTop: 112 })
      ui.button('Reset view').dispatchEvent(new Event('click'))
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
      ui.editor.restoreDraft('redo')
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('wall')
    } finally {
      ui.editor.dispose()
    }
  })

  it('reveals keyboard destinations and leaves the native scrollbar gutters usable in pan mode', () => {
    const ui = setup(largeView())

    try {
      ui.document.resize(surface(ui), 280, 224)
      key(ui.tile(9, 7), 'ArrowRight')
      expect(surface(ui)).toMatchObject({ scrollLeft: 28, scrollTop: 0 })
      expect(ui.document.activeElement).toBe(ui.tile(10, 7))
      key(ui.tile(10, 7), 'ArrowDown')
      expect(surface(ui)).toMatchObject({ scrollLeft: 28, scrollTop: 28 })
      expect(ui.document.activeElement).toBe(ui.tile(10, 8))
      ui.button('Pan map').dispatchEvent(new Event('click'))

      const gutter = Object.assign(new Event('pointerdown', { cancelable: true }), {
        button: 0,
        clientX: 285,
        clientY: 100,
      })

      surface(ui).dispatchEvent(gutter)
      expect(gutter.defaultPrevented).toBe(false)
      scroll(ui, 140, 112)
      expect(ui.tile(5, 4)).toBeDefined()
      expect(ui.editor.hasDrafts()).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('zooms to show more tiles or larger detail, clamps pan controls, and resets without creating a draft', () => {
    const ui = setup(largeView())

    try {
      expect(
        grid(ui)
          .all()
          .filter((cell) => cell.attributes.get('role') === 'gridcell'),
      ).toHaveLength(384)
      expect(ui.button('Pan left').disabled).toBe(true)
      ui.edit('Map zoom', '50', 'change')
      expect(
        grid(ui)
          .all()
          .filter((cell) => cell.attributes.get('role') === 'gridcell'),
      ).toHaveLength(1536)
      expect(grid(ui).style.properties.get('--map-editor-tile-size')).toBe('0.875rem')
      expect(ui.button('Zoom out').disabled).toBe(true)
      ui.button('Next columns').dispatchEvent(new Event('click'))
      ui.button('Next rows').dispatchEvent(new Event('click'))
      expect(ui.tile(63, 39)).toBeDefined()
      expect(ui.button('Pan right').disabled).toBe(true)
      expect(ui.button('Pan down').disabled).toBe(true)
      ui.edit('Map zoom', '400', 'change')
      expect(
        grid(ui)
          .all()
          .filter((cell) => cell.attributes.get('role') === 'gridcell'),
      ).toHaveLength(24)
      expect(grid(ui).style.properties.get('--map-editor-tile-size')).toBe('7rem')
      expect(ui.button('Zoom in').disabled).toBe(true)
      ui.button('Reset view').dispatchEvent(new Event('click'))
      expect(ui.control('Map zoom').value).toBe('100')
      expect(ui.tile(0, 0)).toBeDefined()
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.editor.draftHistory().active).toBe(false)
      expect(ui.saved).toEqual([])
    } finally {
      ui.editor.dispose()
    }
  })

  it('pans with dragging and keyboard arrows while preventing painting, and stops on pointer release', () => {
    const ui = setup(largeView())

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      ui.button('Pan map').dispatchEvent(new Event('click'))
      expect(ui.button('Pan map').attributes.get('aria-pressed')).toBe('true')
      pointer(surface(ui), 'pointerdown', 200, 200)
      pointer(surface(ui), 'pointermove', 116, 144)
      expect(ui.tile(3, 2)).toBeDefined()
      ui.document.dispatchEvent(new Event('pointerup'))
      pointer(surface(ui), 'pointermove', 0, 0)
      expect(ui.tile(3, 2)).toBeDefined()
      ui.tile(3, 2).dispatchEvent(new Event('click'))
      key(ui.tile(3, 2), 'Enter')
      expect(ui.tile(3, 2).attributes.get('aria-label')).toContain('ground')
      key(ui.tile(3, 2), 'ArrowRight')
      expect(ui.tile(4, 2)).toBeDefined()
      expect(ui.editor.hasDrafts()).toBe(false)
      key(ui.tile(4, 2), 'Escape')
      expect(ui.button('Pan map').attributes.get('aria-pressed')).toBe('false')
      ui.tile(4, 2).dispatchEvent(new Event('click'))
      expect(ui.tile(4, 2).attributes.get('aria-label')).toContain('wall')
      ui.editor.restoreDraft('undo')
      expect(ui.tile(4, 2).attributes.get('aria-label')).toContain('ground')
      expect(ui.editor.draftHistory().canUndo).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('supports temporary middle-button panning at the zoomed tile size and stops on blur or cancel', () => {
    const ui = setup(largeView())

    try {
      ui.edit('Map zoom', '200', 'change')
      pointer(surface(ui), 'pointerdown', 300, 200, 1, 4)
      pointer(surface(ui), 'pointermove', 188, 144, 1, 4)
      expect(ui.tile(8, 5)).toBeDefined()
      ui.document.defaultView.dispatchEvent(new Event('blur'))
      pointer(surface(ui), 'pointermove', 0, 0, 1, 4)
      expect(ui.tile(8, 5)).toBeDefined()
      expect(ui.button('Pan map').attributes.get('aria-pressed')).toBe('false')
      pointer(surface(ui), 'pointerdown', 200, 200, 1, 4)
      pointer(surface(ui), 'pointermove', 144, 144, 1, 4)
      ui.document.dispatchEvent(new Event('pointercancel'))
      expect(ui.tile(9, 6)).toBeDefined()
      pointer(surface(ui), 'pointermove', 0, 0, 1, 4)
      expect(ui.tile(9, 6)).toBeDefined()
      expect(ui.editor.hasDrafts()).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('zooms with grid shortcuts and modifier-wheel without consuming ordinary page scrolling or text input', () => {
    const ui = setup(largeView())

    try {
      key(ui.tile(0, 0), '+')
      expect(ui.control('Map zoom').value).toBe('125')
      key(ui.document.activeElement!, '-')
      expect(ui.control('Map zoom').value).toBe('100')

      const wheel = (ctrlKey: boolean) =>
        Object.assign(new Event('wheel', { cancelable: true }), {
          ctrlKey,
          deltaY: -100,
          clientX: 336,
          clientY: 224,
        })

      const normal = wheel(false)
      surface(ui).dispatchEvent(normal)
      expect(normal.defaultPrevented).toBe(false)
      const zoom = wheel(true)
      surface(ui).dispatchEvent(zoom)
      expect(zoom.defaultPrevented).toBe(true)
      expect(ui.control('Map zoom').value).toBe('125')
      key(
        grid(ui)
          .all()
          .find((cell) => cell.attributes.get('role') === 'gridcell')!,
        '0',
      )
      expect(ui.control('Map zoom').value).toBe('100')
      key(ui.control('Map ID'), '+')
      expect(ui.control('Map zoom').value).toBe('100')
      expect(ui.editor.hasDrafts()).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('keeps camera settings through layer changes, edit undo/redo and saving; resets them for another map', async () => {
    const current = largeView()
    const ui = setup(current)

    try {
      ui.edit('Map zoom', '200', 'change')
      ui.button('Pan right').dispatchEvent(new Event('click'))
      ui.edit('Paint layer', 'objects', 'change')
      expect(ui.control('Map zoom').value).toBe('200')
      expect(ui.tile(7, 4)).toBeDefined()
      ui.edit('Paint terrain', 'wall', 'change')
      ui.tile(7, 4).dispatchEvent(new Event('click'))
      ui.editor.restoreDraft('undo')
      expect(ui.control('Map zoom').value).toBe('200')
      expect(ui.tile(7, 4).attributes.get('aria-label')).toContain('Empty')
      ui.editor.restoreDraft('redo')
      expect(ui.tile(7, 4).attributes.get('aria-label')).toContain('wall')
      await ui.submit()
      const command = ui.saved[0]!

      if (command.type !== 'game.upsertMap') throw new Error('Expected map save')
      expect(command.map).not.toHaveProperty('zoom')
      expect(command.map).not.toHaveProperty('panning')
      ui.editor.render(
        state(
          { ...current, revision: 'two', maps: { city: command.map } },
          { preserveDrafts: true, lastCommand: command.type },
        ),
        true,
      )
      expect(ui.control('Map zoom').value).toBe('200')
      expect(ui.tile(7, 4)).toBeDefined()
      ui.editor.navigate(undefined, true)
      expect(ui.control('Map zoom').value).toBe('100')
      expect(ui.tile(0, 0)).toBeDefined()
    } finally {
      ui.editor.dispose()
    }
  })

  it('keeps selection and paste coordinates accurate across zoom and view changes', () => {
    const ui = setup(largeView())

    try {
      ui.edit('Paint layer', 'objects', 'change')
      ui.edit('Paint terrain', 'wall', 'change')
      ui.edit('Map zoom', '200', 'change')
      ui.tile(7, 5).dispatchEvent(new Event('click'))
      ui.tile(8, 5).dispatchEvent(new Event('click'))
      ui.edit('Paint tool', 'select', 'change')
      key(ui.tile(7, 5), 'Enter')
      key(ui.tile(7, 5), 'ArrowRight', { shiftKey: true })
      ui.edit('Map zoom', '100', 'change')
      ui.button('Pan right').dispatchEvent(new Event('click'))
      expect(ui.tile(7, 5).attributes.get('aria-selected')).toBe('true')
      expect(ui.tile(8, 5).attributes.get('aria-selected')).toBe('true')
      ui.button('Copy selection').dispatchEvent(new Event('click'))
      key(ui.tile(12, 8), 'Enter')
      expect(ui.tile(12, 8).attributes.get('aria-label')).toContain('wall')
      expect(ui.tile(13, 8).attributes.get('aria-label')).toContain('wall')
      ui.editor.restoreDraft('undo')
      expect(ui.tile(12, 8).attributes.get('aria-label')).toContain('Empty')
      expect(ui.tile(7, 5).attributes.get('aria-label')).toContain('wall')
      ui.editor.restoreDraft('undo')
      expect(ui.tile(8, 5).attributes.get('aria-label')).toContain('Empty')
      expect(ui.tile(7, 5).attributes.get('aria-label')).toContain('wall')
    } finally {
      ui.editor.dispose()
    }
  })
})

describe('map minimap', () => {
  const savedView = (map: MapDraft) => ({
    ...view,
    game: { ...view.game!, maps: ['city'] },
    maps: { city: map.data },
  })

  const largeMap = () => {
    const map = new MapDraft()
    map.resize(64, 40, 'ground')

    return map
  }

  const minimap = (ui: ReturnType<typeof setup>) => ui.button('Navigate using minimap')
  const canvas = (ui: ReturnType<typeof setup>) => minimap(ui).querySelector('canvas')!
  const outline = (ui: ReturnType<typeof setup>) => minimap(ui).querySelector('span')!

  const click = (ui: ReturnType<typeof setup>, x: number, y: number) =>
    minimap(ui).dispatchEvent(
      Object.assign(new Event('click'), { detail: 1, clientX: x, clientY: y }),
    )

  const key = (ui: ReturnType<typeof setup>, key: string, shiftKey = false) =>
    minimap(ui).dispatchEvent(
      Object.assign(new Event('keydown', { cancelable: true }), { key, shiftKey }),
    )

  it('shows the whole map with a live viewport outline and navigates outside the current grid without editing', () => {
    const ui = setup(savedView(largeMap()))

    try {
      expect(canvas(ui)).toMatchObject({ width: 256, height: 160 })
      expect(outline(ui).style.properties.get('width')).toBe('37.5%')
      expect(outline(ui).style.properties.get('height')).toBe('40%')
      click(ui, 630, 420)
      expect(ui.tile(63, 39)).toBeDefined()
      expect(minimap(ui).attributes.get('aria-description')).toBe('Columns 40–63, rows 24–39')
      expect(outline(ui).style.properties.get('left')).toBe('62.5%')
      expect(outline(ui).style.properties.get('top')).toBe('60%')
      ui.edit('Map zoom', '200', 'change')
      expect(outline(ui).style.properties.get('width')).toBe('18.75%')
      expect(outline(ui).style.properties.get('height')).toBe('20%')
      click(ui, 336, 224)
      expect(minimap(ui).attributes.get('aria-description')).toBe('Columns 27–38, rows 17–24')
      ui.button('Pan right').dispatchEvent(new Event('click'))
      expect(outline(ui).style.properties.get('left')).toBe('43.75%')
      click(ui, 0, 0)
      expect(ui.tile(0, 0)).toBeDefined()
      expect(ui.control('Map zoom').value).toBe('200')
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.editor.draftHistory().active).toBe(false)
      expect(ui.saved).toEqual([])
    } finally {
      ui.editor.dispose()
    }
  })

  it('offers keyboard pan, page and corner navigation and returns to the grid without painting', () => {
    const ui = setup(savedView(largeMap()))

    try {
      ui.edit('Paint terrain', 'wall', 'change')
      minimap(ui).focus()
      key(ui, 'ArrowRight')
      expect(ui.tile(1, 0)).toBeDefined()
      key(ui, 'ArrowDown', true)
      expect(ui.tile(1, 16)).toBeDefined()
      key(ui, 'End')
      expect(ui.tile(63, 39)).toBeDefined()
      key(ui, 'Home')
      expect(ui.tile(0, 0)).toBeDefined()
      minimap(ui).dispatchEvent(Object.assign(new Event('click'), { detail: 0 }))
      expect(ui.document.activeElement).toBe(ui.tile(0, 0))
      expect(ui.tile(0, 0).attributes.get('aria-label')).toContain('ground')
      expect(ui.editor.hasDrafts()).toBe(false)
    } finally {
      ui.editor.dispose()
    }
  })

  it('composites unsaved cells and visible layers, follows undo/redo, and avoids redrawing on selection changes', () => {
    const map = new MapDraft()
    map.resize(2, 2, 'ground')
    map.addLayer('objects')
    map.paint(1, 1, 'wall', 'objects')
    const ui = setup(savedView(map))

    const colors = () =>
      canvas(ui).context.drawImage.mock.calls.map(([source]) => source.context.fillStyle)

    try {
      expect(colors()).toEqual(['#608c4f', '#608c4f', '#608c4f', '#608c4f', '#4f5969'])
      ui.edit('Paint layer', 'objects', 'change')
      ui.edit('Paint terrain', 'wall', 'change')
      const draw = canvas(ui).context.drawImage
      draw.mockClear()
      ui.tile(0, 0).dispatchEvent(new Event('click'))
      expect(draw.mock.calls.map(([source]) => source.context.fillStyle)).toEqual([
        '#608c4f',
        '#4f5969',
      ])
      ui.edit('Paint tool', 'select', 'change')
      ui.tile(0, 0).dispatchEvent(Object.assign(new Event('keydown'), { key: 'Enter' }))
      expect(draw).toHaveBeenCalledTimes(2)
      ui.edit('Layer visible', 'no', 'change')
      expect(colors()).toEqual(Array<string>(4).fill('#608c4f'))
      ui.editor.restoreDraft('undo')
      expect(colors().filter((color) => color === '#4f5969')).toHaveLength(2)
      ui.editor.restoreDraft('undo')
      expect(colors().filter((color) => color === '#4f5969')).toHaveLength(1)
      ui.editor.restoreDraft('redo')
      expect(colors().filter((color) => color === '#4f5969')).toHaveLength(2)
    } finally {
      ui.editor.dispose()
    }
  })

  it('draws cropped image tiles over colors and image-only objects after image loading, and cleans up late loads', async () => {
    const map = new MapDraft()
    map.resize(2, 2, 'ground')
    map.addLayer('objects')
    map.paint(1, 1, 'wall', 'objects')
    map.data.tilesets = { sheet: { image: 'sheet', tileWidth: 16, tileHeight: 16 } }
    map.data.terrain.ground!.tile = { tileset: 'sheet', column: 0, row: 0 }
    map.data.terrain.wall!.tile = { tileset: 'sheet', column: 1, row: 0 }
    delete map.data.terrain.wall!.color

    const assets = assetCatalogSchema.parse({
      'schema-version': '1.0.0',
      images: {
        sheet: {
          format: 'png',
          source: 'assets/sheet.png',
          bounds: { x: 4, y: 8, width: 64, height: 32 },
        },
      },
    })

    const ui = setup({ ...savedView(map), assets })

    try {
      await vi.waitFor(() =>
        expect(
          ui.document.created.some(
            (element) => element.tagName === 'IMG' && element.src === 'blob:sheet',
          ),
        ).toBe(true),
      )
      const image = ui.document.created.find((element) => element.tagName === 'IMG')!
      image.dispatchEvent(new Event('load'))

      const glyphs = ui.document.created.filter(
        (element) => element.tagName === 'CANVAS' && element.width === 16,
      )

      const ground = glyphs.find((tile) =>
        tile.context.drawImage.mock.calls.some((call) => call[1] === 4),
      )!

      const object = glyphs.find((tile) =>
        tile.context.drawImage.mock.calls.some((call) => call[1] === 20),
      )!

      expect(ground.context.fillStyle).toBe('#608c4f')
      expect(object.context.fillStyle).toBe('transparent')
      expect(object.context.drawImage).toHaveBeenCalledWith(image, 20, 8, 16, 16, 0, 0, 16, 16)
      const draw = canvas(ui).context.drawImage
      const count = draw.mock.calls.length
      ui.editor.dispose()
      image.dispatchEvent(new Event('load'))
      expect(draw).toHaveBeenCalledTimes(count)
    } finally {
      ui.editor.dispose()
    }
  })

  it('preserves aspect ratio and maps clicks in letterboxed margins onto narrow maps safely', () => {
    const map = new MapDraft()
    map.resize(128, 1, 'ground')
    const ui = setup(savedView(map))

    try {
      expect(outline(ui).style.properties.get('height')).toBe('1.25%')
      click(ui, 672, 0)
      expect(ui.tile(127, 0)).toBeDefined()
      click(ui, -100, 448)
      expect(ui.tile(0, 0)).toBeDefined()
      expect(ui.editor.hasDrafts()).toBe(false)
      expect(ui.root.all().filter((element) => element.tagName === 'CANVAS')).toHaveLength(1)
    } finally {
      ui.editor.dispose()
    }
  })
})

describe('editor confirmation dialog', () => {
  it('focuses cancel, resolves accepted and canceled actions, and cleans up pending dialogs', async () => {
    const document = new DocumentFixture()
    // @ts-expect-error -- Partial DOM fixture supplies modal lifecycle and focus.
    const confirmation = createEditorConfirmation(document, editorLocalization().t)
    const ask = () => confirmation.ask('Replace map tiles?')

    const button = (name: string) =>
      document.body
        .all()
        .find((element) => element.tagName === 'BUTTON' && element.textContent === name)!

    const accepted = ask()
    expect(document.activeElement).toBe(button('Cancel'))
    await expect(confirmation.ask('Delete this project?', 'project.delete')).resolves.toBe(false)
    button('Confirm').dispatchEvent(new Event('click'))
    await expect(accepted).resolves.toBe(true)
    expect(document.body.querySelector('dialog')).toBeNull()
    const canceled = ask()
    document.body.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await expect(canceled).resolves.toBe(false)
    const pending = ask()
    confirmation.cancel()
    await expect(pending).resolves.toBe(false)
    expect(document.body.querySelector('dialog')).toBeNull()
  })
})
