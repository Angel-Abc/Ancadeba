import { bindFormSaveBar, refreshSaveStatuses } from './formSaveStatus.js'
import type { DraftLocation } from './projectSectionRegistry.js'
import { registerEditorDraft, registerFormDraft } from './editorDraftState.js'
import { z } from 'zod'
import {
  assetCatalogSchema,
  assetIdSchema,
  graphicAppearanceSchema,
  graphicComponentSchema,
  imageAssetSchema,
  partSchema,
  compositionSchema,
  type ImageAsset,
  type GraphicPart,
} from '@ancadeba/schemas'
import { inspectImageSource } from '@ancadeba/game-runtime'
import {
  BrowserGraphicResources,
  createGraphicPlatform,
  GraphicComponentRenderer,
  type RenderedGraphic,
  type RenderedComponent,
} from '@ancadeba/ui-components'
import type { EditorCommand } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import type { ProjectEditorState } from './projectController.js'
import { EditorWorkspaceResources } from './workspaceResources.js'
import { bindGraphicDefinitionsEditor } from './graphicDefinitionsEditor.js'
import { bindSceneGraphicEditor, type SceneGraphicPreviewFactory } from './sceneGraphicEditor.js'
import { startingGameBindings } from './textBindingChoices.js'

const paletteDraftSchema = z.object({ name: z.string(), colors: z.record(z.string(), z.string()) })

type PaletteDraft = z.infer<typeof paletteDraftSchema>

export interface AssetPanelActions {
  save(command: EditorCommand): Promise<void>
  importAsset(id: string, format: ImageAsset['format'], file: File): Promise<void>
}

/** Asset drafts share the project's optimistic revision, but preview controls never save. */
export function bindAssetsPanel(
  root: HTMLElement,
  actions: AssetPanelActions,
  fetcher: typeof fetch,
  t: Translate,
  onSelectAsset?: (id: string) => void,
  /** Opens an explorer node by key, such as the image import form from an empty gallery. */
  onOpen?: (key: string) => void,
) {
  const panel = root.querySelector<HTMLElement>('#assets-panel')
  const dirty = new Set<string>()

  let imageView: 'colors' | 'file' = 'colors'
  let target = ''
  const drafts = new Map<string, PaletteDraft>()
  let paletteOwner = ''

  let submission:
    | {
        form: string
        type: EditorCommand['type']
        path: string
        selection: string
        palette?: { target: string; next: string } | undefined
      }
    | undefined

  let controlLanguage = t('assets.defaults')
  let state: ProjectEditorState | undefined
  let resources: BrowserGraphicResources | undefined
  let resourceRevision = ''
  let selected = ''
  let navigationKey = ''
  let structuredPath: string | undefined
  let graphicPath: string | undefined
  let preview: RenderedGraphic | undefined
  let thumbnails: RenderedComponent[] = []
  let appearance = graphicAppearanceSchema.parse({})
  const abort = new AbortController()

  const route = (kind: string, id?: string, sceneId?: string) =>
    `${kind}:${sceneId ?? ''}:${id ?? ''}`

  if (!panel)
    return {
      render: (_state: ProjectEditorState, _replace: boolean) => {},
      dispose: () => {},
      hasDrafts: () => false,
      canNavigate: () => true,
      navigate: (_kind: string, _id?: string, _sceneId?: string) => {},
    }
  const document = panel.ownerDocument
  panel.innerHTML = `
    <p id="asset-intro" class="help" data-i18n="assets.help"></p>
    <div id="asset-gallery" class="asset-gallery"></div>
    <div id="asset-empty" class="asset-empty" hidden><p id="asset-empty-text"></p><button type="button" id="asset-empty-action"></button></div>
    <div id="asset-image-views" class="specialist-views" hidden>
      <button type="button" id="asset-show-colors" data-i18n="assets.colors"></button>
      <button type="button" id="asset-show-file" data-i18n="assets.imageFile"></button>
    </div>
    <form id="asset-image">
      <div class="save-bar" data-save-actions>
        <button type="submit" data-i18n="assets.saveImage"></button>
        <button type="button" data-discard data-i18n="form.discardChanges"></button>
      </div>
      <div id="asset-file-preview" class="asset-preview" hidden></div>
      <h4 id="asset-image-heading" data-i18n="assets.import"></h4>
      <label for="asset-image-id" data-i18n="metadata.id"></label><input id="asset-image-id" required pattern="[a-zA-Z0-9_\\-]+" />
      <label for="asset-format" data-i18n="assets.format"></label><select id="asset-format"><option>svg</option><option>png</option><option>jpeg</option><option>webp</option></select>
      <label for="asset-file" data-i18n="assets.file"></label><input id="asset-file" type="file" accept=".svg,.png,.jpg,.jpeg,.webp" />
      <label for="asset-source" data-i18n="assets.source"></label><input id="asset-source" placeholder="assets/images/tunic.svg" />

    </form>
    <div id="asset-workshop">
    <label for="asset-select" data-i18n="assets.visual"></label><select id="asset-select"></select>
    <form id="asset-palettes">
      <div class="save-bar" data-save-actions>
        <button type="submit" id="asset-save-palette"></button>
        <button type="button" data-discard data-i18n="form.discardChanges"></button>
      </div>
      <div class="image-colors-layout">
        <div id="asset-preview" class="asset-preview"></div>
        <div class="image-color-editor">
          <label for="asset-preset" data-i18n="assets.colorTarget"></label><select id="asset-preset" data-draft-navigation></select>
          <div><button type="button" id="asset-add-preset" data-i18n="assets.addPreset"></button>
          <button type="button" id="asset-remove-preset" data-i18n="assets.removePreset"></button></div>
          <label id="asset-name-label" for="asset-preset-name" data-i18n="assets.presetName"></label><input id="asset-preset-name" pattern="[a-zA-Z0-9_\\-]+" />
          <div id="asset-color-fields"></div>
        </div>
      </div>
      <div id="asset-preview-controls" class="asset-preview-controls"></div>
    </form>
    </div>
    <details><summary data-i18n="assets.imageDefinition"></summary><form id="asset-definition">
      <div class="save-bar" data-save-actions>
        <button type="submit" data-i18n="assets.saveDefinition"></button>
        <button type="button" data-discard data-i18n="form.discardChanges"></button>
      </div>
      <label for="asset-kind" data-i18n="assets.kind"></label><select id="asset-kind"><option value="images" data-i18n="assets.image"></option><option value="parts" data-i18n="assets.part"></option><option value="compositions" data-i18n="assets.composition"></option></select>
      <label for="asset-definition-id" data-i18n="metadata.id"></label><input id="asset-definition-id" required pattern="[a-zA-Z0-9_\\-]+" />
      <label for="asset-json" data-i18n="assets.definitionJson"></label><textarea id="asset-json" rows="12" spellcheck="false"></textarea>
      <button id="asset-remove" type="button" data-i18n="assets.remove"></button>
    </form></details>
    <section id="graphic-definitions-editor" hidden></section>
    <section id="scene-graphic-editor" hidden></section>
    <p id="asset-error" class="error" role="alert" hidden></p>`

  const find = <T extends HTMLElement>(id: string) => {
    const node = panel.querySelector<T>(`#${id}`)

    if (!node) throw new Error(`Missing asset control: ${id}`)

    return node
  }

  const value = (id: string) =>
    find<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(id).value

  let browsingKind = ''

  // An empty gallery explains what belongs in it and offers the form that adds one.
  const showEmptyState = () => {
    const hasVisuals = [...panel.querySelectorAll<HTMLElement>('.asset-thumbnail')].some(
      (thumbnail) => !thumbnail.hidden,
    )

    const empty = find('asset-empty')
    empty.hidden = !browsingKind || hasVisuals

    if (empty.hidden) return
    const images = browsingKind === 'images' || browsingKind === 'section'
    find('asset-empty-text').textContent = t(`assets.empty.${browsingKind}`)
    const action = find<HTMLButtonElement>('asset-empty-action')
    action.textContent = t(images ? 'assets.import' : 'tree.addDefinition')
    action.dataset.target = images ? 'asset-import' : 'asset-new'
  }

  const set = (id: string, value: string | number) => {
    find<HTMLInputElement | HTMLTextAreaElement>(id).value = String(value)
  }

  const on = (id: string, event: string, action: (event: Event) => void | Promise<void>) => {
    find(id).addEventListener(
      event,
      (event) => {
        if (event.type === 'submit') event.preventDefault()
        const error = find('asset-error')
        error.hidden = true
        void Promise.resolve()
          .then(() => action(event))
          .catch((failure: unknown) => {
            error.textContent = failure instanceof Error ? failure.message : String(failure)
            error.hidden = false
          })
      },
      { signal: abort.signal },
    )
  }

  const submit = async (
    form: string,
    type: EditorCommand['type'],
    operation: () => Promise<void>,
    palette?: { target: string; next: string },
  ) => {
    if (!state?.view || state.busy || abort.signal.aborted) return

    const pending = {
      form,
      palette,
      type,
      path: state.path,
      selection:
        form === 'asset-image'
          ? value('asset-image-id')
          : form === 'asset-definition'
            ? value('asset-definition-id')
            : '',
    }

    submission = pending

    try {
      await operation()
    } finally {
      if (submission === pending) submission = undefined
    }
  }

  const save = (form: string, command: EditorCommand) =>
    submit(form, command.type, () => actions.save(command))

  const option = (value: string, text = value) => {
    const node = document.createElement('option')
    node.value = value
    node.textContent = text

    return node
  }

  const selectOptions = (id: string, entries: [string, string][]) => {
    const control = find<HTMLSelectElement>(id)
    const previous = control.value
    control.replaceChildren(...entries.map(([id, label]) => option(id, label)))

    if (entries.some(([id]) => id === previous)) control.value = previous
  }

  const catalog = () =>
    state?.view?.assets ?? assetCatalogSchema.parse({ 'schema-version': '1.0.0' })

  const kindOf = (id: string) =>
    Object.hasOwn(catalog().images, id)
      ? 'images'
      : Object.hasOwn(catalog().parts, id)
        ? 'parts'
        : 'compositions'

  const paletteAsset = (): ImageAsset | GraphicPart | undefined =>
    catalog().images[selected] ?? catalog().parts[selected]

  const makeGraphic = (visual: string) =>
    graphicComponentSchema.parse({
      id: 'asset-preview',
      type: 'graphic',
      placement: { row: 1, column: 1 },
      visual,
      alt: visual,
    })

  const renderer = new GraphicComponentRenderer()

  const definitionsEditor = bindGraphicDefinitionsEditor(
    find('graphic-definitions-editor'),
    (command) => {
      void actions.save(command)
    },
    (assets, id, appearance) =>
      resources
        ? renderer.render(
            { ...makeGraphic(id), appearance },
            { document, assets, graphics: resources, bindingMode: 'editor' },
          )
        : undefined,
    t,
  )

  const createScenePreview: SceneGraphicPreviewFactory = (component, view, startingValues) =>
    resources
      ? renderer.render(component, {
          document,
          assets: view.assets,
          graphics: resources,
          bindingMode: 'editor',
          ...(startingValues ? { bindings: startingGameBindings(view) } : {}),
        })
      : undefined

  const sceneGraphicEditor = bindSceneGraphicEditor(
    find('scene-graphic-editor'),
    (command) => {
      void actions.save(command)
    },
    createScenePreview,
    t,
  )

  const updatePreview = () => preview?.setAppearance(appearance)

  const hasDrafts = () =>
    dirty.size > 0 || definitionsEditor.hasDrafts() || sceneGraphicEditor.hasDrafts()

  const paletteCaption = (key: string) => {
    const caption = key.startsWith('@')
      ? drafts.get(key)?.name || t('assets.newPreset')
      : key || t('assets.defaults')

    return caption + (drafts.has(key) ? ' *' : '')
  }

  const syncPaletteDirty = () => {
    if (drafts.size) dirty.add('asset-palettes')
    else dirty.delete('asset-palettes')
    const picker = find<HTMLSelectElement>('asset-preset')
    const current = picker.selectedOptions?.[0]

    if (current && current.value === target) current.textContent = paletteCaption(target)
    find<HTMLSelectElement>('asset-select').disabled =
      Boolean(state?.busy) || dirty.has('asset-definition') || drafts.size > 0
    refreshSaveStatuses(panel)
  }

  const editPalette = () => {
    let draft = drafts.get(target)

    if (!draft) {
      draft = { name: target, colors: {} }
      drafts.set(target, draft)
    }

    return draft
  }

  const showImageView = () => {
    const image = catalog().images[selected]
    const existing = navigationKey.startsWith('asset:') && Boolean(image)
    const hasColors = existing && Object.keys(image!.colors).length > 0
    const colors = hasColors && imageView === 'colors'
    find('asset-image-views').hidden = !hasColors
    find('asset-image').hidden = !navigationKey.startsWith('import:') && (!existing || colors)
    find('asset-workshop').hidden = !existing || !colors
    const filePreview = find('asset-file-preview')
    filePreview.hidden = !existing || colors

    if (preview) {
      const container = colors ? find('asset-preview') : filePreview

      if (!container.contains?.(preview.element)) container.replaceChildren(preview.element)
    }

    find('asset-show-colors').setAttribute('aria-pressed', String(colors))
    find('asset-show-file').setAttribute('aria-pressed', String(!colors))
  }

  const renderColors = () => {
    const container = find('asset-color-fields')
    container.replaceChildren()
    const asset = paletteAsset()
    showImageView()

    if (!asset) return

    if (selected !== paletteOwner) {
      paletteOwner = selected
      target = ''
      drafts.clear()
      syncPaletteDirty()
    }

    if (target && !Object.hasOwn(asset.palettes, target) && !drafts.has(target)) target = ''
    const current = drafts.get(target)
    const names = [...new Set([...Object.keys(asset.palettes), ...drafts.keys()])].filter(Boolean)
    const picker = find<HTMLSelectElement>('asset-preset')
    picker.replaceChildren(...['', ...names].map((key) => option(key, paletteCaption(key))))
    picker.value = target
    set('asset-preset-name', current?.name ?? target)
    find('asset-preset-name').hidden = find('asset-name-label').hidden = !target
    find('asset-remove-preset').hidden = !Object.hasOwn(asset.palettes, target)
    find('asset-save-palette').textContent = t(target ? 'assets.savePreset' : 'assets.saveDefaults')
    appearance = graphicAppearanceSchema.parse({
      ...appearance,
      palette: Object.hasOwn(asset.palettes, target) ? target : undefined,
      colors: { ...current?.colors },
    })
    updatePreview()
    refreshSaveStatuses(panel)

    for (const [slot, fallback] of Object.entries(asset.colors)) {
      const label = document.createElement('label')
      label.textContent = slot
      const input = document.createElement('input')
      input.type = 'color'
      input.dataset.slot = slot
      input.value =
        appearance.colors[slot] ?? asset.palettes[appearance.palette ?? '']?.[slot] ?? fallback
      input.addEventListener('input', () => {
        appearance.colors[slot] = input.value
        editPalette().colors[slot] = input.value
        syncPaletteDirty()
        updatePreview()
      })
      label.append(input)
      container.append(label)
    }
  }

  const renderSlotControls = () => {
    const container = find('asset-preview-controls')
    container.replaceChildren()
    const composition = catalog().compositions[selected]

    for (const [slot, definition] of Object.entries(composition?.slots ?? {})) {
      const selection = appearance.slots[slot] ?? { colors: {}, visible: true }
      const id = selection.part === undefined ? definition.default : selection.part
      const label = document.createElement('label')
      label.textContent = slot
      const choices = document.createElement('select')
      choices.append(option('', t('assets.none')), ...definition.parts.map((part) => option(part)))
      choices.value = id ?? ''
      choices.addEventListener('change', () => {
        appearance.slots[slot] = { part: choices.value || null, colors: {}, visible: true }
        renderSlotControls()
        updatePreview()
      })
      label.append(choices)
      container.append(label)
      const part = id ? catalog().parts[id] : undefined

      if (!part) continue
      const preset = document.createElement('select')
      preset.setAttribute('aria-label', `${slot} ${t('assets.presetName')}`)
      preset.append(
        option('', t('assets.defaults')),
        ...Object.keys(part.palettes).map((name) => option(name)),
      )
      preset.value = selection.palette ?? ''
      preset.addEventListener('change', () => {
        appearance.slots[slot] = { ...selection, palette: preset.value || undefined, colors: {} }
        renderSlotControls()
        updatePreview()
      })
      container.append(preset)

      for (const [colorSlot, fallback] of Object.entries(part.colors)) {
        const colorLabel = document.createElement('label')
        colorLabel.textContent = `${slot} · ${colorSlot}`
        const input = document.createElement('input')
        input.type = 'color'
        input.value =
          selection.colors[colorSlot] ??
          part.palettes[selection.palette ?? '']?.[colorSlot] ??
          fallback
        input.addEventListener('input', () => {
          selection.colors[colorSlot] = input.value
          appearance.slots[slot] = selection
          updatePreview()
        })
        colorLabel.append(input)
        container.append(colorLabel)
      }
    }
  }

  const fillSelection = (preserve: boolean) => {
    const definitions = catalog()

    if (selected && !preserve) {
      const kind = kindOf(selected)
      set('asset-kind', kind)

      if (!dirty.has('asset-definition')) {
        set('asset-definition-id', selected)
        set('asset-json', JSON.stringify(definitions[kind][selected], null, 2))
      }

      const image = definitions.images[selected]

      if (image && !dirty.has('asset-image')) {
        set('asset-image-id', selected)
        set('asset-source', image.source)
        set('asset-format', image.format)
      }
    }

    preview?.dispose()
    preview = undefined
    find('asset-preview').replaceChildren()

    if (selected && resources) {
      preview = renderer.render(makeGraphic(selected), {
        document,
        assets: definitions,
        graphics: resources,
        bindingMode: 'editor',
      })
      find('asset-preview').append(preview.element)
      updatePreview()
    }

    renderColors()
    renderSlotControls()
  }

  const savePalette = async (mode: 'defaults' | 'preset' | 'remove') => {
    const asset = paletteAsset()

    if (!asset) return
    const changes = drafts.get(target)?.colors
    const colors = { ...(mode === 'defaults' ? asset.colors : asset.palettes[target]), ...changes }
    const palettes = { ...asset.palettes }

    const name = value('asset-preset-name')

    if (mode === 'remove') delete palettes[target]

    if (mode === 'preset') {
      if (
        !assetIdSchema.safeParse(name).success ||
        (name !== target && Object.hasOwn(palettes, name))
      ) {
        find('asset-preset-name').focus?.()
        throw new Error(t('assets.invalidPreset'))
      }

      if (target && name !== target) delete palettes[target]
      palettes[name] = colors
    }

    const next = { ...asset, colors: mode === 'defaults' ? colors : asset.colors, palettes }

    const command: EditorCommand = Object.hasOwn(catalog().images, selected)
      ? { type: 'assets.upsertImage', id: selected, image: imageAssetSchema.parse(next) }
      : { type: 'assets.upsertPart', id: selected, part: partSchema.parse(next) }

    await submit('asset-palettes', command.type, () => actions.save(command), {
      target,
      next: mode === 'preset' ? name : '',
    })
  }

  on('asset-show-colors', 'click', () => {
    imageView = 'colors'
    showImageView()
  })
  on('asset-show-file', 'click', () => {
    imageView = 'file'
    showImageView()
  })
  find('asset-preset').addEventListener('change', () => {
    target = value('asset-preset')
    renderColors()
  })
  on('asset-add-preset', 'click', () => {
    const colors = Object.fromEntries(
      [...find('asset-color-fields').querySelectorAll<HTMLInputElement>('input')].map((input) => [
        input.dataset.slot!,
        input.value,
      ]),
    )

    let index = 1

    while (drafts.has('@' + index)) index++
    target = '@' + index
    drafts.set(target, { name: '', colors })
    syncPaletteDirty()
    renderColors()
    find('asset-preset-name').focus?.()
  })
  find('asset-preset-name').addEventListener('input', () => {
    editPalette().name = value('asset-preset-name')
    syncPaletteDirty()
  })

  on('asset-empty-action', 'click', () => {
    const target = find('asset-empty-action').dataset.target

    if (target) onOpen?.(target)
  })
  on('asset-select', 'change', () => {
    selected = value('asset-select')
    appearance = graphicAppearanceSchema.parse({})
    fillSelection(false)
  })
  on('asset-image', 'submit', async (event) => {
    event.preventDefault()
    const format = imageAssetSchema.shape.format.parse(value('asset-format'))
    const file = find<HTMLInputElement>('asset-file').files?.[0]

    if (file) {
      await submit('asset-image', 'assets.upsertImage', () =>
        actions.importAsset(value('asset-image-id'), format, file),
      )

      return
    }

    if (!state?.view) return
    const source = value('asset-source')
    const id = value('asset-image-id')
    const path = state.path
    const revision = state.view.revision
    const bytes = await new EditorWorkspaceResources(path, fetcher).readBytes(source)

    if (state.path !== path || state.view?.revision !== revision)
      throw new Error(t('project.changed'))

    const info = inspectImageSource(
      format,
      bytes,
      format === 'svg' ? new TextDecoder('utf-8', { fatal: true }).decode(bytes) : '',
    )

    const previous = catalog().images[id]
    const colors = { ...info.colors }

    for (const slot of Object.keys(colors))
      if (previous?.colors[slot]) colors[slot] = previous.colors[slot]!
    await save('asset-image', {
      type: 'assets.upsertImage',
      id,
      image: {
        format,
        source,
        bounds: info.bounds,
        colors,
        palettes: previous?.palettes ?? {},
        ...(previous?.preview ? { preview: previous.preview } : {}),
      },
    })
  })
  on('asset-file', 'change', () => {
    const file = find<HTMLInputElement>('asset-file').files?.[0]

    if (!file) return
    const extension = file.name.split('.').at(-1)?.toLowerCase()

    if (extension) set('asset-format', extension === 'jpg' ? 'jpeg' : extension)

    if (!value('asset-image-id'))
      set('asset-image-id', file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-'))
  })
  on('asset-definition', 'submit', async (event) => {
    event.preventDefault()
    const definition: unknown = JSON.parse(value('asset-json'))
    const id = value('asset-definition-id')

    if (value('asset-kind') === 'images')
      await save('asset-definition', {
        type: 'assets.upsertImage',
        id,
        image: imageAssetSchema.parse(definition),
      })
    else if (value('asset-kind') === 'parts')
      await save('asset-definition', {
        type: 'assets.upsertPart',
        id,
        part: partSchema.parse(definition),
      })
    else
      await save('asset-definition', {
        type: 'assets.upsertComposition',
        id,
        composition: compositionSchema.parse(definition),
      })
  })
  on('asset-remove', 'click', () =>
    save('asset-definition', { type: 'assets.remove', kind: kindOf(selected), id: selected }),
  )
  on('asset-palettes', 'submit', (event) => {
    event.preventDefault()

    return savePalette(target ? 'preset' : 'defaults')
  })
  on('asset-remove-preset', 'click', () => savePalette('remove'))

  for (const id of ['asset-image', 'asset-palettes', 'asset-definition']) {
    bindFormSaveBar(find(id), t, () =>
      id === 'asset-palettes' ? drafts.has(target) : dirty.has(id),
    )
    find(id)
      .querySelector?.('[data-discard]')
      ?.addEventListener(
        'click',
        () => {
          dirty.delete(id)
          find<HTMLFormElement>(id).reset()

          if (id === 'asset-palettes') {
            drafts.delete(target)
            syncPaletteDirty()
            renderColors()
            updatePreview()
          } else if (id === 'asset-definition') {
            const existing = selected && navigationKey.startsWith('asset:')

            if (existing) {
              const kind = kindOf(selected)
              set('asset-kind', kind)
              set('asset-definition-id', selected)
              set('asset-json', JSON.stringify(catalog()[kind][selected], null, 2))
            } else set('asset-json', '{}')
          } else if (navigationKey.startsWith('asset:')) {
            const image = catalog().images[selected]

            if (image) {
              set('asset-image-id', selected)
              set('asset-format', image.format)
              set('asset-source', image.source)
            }
          }

          find<HTMLSelectElement>('asset-select').disabled =
            dirty.has('asset-definition') || dirty.has('asset-palettes')
          find('asset-error').hidden = true
        },
        { signal: abort.signal },
      )

    if (id === 'asset-palettes') continue
    on(id, 'input', () => {
      dirty.add(id)

      if (id === 'asset-definition') find<HTMLSelectElement>('asset-select').disabled = true
    })
  }

  for (const node of panel.querySelectorAll<HTMLElement>('[data-i18n]'))
    node.textContent = t(node.dataset.i18n!)

  for (const control of panel.querySelectorAll<
    HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement
  >('input, button, select, textarea'))
    control.disabled = true

  registerEditorDraft(
    panel,
    'assets',
    z.object({
      selected: z.string(),
      navigationKey: z.string(),
      browsingKind: z.string(),
      appearance: graphicAppearanceSchema,
      dirty: z.array(z.string()),
      imageView: z.enum(['colors', 'file']).optional(),
    }),
    () =>
      hasDrafts()
        ? { selected, navigationKey, browsingKind, imageView, appearance, dirty: [...dirty] }
        : undefined,
    (saved) => {
      selected = saved.selected
      navigationKey = saved.navigationKey
      browsingKind = saved.browsingKind
      imageView = saved.imageView ?? 'colors'
      appearance = saved.appearance
      dirty.clear()

      for (const id of saved.dirty) dirty.add(id)
      set('asset-select', selected)
      fillSelection(false)
    },
  )

  registerEditorDraft(
    find('asset-palettes'),
    'asset-palettes',
    z.union([
      z.object({ target: z.string(), entries: z.array(z.tuple([z.string(), paletteDraftSchema])) }),
      z.array(z.object({ value: z.string(), checked: z.boolean() })),
    ]),
    () => (drafts.size ? { target, entries: [...drafts] } : undefined),
    (saved) => {
      drafts.clear()
      paletteOwner = selected

      if (Array.isArray(saved)) {
        // Older forms stored the picker, slot colors and preset name in display order.
        target = saved[0]?.value ?? ''
        const name = saved.at(-1)?.value ?? target

        if (!target && name) target = '@1'
        drafts.set(target, {
          name,
          colors: Object.fromEntries(
            Object.keys(paletteAsset()?.colors ?? {}).map((slot, i) => [
              slot,
              saved[i + 1]?.value ?? '',
            ]),
          ),
        })
      } else {
        target = saved.target

        for (const [key, draft] of saved.entries) drafts.set(key, draft)
      }

      syncPaletteDirty()
      renderColors()
    },
    'image-presets-v2',
  )

  for (const id of ['asset-image', 'asset-definition'])
    registerFormDraft(find(id), id, () => dirty.has(id))

  return {
    createScenePreview,
    hasDrafts,
    canNavigate: (kind: string, id?: string, sceneId?: string) =>
      navigationKey === route(kind, id, sceneId) || !hasDrafts(),
    draftLocations(fallback: string): DraftLocation[] {
      const [kind, , id] = navigationKey.split(':')

      const key =
        kind === 'asset'
          ? 'asset:' + id
          : kind === 'import'
            ? 'asset-import'
            : kind === 'new-asset'
              ? 'asset-new'
              : fallback

      const locations: DraftLocation[] = [...drafts].map(([preset, draft]) => ({
        key,
        detail:
          t('assets.colors') +
          ' › ' +
          (draft.name || (preset ? t('assets.newPreset') : t('assets.defaults'))),
        reveal() {
          imageView = 'colors'
          target = preset
          renderColors()
          find('asset-save-palette').focus()
        },
      }))

      if (dirty.has('asset-image'))
        locations.push({
          key,
          detail: t('assets.imageFile'),
          reveal() {
            imageView = 'file'
            showImageView()
            find('asset-image-id').focus()
          },
        })

      if (dirty.has('asset-definition'))
        locations.push({
          key,
          detail: t('assets.imageDefinition'),
          reveal() {
            const details = find('asset-definition').closest('details')

            if (details) details.open = true
            find('asset-definition-id').focus()
          },
        })

      if (definitionsEditor.hasDrafts() || sceneGraphicEditor.hasDrafts()) locations.push({ key })

      return locations
    },
    navigate(kind: string, id?: string, sceneId?: string, preserveDefinitionSelection = false) {
      const nextKey = route(kind, id, sceneId)
      const changing = nextKey !== navigationKey
      navigationKey = nextKey

      if (changing) imageView = 'colors'
      const graphic = kind === 'component' || kind === 'new-graphic'
      const structured = kind === 'new-asset' || (kind === 'asset' && id && !catalog().images[id])
      find('graphic-definitions-editor').hidden = !structured

      if (
        structured &&
        (changing || structuredPath !== state?.path || !preserveDefinitionSelection)
      ) {
        definitionsEditor.navigate(
          id && catalog().compositions[id] ? 'compositions' : 'parts',
          kind === 'asset' ? id : undefined,
        )
        structuredPath = state?.path
      }

      const browsing = ['section', 'images', 'parts', 'compositions'].includes(kind)
      // The pane heading names the selection; the introduction belongs to the galleries only.
      find('asset-intro').hidden = !browsing
      find('asset-gallery').hidden = !browsing
      browsingKind = browsing ? kind : ''

      for (const thumbnail of panel.querySelectorAll<HTMLElement>('.asset-thumbnail'))
        thumbnail.hidden = kind !== 'section' && thumbnail.dataset.assetKind !== kind
      showEmptyState()
      find('asset-workshop').hidden = kind !== 'asset' || Boolean(structured)
      find('asset-image').hidden =
        kind !== 'import' && !(kind === 'asset' && id && catalog().images[id])
      // An existing image edits its file; only the import node starts a new one.
      const imageHeading = find('asset-image-heading')
      imageHeading.dataset.i18n = kind === 'import' ? 'assets.import' : 'assets.imageFile'
      imageHeading.textContent = t(imageHeading.dataset.i18n)
      const definition = find('asset-definition').parentElement!
      definition.hidden = Boolean(structured) || (kind !== 'asset' && kind !== 'new-asset')
      definition.toggleAttribute('open', kind === 'new-asset')
      find('scene-graphic-editor').hidden = !graphic

      if (kind === 'asset' && id && (changing || selected !== id)) {
        selected = id
        set('asset-select', id)
        appearance = graphicAppearanceSchema.parse({})
        fillSelection(false)
      }

      showImageView()

      if (changing && kind === 'import' && !dirty.has('asset-image'))
        find<HTMLFormElement>('asset-image').reset()

      if (changing && kind === 'new-asset' && !dirty.has('asset-definition')) {
        set('asset-definition-id', '')
        set('asset-json', '{}')
      }

      if (
        graphic &&
        sceneId &&
        (changing || graphicPath !== state?.path || !preserveDefinitionSelection)
      ) {
        sceneGraphicEditor.navigate(sceneId, kind === 'component' ? id : undefined)
        graphicPath = state?.path
      }
    },
    render(next: ProjectEditorState, replace: boolean) {
      state = next

      if (controlLanguage !== t('assets.defaults')) {
        controlLanguage = t('assets.defaults')
        renderColors()
        renderSlotControls()
      }

      const saved =
        submission &&
        submission.path === next.path &&
        replace &&
        !next.busy &&
        !next.error &&
        next.preserveDrafts &&
        next.lastCommand === submission.type
          ? submission
          : undefined

      const requestedSelection = saved?.selection

      for (const node of panel.querySelectorAll<HTMLElement>('[data-i18n]'))
        node.textContent = t(node.dataset.i18n!)

      if (replace) {
        if (!next.preserveDrafts) {
          dirty.clear()
          drafts.clear()
          target = ''
          set('asset-file', '')
          submission = undefined
        } else if (saved) {
          dirty.delete(saved.form)

          if (saved.palette) {
            drafts.delete(saved.palette.target)
            target = saved.palette.next
            syncPaletteDirty()
          }

          if (saved.form === 'asset-image') set('asset-file', '')
          submission = undefined
        }
      }

      for (const control of panel.querySelectorAll<
        HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement
      >('input, button, select, textarea'))
        if (!control.closest('#graphic-definitions-editor, #scene-graphic-editor'))
          control.disabled = next.busy || !next.view?.game
      find<HTMLSelectElement>('asset-select').disabled ||=
        dirty.has('asset-definition') || dirty.has('asset-palettes')

      if (!replace || !next.view) {
        definitionsEditor.render(next, replace)
        sceneGraphicEditor.render(next, replace)

        return
      }

      const definitions = catalog()

      const visuals = [
        ...Object.keys(definitions.images),
        ...Object.keys(definitions.parts),
        ...Object.keys(definitions.compositions),
      ]

      const entries: [string, string][] = visuals.map((id) => [id, id])
      selectOptions('asset-select', entries)

      if (
        requestedSelection &&
        (!drafts.size || requestedSelection === paletteOwner) &&
        visuals.includes(requestedSelection)
      )
        set('asset-select', requestedSelection)
      selected = value('asset-select')

      if (resourceRevision !== `${next.path}:${next.view.revision}`) {
        preview?.dispose()

        for (const thumbnail of thumbnails) thumbnail.dispose()
        thumbnails = []
        resources?.dispose()
        resources = new BrowserGraphicResources(
          new EditorWorkspaceResources(next.path, fetcher),
          createGraphicPlatform(document),
        )
        resourceRevision = `${next.path}:${next.view.revision}`
        const gallery = find('asset-gallery')
        gallery.replaceChildren()

        for (const id of visuals) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'asset-thumbnail'
          button.dataset.assetKind = kindOf(id)
          button.setAttribute('aria-label', id)

          const thumbnail = renderer.render(makeGraphic(id), {
            document,
            assets: definitions,
            graphics: resources,
            bindingMode: 'editor',
          })

          thumbnails.push(thumbnail)
          const caption = document.createElement('span')
          caption.textContent = id
          button.append(thumbnail.element, caption)
          button.addEventListener('click', () => {
            if (onSelectAsset) {
              onSelectAsset(id)

              return
            }

            if (dirty.has('asset-definition') || dirty.has('asset-palettes')) return
            selected = id
            set('asset-select', id)
            appearance = graphicAppearanceSchema.parse({})
            fillSelection(false)
          })
          gallery.append(button)
        }
      }

      if (!dirty.has('asset-palettes')) appearance = graphicAppearanceSchema.parse({})
      fillSelection(false)
      showEmptyState()
      definitionsEditor.render(next, replace)
      sceneGraphicEditor.render(next, replace)
    },
    dispose() {
      definitionsEditor.dispose()
      sceneGraphicEditor.dispose()
      abort.abort()
      preview?.dispose()

      for (const thumbnail of thumbnails) thumbnail.dispose()
      resources?.dispose()
    },
  }
}
