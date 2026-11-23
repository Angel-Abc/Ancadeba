/// <reference lib="dom" />
import { describe, expect, it } from 'vite-plus/test'
import { projectViewSchema } from '@ancadeba/editor-core'
import { levelingProfileSchema, sceneComponentSchema } from '@ancadeba/schemas'
import {
  buildProjectTree,
  dataFileContent,
  dataFilesSection,
  filterProjectTree,
  flattenProjectTree,
  ruleFileNodes,
  sceneTitle,
  gameTitle,
  sceneTreeLabel,
  type ProjectTreeNode,
} from '../apps/editor-ui/src/projectTree.js'
import { bindProjectTree } from '../apps/editor-ui/src/projectTreeView.js'
import { renderSceneNavigation } from '../apps/editor-ui/src/sceneNavigation.js'
import { editorLocalization } from '../apps/editor-ui/src/localization.js'

const view = projectViewSchema.parse({
  revision: 'one',
  game: {
    'schema-version': '1.0.0',
    id: 'test',
    title: 'Test',
    version: '1',
    scenes: ['standard'],
    'initial-scene': 'standard',
  },
  scenes: [
    {
      'schema-version': '1.0.0',
      id: 'standard',
      title: 'Standard',
      type: 'game',
      screen: { type: 'grid', grid: { rows: 4, columns: 4 } },
      components: [
        { id: 'health', type: 'text', text: 'Health', placement: { row: 1, column: 1 } },
      ],
    },
  ],
  assets: {
    'schema-version': '1.0.0',
    images: {
      portrait: {
        format: 'png',
        source: 'portrait.png',
        bounds: { x: 0, y: 0, width: 10, height: 10 },
      },
    },
  },
  diagnostics: [],
})

const t = editorLocalization().t

// This harness exercises actual event listeners and focus changes without a browser global.
class TreeElement extends EventTarget {
  children: TreeElement[] = []
  attributes = new Map<string, string>()
  dataset: Record<string, string> = {}
  style = { setProperty: (_name: string, _value: string) => {} }
  value = ''
  textContent = ''
  tabIndex = -1
  className = ''
  title = ''
  placeholder = ''
  constructor(readonly ownerDocument: TreeDocument) {
    super()
  }
  append(...children: TreeElement[]) {
    this.children.push(...children)
  }
  replaceChildren() {
    this.children = []
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }
  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }
  contains(element: TreeElement | null): boolean {
    return this === element || this.children.some((child) => child.contains(element))
  }
  focus() {
    this.ownerDocument.activeElement = this
    this.dispatchEvent(new Event('focus'))
  }
  all(): TreeElement[] {
    return [this, ...this.children.flatMap((child) => child.all())]
  }
  asElement(): HTMLElement {
    // @ts-expect-error -- Partial DOM harness implements the tree's element operations.
    return this
  }
  asInput(): HTMLInputElement {
    // @ts-expect-error -- Partial DOM harness implements the search input operations.
    return this
  }
}

class TreeDocument {
  activeElement: TreeElement | null = null
  createElement() {
    return new TreeElement(this)
  }
}

function setup(accept: (node: ProjectTreeNode) => boolean = () => true) {
  const document = new TreeDocument()
  const root = document.createElement()
  const search = document.createElement()
  const selections: string[] = []
  const interactiveSelections: string[] = []

  const tree = bindProjectTree(
    root.asElement(),
    search.asInput(),
    (node, interactive) => {
      if (!accept(node)) return false
      selections.push(node.key)

      if (interactive) interactiveSelections.push(node.key)

      return true
    },
    t,
  )

  tree.render(view, false)

  const row = (key: string) => {
    const element = root.all().find((element) => element.dataset.treeKey === key)

    if (!element) throw new Error(`Missing tree row: ${key}`)

    return element
  }

  const key = (value: string) => {
    const event = new Event('keydown', { cancelable: true })
    Object.defineProperty(event, 'key', { value })
    root.dispatchEvent(event)
  }

  return { tree, root, search, selections, interactiveSelections, row, key, document }
}

describe('extensible project explorer', () => {
  it('marks ancestors of hidden drafts and keeps their full paths available through search', () => {
    const { tree, row, search } = setup()
    tree.markDrafts(['component:standard:health', 'game'])
    expect(row('scenes').dataset.unsaved).toBe('true')
    expect(row('scene:standard').dataset.unsaved).toBe('true')
    expect(row('game').dataset.unsaved).toBe('true')
    search.value = 'portrait'
    search.dispatchEvent(new Event('input'))
    expect(tree.pathLabel('component:standard:health')).toContain('Standard › ')
    tree.markDrafts(['game'])
    search.value = ''
    search.dispatchEvent(new Event('input'))
    expect(row('scenes').dataset.unsaved).toBe('false')
    expect(row('game').dataset.unsaved).toBe('true')
  })

  it('opens existing scenes from the overview and sends header actions through tree navigation', () => {
    const document = new TreeDocument()
    const list = document.createElement()
    const actions = document.createElement()
    const selected: string[] = []
    const scenes = buildProjectTree(view, t).find((node) => node.key === 'scenes')!

    const show = (node: ProjectTreeNode) =>
      renderSceneNavigation(
        list.asElement(),
        actions.asElement(),
        node,
        (key) => selected.push(key),
        t,
        false,
        false,
      )

    show(scenes)
    expect(actions.children.map((button) => button.textContent)).toEqual(['New scene'])
    actions.children[0]!.dispatchEvent(new Event('click'))
    list.children[0]!.children[0]!.dispatchEvent(new Event('click'))
    show(scenes.children![0]!)
    expect(list.children).toHaveLength(0)
    expect(actions.children.map((button) => button.textContent)).toEqual(['Add component'])

    for (const button of actions.children) button.dispatchEvent(new Event('click'))
    expect(selected).toEqual(['scene-new', 'scene:standard', 'component-new:standard'])
  })
  it('separates scene components from shared assets and marks startup and scene context', () => {
    const nodes = buildProjectTree(view, t)
    expect(nodes.map((node) => node.key)).toEqual(['game', 'scenes', 'assets'])
    const scene = nodes[1]!.children![0]!
    expect(scene.detail).toBe('Game · Startup')
    expect(scene.children![0]).toMatchObject({
      key: 'component:standard:health',
      parentId: 'standard',
      kind: 'component',
    })
    expect(scene.children!.find((node) => node.kind === 'new-component')).toMatchObject({
      key: 'component-new:standard',
      parentId: 'standard',
      label: 'Add component',
    })
    expect(nodes[2]!.children![0]!.children![0]).toMatchObject({
      key: 'asset:portrait',
      kind: 'asset',
    })
    expect(new Set(flattenProjectTree(nodes).map((node) => node.key)).size).toBe(
      flattenProjectTree(nodes).length,
    )
  })

  it('names scenes by their translated title and lists rule, map, and inventory files', () => {
    const scene = { ...view.scenes[0]!, title: '', titleKey: 'scenes.standard.title' }

    const translated = {
      ...view,
      game: { ...view.game!, rules: ['rules', 'puzzle'], maps: ['museum'], inventory: ['shop'] },
      scenes: [scene],
      translations: { 'scenes.standard.title': 'In the museum' },
    }

    expect(sceneTitle(translated, scene)).toBe('In the museum')
    expect(sceneTitle(translated, { ...scene, title: 'Literal fallback' })).toBe('In the museum')
    expect(
      gameTitle({
        ...translated,
        game: { ...translated.game, title: 'Fallback game', titleKey: 'scenes.standard.title' },
      }),
    ).toBe('In the museum')
    expect(sceneTitle({ ...translated, translations: {} }, scene)).toBe('standard')
    expect(ruleFileNodes(translated).map((node) => node.key)).toEqual([
      'rule-file:rules',
      'rule-file:puzzle',
    ])
    const files = flattenProjectTree(dataFilesSection.nodes(translated, t))

    expect(files.map((node) => node.key)).toEqual([
      'data:maps',
      'data-file:maps:museum',
      'data:inventories',
      'data-file:inventories:shop',
    ])
    expect(files[0]!.label).toBe('Maps')
    expect(dataFileContent(translated, files[1]!)).toBeUndefined()
  })

  it('labels every scene component type in each editor language', () => {
    const types = sceneComponentSchema.options.map((option) => option.shape.type.value)

    for (const language of ['en', 'nl']) {
      const translate = editorLocalization([language]).t

      for (const type of types) expect(translate(`tree.${type}`)).not.toBe(`tree.${type}`)
    }
  })

  it('adds the scene ID only when another scene shows the same title', () => {
    const first = { ...view.scenes[0]!, id: 'ember', title: 'Wardrobe' }
    const second = { ...view.scenes[0]!, id: 'gallery', title: 'Wardrobe' }
    const third = { ...view.scenes[0]!, id: 'shop', title: 'Shop' }
    const scenes = { ...view, scenes: [first, second, third] }

    expect(sceneTreeLabel(scenes, first)).toBe('Wardrobe (ember)')
    expect(sceneTreeLabel(scenes, second)).toBe('Wardrobe (gallery)')
    expect(sceneTreeLabel(scenes, third)).toBe('Shop')
  })

  it('lists every referenced data file and names the section that edits it', () => {
    const profile = levelingProfileSchema.parse({
      'schema-version': '1.0.0',
      id: 'player',
      label: 'Player',
      xp: { source: 'game.state', path: ['xp'] },
      level: { source: 'game.state', path: ['level'] },
      levels: [{ xp: 0 }],
    })

    const data = {
      ...view,
      game: { ...view.game!, leveling: ['player'], quests: ['harbour'] },
      leveling: { player: profile },
    }

    const files = flattenProjectTree(dataFilesSection.nodes(data, t))

    expect(files.map((node) => node.key)).toEqual([
      'data:leveling',
      'data-file:leveling:player',
      'data:quests',
      'data-file:quests:harbour',
    ])
    expect(dataFileContent(data, files[1]!)).toEqual({ content: profile, editSection: 'leveling' })
    expect(dataFileContent(data, files[3]!)).toBeUndefined()
    expect(dataFileContent(data, files[0]!)).toBeUndefined()
  })

  it('accepts an additional system without changes to the tree renderer', () => {
    const nodes = buildProjectTree(view, t, [
      {
        id: 'maps',
        labelKey: 'Maps',
        nodes: () => [{ key: 'map:world', section: 'maps', kind: 'map', label: 'World' }],
      },
    ])

    expect(nodes[0]!.children![0]!.key).toBe('map:world')
  })

  it('filters by name or ID while retaining ancestors and translating labels', () => {
    const nodes = buildProjectTree(view, t)
    expect(flattenProjectTree(filterProjectTree(nodes, 'HEALTH')).map((node) => node.key)).toEqual([
      'scenes',
      'scene:standard',
      'component:standard:health',
    ])
    expect(filterProjectTree(nodes, 'no match')).toEqual([])
    expect(buildProjectTree(view, editorLocalization(['nl']).t)[1]!.label).toBe('Scènes')
  })

  it('opens the same component from its literal label, a saved translation, or its ID', () => {
    const { tree, search, row, selections, key } = setup()
    const placement = { row: 1, column: 1 }

    const play = sceneComponentSchema.parse({
      id: 'play',
      type: 'button',
      label: 'New game',
      labelKey: 'menu.start',
      placement,
    })

    const project = {
      ...view,
      translations: { 'menu.start': 'Start adventure' },
      languageCatalogs: { nl: { 'menu.start': 'Nieuw spel' } },
      scenes: [{ ...view.scenes[0]!, components: [play] }],
    }

    tree.render(project, false)
    const component = 'component:standard:play'

    for (const [query, expectedLabel] of [
      ['  NEW GAME  ', 'New game'],
      ['adventure', 'Start adventure'],
      ['nieuw', 'Nieuw spel'],
      ['play', 'play'],
    ] as const) {
      search.value = query
      search.dispatchEvent(new Event('input'))
      expect(row('scene:standard').getAttribute('aria-expanded')).toBe('true')
      expect(row(component).children[1]!.textContent).toBe(expectedLabel)
      expect(row(component).children[2]!.textContent).toBe(
        expectedLabel === 'play' ? 'Button' : 'Button · play',
      )
      row(component).focus()
      key('Enter')
      expect(selections.at(-1)).toBe(component)
    }

    search.value = 'nieuw'
    tree.render({ ...project, languageCatalogs: {} }, false)
    expect(() => row(component)).toThrow('Missing tree row')
    tree.dispose()
  })

  it('finds text, alternative text and nested action labels without matching unrelated fields', () => {
    const placement = { row: 1, column: 1 }

    const components = [
      { id: 'intro', type: 'text', textKey: 'intro.title' },
      { id: 'hero', type: 'graphic', visual: 'portrait', alt: 'A sailor on deck' },
      {
        id: 'actions',
        type: 'action-bar',
        slots: {
          '1': { label: 'Cast off', action: { type: 'enter-scene', scene: 'secret-port' } },
        },
      },
    ].map((component) => sceneComponentSchema.parse({ ...component, placement }))

    const nodes = buildProjectTree(
      {
        ...view,
        scenes: [{ ...view.scenes[0]!, components }],
        translations: { 'intro.title': 'Welcome aboard' },
      },
      t,
    )

    const matches = (query: string) => flattenProjectTree(filterProjectTree(nodes, query))

    for (const [query, id] of [
      ['aboard', 'intro'],
      ['sailor', 'hero'],
      ['cast off', 'actions'],
    ] as const)
      expect(matches(query).map((node) => node.key)).toEqual([
        'scenes',
        'scene:standard',
        `component:standard:${id}`,
      ])

    expect(matches('secret-port')).toEqual([])
  })

  it('navigates visible branches with arrows without selecting until Enter', () => {
    const { row, key, document, selections, tree } = setup()
    row('scene:standard').focus()
    key('ArrowRight')
    expect(row('scene:standard').getAttribute('aria-expanded')).toBe('true')
    key('ArrowRight')
    expect(document.activeElement).toBe(row('component:standard:health'))
    expect(selections).toEqual([])
    key('Enter')
    expect(selections).toEqual(['component:standard:health'])
    key('ArrowLeft')
    expect(document.activeElement).toBe(row('scene:standard'))
    key('ArrowLeft')
    expect(row('scene:standard').getAttribute('aria-expanded')).toBe('false')
    expect(row('scene:standard').tabIndex).toBe(0)
    tree.dispose()
  })

  it('opens the branch of a selection made outside the tree without reopening it afterwards', () => {
    const { tree, row, key } = setup()
    tree.render(view, false, 'component:standard:health')
    expect(row('scene:standard').getAttribute('aria-expanded')).toBe('true')
    expect(row('component:standard:health').getAttribute('aria-selected')).toBe('true')

    row('scene:standard').focus()
    key('ArrowLeft')
    tree.render(view, false, 'component:standard:health')
    expect(row('scene:standard').getAttribute('aria-expanded')).toBe('false')
    tree.dispose()
  })

  it('keeps selection when navigation is refused or busy and falls back after removal', () => {
    const { tree, row, selections, interactiveSelections } = setup(
      (node) => node.key !== 'scene:standard',
    )

    tree.select('scene:standard')
    expect(row('game').getAttribute('aria-selected')).toBe('true')
    tree.render(view, true)
    tree.select('asset:portrait')
    expect(selections).toEqual([])
    tree.render(view, false)
    tree.select('asset:portrait')
    expect(row('asset:portrait').getAttribute('aria-selected')).toBe('true')
    tree.render({ ...view, assets: undefined }, false)
    expect(row('game').getAttribute('aria-selected')).toBe('true')
    expect(interactiveSelections).toEqual(['asset:portrait'])
    tree.dispose()
  })

  it('retains expansion, selection and focus across revisions and removes listeners on disposal', () => {
    const { tree, row, document, search, root } = setup()
    tree.select('asset:portrait')
    row('asset:portrait').focus()
    tree.render({ ...view, revision: 'two' }, false)
    expect(document.activeElement).toBe(row('asset:portrait'))
    search.value = 'health'
    search.dispatchEvent(new Event('input'))
    expect(row('component:standard:health')).toBeDefined()
    tree.dispose()
    search.dispatchEvent(new Event('input'))
    expect(root.children).toEqual([])
  })
})
