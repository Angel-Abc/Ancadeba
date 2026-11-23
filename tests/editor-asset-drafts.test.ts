/// <reference lib="dom" />
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test'
import {
  applyCommand,
  createStarterProject,
  inspectProject,
  type CommandRequest,
  type ProjectSnapshot,
} from '@ancadeba/editor-core'
import { bindAssetsPanel } from '../apps/editor-ui/src/assetsPanel.js'
import { EditorClientError } from '../apps/editor-ui/src/editorClient.js'
import { captureEditorDrafts, restoreEditorDrafts } from '../apps/editor-ui/src/editorDraftState.js'
import { editorLocalization } from '../apps/editor-ui/src/localization.js'
import {
  ProjectEditorController,
  type ProjectEditorState,
} from '../apps/editor-ui/src/projectController.js'

// A DOM surface exercises real form events, file clearing and controller reconciliation.
class Node extends EventTarget {
  children: Node[] = []
  parent?: Node
  id = ''
  type = ''
  className = ''
  disabled = false
  hidden = false
  dataset: Record<string, string> = {}
  attributes = new Map<string, string>()
  files: File[] = []
  classList = {
    add: (name: string) => {
      this.className += ' ' + name
    },
    remove: (name: string) => {
      this.className = this.className
        .split(' ')
        .filter((entry) => entry !== name)
        .join(' ')
    },
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((node) => node !== this)
  }
  removeAttribute(name: string) {
    this.attributes.delete(name)
  }
  get parentElement() {
    return this.parent
  }
  toggleAttribute(name: string, force: boolean) {
    if (force) this.attributes.set(name, '')
    else this.attributes.delete(name)
  }
  focus() {}
  async decode() {}
  private storedValue = ''
  private text = ''
  constructor(
    readonly ownerDocument: DocumentFixture,
    readonly tagName: string,
  ) {
    super()
  }
  get value() {
    return this.storedValue
  }
  set value(value: string) {
    this.storedValue = value

    if (this.type === 'file' && value === '') this.files = []
  }
  get textContent(): string {
    return this.text + this.children.map((node) => node.textContent).join('')
  }
  set textContent(value: string) {
    this.text = value
    this.children = []
  }
  set innerHTML(html: string) {
    this.children = []
    const stack: Node[] = [this]

    for (const match of html.matchAll(/<(\/?)([\w-]+)([^>]*)>/g)) {
      const [, closing, tag, attrs] = match

      if (closing) {
        stack.pop()
        continue
      }

      const node = this.ownerDocument.createElement(tag!)

      for (const attr of attrs!.matchAll(/([\w-]+)="([^"]*)"/g))
        node.setAttribute(attr[1]!, attr[2]!)
      stack.at(-1)!.append(node)

      if (!['input', 'br', 'img'].includes(tag!)) stack.push(node)
    }
  }
  append(...values: (Node | string)[]) {
    for (const value of values) {
      if (typeof value === 'string') this.text += value
      else {
        value.parent = this
        this.children.push(value)

        if (this.tagName === 'select' && !this.value) this.value = value.value || value.textContent
      }
    }
  }
  replaceChildren(...values: (Node | string)[]) {
    this.children = []
    this.text = ''
    this.append(...values)
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)

    if (name === 'id') this.id = value

    if (name === 'type') this.type = value

    if (name === 'class') this.className = value

    if (name.startsWith('data-'))
      this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value
  }
  all(): Node[] {
    return [this, ...this.children.flatMap((node) => node.all())]
  }
  matches(selector: string): boolean {
    return selector.split(',').some((entry) => {
      const part = entry.trim()

      if (part.includes(' ')) {
        const [parent, child] = part.split(' ')

        return this.matches(child!) && Boolean(this.parent?.closest(parent!))
      }

      if (part === 'input:not([type="file"])')
        return this.tagName === 'input' && this.type !== 'file'

      if (part === 'input[type=color]') return this.tagName === 'input' && this.type === 'color'

      if (part.startsWith('#')) return this.id === part.slice(1)

      if (part.startsWith('.')) return this.className.split(' ').includes(part.slice(1))

      if (part.startsWith('[')) return this.attributes.has(part.slice(1, -1))

      return this.tagName === part
    })
  }
  querySelector(selector: string): Node | null {
    return this.all().find((node) => node.matches(selector)) ?? null
  }
  querySelectorAll(selector: string): Node[] {
    return this.all()
      .slice(1)
      .filter((node) => node.matches(selector))
  }
  closest(selector: string): Node | null {
    return this.matches(selector) ? this : (this.parent?.closest(selector) ?? null)
  }
  asElement(): HTMLElement {
    // @ts-expect-error -- The fixture implements only the DOM surface used by this probe.
    return this
  }
}

class DocumentFixture {
  defaultView = { URL, crypto }
  createElementNS(_namespace: string, tag: string) {
    return this.createElement(tag)
  }
  createElement(tag: string) {
    return new Node(this, tag)
  }
}

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#123456" data-color="fabric"/></svg>'

const image = {
  format: 'svg' as const,
  source: 'assets/images/cloth.svg',
  bounds: { x: 0, y: 0, width: 10, height: 10 },
  colors: { fabric: '#123456' },
  palettes: {},
}

afterEach(() => vi.unstubAllGlobals())

async function setup() {
  // Used by the outer palette form's input filtering.
  vi.stubGlobal('HTMLSelectElement', class {})
  const document = new DocumentFixture()
  const root = document.createElement('main')
  const panel = document.createElement('section')
  panel.id = 'assets-panel'
  root.append(panel)

  let source: ProjectSnapshot = applyCommand(
    {
      revision: 'one',
      documents: createStarterProject({ path: 'game', title: 'Game', description: '' }),
    },
    { type: 'assets.upsertImage', id: 'cloth', image },
  ).project

  let revision = 0
  let rejectNext = false
  let latest: ProjectEditorState | undefined

  const apply = vi.fn(async ({ command }: CommandRequest) => {
    if (rejectNext) {
      rejectNext = false
      throw new EditorClientError('revision_conflict', 'Conflict')
    }

    source = { ...applyCommand(source, command).project, revision: String(++revision) }

    return inspectProject(source)
  })

  const importer = vi.fn(async ({ id }: { id: string }) => {
    return apply({
      path: 'game',
      expectedRevision: source.revision,
      command: { type: 'assets.upsertImage', id, image },
    })
  })

  const controller = new ProjectEditorController(
    {
      inspect: async () => inspectProject(source),
      apply,
      importAsset: importer,
    },
    (state, replace) => {
      latest = state
      controls.render(state, replace)
    },
  )

  const controls = bindAssetsPanel(
    root.asElement(),
    {
      save: (command) => controller.save(command),
      importAsset: (id, format, file) => controller.importAsset(id, format, file),
    },
    async () => new Response(svg),
    editorLocalization().t,
  )

  onTestFinished(() => {
    controls.dispose()
    controller.dispose()
  })
  await controller.load('game')

  const find = (id: string) => {
    const node = panel.querySelector('#' + id)

    if (!node) throw new Error('Missing control: ' + id)

    return node
  }

  const settle = () => new Promise<void>((resolve) => setImmediate(resolve))

  const edit = async (id: string, value: string, form: string) => {
    find(id).value = value
    find(id).dispatchEvent(new Event('input'))
    find(form).dispatchEvent(new Event('input'))
    await settle()
  }

  const submit = async (id: string, event = 'submit') => {
    find(id).dispatchEvent(new Event(event, { cancelable: true }))
    await settle()
  }

  const upload = async () => {
    const file = new File([svg], 'draft.svg')
    find('asset-file').value = 'draft.svg'
    find('asset-file').files = [file]
    await edit('asset-image-id', 'draft', 'asset-image')
    find('asset-format').value = 'svg'

    return file
  }

  const unrelatedSave = () =>
    controller.save({ type: 'assets.updateDefinitions', parts: {}, compositions: {} })

  return {
    controller,
    controls,
    root,
    find,
    edit,
    submit,
    upload,
    unrelatedSave,
    apply,
    importer,
    rejectNext: () => {
      rejectNext = true
    },
    drafts: () => captureEditorDrafts(root.asElement()),
    state: () => latest,
    read: () => inspectProject(source),
  }
}

describe('asset draft save ownership', () => {
  it('retains a rejected upload and its file across unrelated asset saves, then clears only its successful retry', async () => {
    const ui = await setup()
    const file = await ui.upload()
    await ui.edit('asset-json', '{', 'asset-definition')
    ui.rejectNext()
    await ui.submit('asset-image')
    expect(ui.state()?.error).toBe('Conflict')
    expect(ui.find('asset-file').files).toEqual([file])
    await ui.unrelatedSave()
    expect(ui.find('asset-file').files).toEqual([file])
    expect(ui.find('asset-image-id').value).toBe('draft')
    expect(ui.controls.hasDrafts()).toBe(true)
    expect(ui.drafts()).toHaveProperty('asset-image')
    expect(ui.drafts()).toHaveProperty('asset-definition')
    await ui.submit('asset-image')
    expect(ui.read().assets?.images.draft).toBeDefined()
    expect(ui.find('asset-select').value).toBe('draft')
    expect(ui.find('asset-file').files).toEqual([])
    expect(ui.drafts()).not.toHaveProperty('asset-image')
    expect(ui.drafts()).toHaveProperty('asset-definition')
    expect(ui.find('asset-json').value).toBe('{')
  })

  it('retains failed definition JSON through an unrelated save of the same command type', async () => {
    const ui = await setup()
    const json = JSON.stringify({ ...image, colors: { fabric: '#abcdef' } })
    await ui.edit('asset-json', json, 'asset-definition')
    ui.rejectNext()
    await ui.submit('asset-definition')
    expect(ui.state()?.error).toBe('Conflict')
    await ui.controller.save({ type: 'assets.upsertImage', id: 'cloth', image })
    expect(ui.find('asset-json').value).toBe(json)
    expect(ui.drafts()).toHaveProperty('asset-definition')
    await ui.submit('asset-definition')
    expect(ui.read().assets?.images.cloth?.colors.fabric).toBe('#abcdef')
    expect(ui.controls.hasDrafts()).toBe(false)
  })

  it('retains locally invalid JSON across unrelated saves without claiming a submission', async () => {
    const ui = await setup()
    await ui.edit('asset-json', '{', 'asset-definition')
    await ui.submit('asset-definition')
    expect(ui.apply).not.toHaveBeenCalled()
    expect(ui.find('asset-error').hidden).toBe(false)
    await ui.unrelatedSave()
    expect(ui.find('asset-json').value).toBe('{')
    expect(ui.drafts()).toHaveProperty('asset-definition')
  })

  it('retains failed palette edits through unrelated asset saves and clears them on a successful retry', async () => {
    const ui = await setup()
    await ui.submit('asset-add-preset', 'click')
    await ui.edit('asset-preset-name', 'new-preset', 'asset-palettes')
    const color = ui.find('asset-color-fields').querySelector('input[type=color]')!
    color.value = '#aabbcc'
    color.dispatchEvent(new Event('input'))
    ui.rejectNext()
    await ui.submit('asset-palettes')
    expect(ui.state()?.error).toBe('Conflict')
    await ui.unrelatedSave()
    expect(ui.find('asset-preset-name').value).toBe('new-preset')
    expect(ui.find('asset-color-fields').querySelector('input[type=color]')!.value).toBe('#aabbcc')
    expect(ui.drafts()).toHaveProperty('asset-palettes')
    await ui.submit('asset-palettes')
    expect(ui.read().assets?.images.cloth?.palettes['new-preset']).toEqual({ fabric: '#aabbcc' })
    expect(ui.controls.hasDrafts()).toBe(false)
  })

  it('preserves an unsaved image while a different form saves the same asset command type', async () => {
    const ui = await setup()
    const file = await ui.upload()
    await ui.submit('asset-add-preset', 'click')
    await ui.edit('asset-preset-name', 'saved-preset', 'asset-palettes')
    await ui.submit('asset-palettes')
    expect(ui.read().assets?.images.cloth?.palettes['saved-preset']).toBeDefined()
    expect(ui.find('asset-file').files).toEqual([file])
    expect(ui.drafts()).toHaveProperty('asset-image')
    expect(ui.drafts()).not.toHaveProperty('asset-palettes')
  })

  it('recovers two preset drafts and saves only the selected colors against the latest image', async () => {
    const ui = await setup()

    const definition = {
      ...image,
      palettes: { royal: { fabric: '#123499' }, ember: { fabric: '#ab3456' } },
    }

    const loadImage = (target: typeof ui) =>
      target.controller.save({ type: 'assets.upsertImage', id: 'cloth', image: definition })

    const select = (target: typeof ui, key: string) => {
      target.find('asset-preset').value = key
      target.find('asset-preset').dispatchEvent(new Event('change'))
    }

    await loadImage(ui)
    ui.controls.navigate('asset', 'cloth')
    select(ui, 'royal')
    await ui.edit('asset-preset-name', 'royal-review', 'asset-palettes')
    select(ui, 'ember')
    const color = ui.find('asset-color-fields').querySelector('input[type=color]')!
    color.value = '#ff2244'
    color.dispatchEvent(new Event('input'))
    const copy = await setup()
    await loadImage(copy)
    const stored = JSON.parse(JSON.stringify(ui.drafts()))
    expect(restoreEditorDrafts(copy.root.asElement(), stored)).toEqual([])
    expect(copy.controls.draftLocations?.('assets')).toMatchObject([
      { key: 'asset:cloth', detail: 'Colors and presets › royal-review' },
      { key: 'asset:cloth', detail: 'Colors and presets › ember' },
    ])
    expect(copy.find('asset-preset').value).toBe('ember')
    await copy.submit('asset-palettes')
    expect(copy.controls.draftLocations?.('assets')).toMatchObject([
      { key: 'asset:cloth', detail: 'Colors and presets › royal-review' },
    ])
    expect(copy.read().assets?.images.cloth).toMatchObject({
      colors: image.colors,
      palettes: { royal: definition.palettes.royal, ember: { fabric: '#ff2244' } },
    })
    copy.controls.draftLocations?.('assets')[0]?.reveal?.()
    expect(copy.find('asset-preset-name').value).toBe('royal-review')
    expect(copy.drafts()).toHaveProperty('asset-palettes')
  })

  it.each(['game', 'other-project'])(
    'clears a discarded upload on a non-preserving load of %s',
    async (path) => {
      const ui = await setup()
      await ui.upload()
      ui.rejectNext()
      await ui.submit('asset-image')
      await ui.controller.load(path)
      expect(ui.find('asset-file').files).toEqual([])
      expect(ui.controls.hasDrafts()).toBe(false)
      expect(ui.drafts()).not.toHaveProperty('asset-image')
    },
  )
})
