import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import { mapDefinitionSchema, mapObjectSchema, mapObjectStateSchema } from '@ancadeba/schemas'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import { MapDraft, MapDraftError, type TilePoint } from './mapDraft.js'
import { mapTileGrid, mapGridViewport } from './mapTileGrid.js'
import type { ProjectEditorState } from './projectController.js'
import { ruleFormControls, saveBar } from './ruleFormControls.js'
import { mapTileImages, type IGraphicResources } from '@ancadeba/ui-components'
import { mapTilesetEditor, type TilesetEditorState } from './mapTilesetEditor.js'
import { mapLayerEditor, type MapLayerEditorState } from './mapLayerEditor.js'
import { mapEditorTabs, mapEditorTabIds, type MapEditorTab } from './mapEditorTabs.js'
import { mapTerrainEditor, type MapTerrainEditorState } from './mapTerrainEditor.js'
import { mapPlacementTools, type MapPlacementTool } from './mapPlacementTools.js'
import { MapTileSelection } from './mapTileSelection.js'
import { mapSelectionTools } from './mapSelectionTools.js'
import { MapDraftHistory } from './mapDraftHistory.js'
import { mapEntryTriggerEditor, type MapEntryTriggerEditorState } from './mapEntryTriggerEditor.js'
import { mapObjectEditor, type MapObjectEditorState } from './mapObjectEditor.js'

// Keep unfinished trigger and object fields recoverable while validating map geometry.
const mapDraftSchema = z
  .object({
    ...mapDefinitionSchema.shape,
    entryTriggers: z
      .array(z.object({ id: z.string(), x: z.number(), y: z.number(), action: z.string() }))
      .optional(),
    objects: z
      .array(
        z.object({
          ...mapObjectSchema.shape,
          id: z.string(),
          label: z.string(),
          action: z.string(),
          terrain: z.string(),
          x: z.number(),
          y: z.number(),
          states: z
            .array(
              z.object({
                ...mapObjectStateSchema.shape,
                id: z.string(),
                label: z.string().optional(),
                terrain: z.string().optional(),
                when: z.object({ path: z.array(z.string()), value: z.boolean() }),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
  })
  .superRefine((map, context) => {
    const parsed = mapDefinitionSchema.safeParse({
      ...map,
      entryTriggers: undefined,
      objects: undefined,
    })

    if (!parsed.success)
      for (const issue of parsed.error.issues)
        context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
  })

type MapCommand = Extract<EditorCommand, { type: 'game.upsertMap' | 'game.removeMap' }>

export function bindMapEditor(
  root: HTMLElement,
  save: (command: MapCommand) => void,
  t: Translate,
  options: {
    confirm: (message: string) => boolean | Promise<boolean>
    onNavigate?: (id: string | undefined) => void
    onSaved?: (id: string | undefined) => void
    createGraphics?: (path: string) => IGraphicResources & { dispose(): void }
    onHistoryChange?: () => void
  },
) {
  const document = root.ownerDocument
  root.classList.add('map-editor')
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  const fields = document.createElement('fieldset')
  root.replaceChildren(error, fields)
  let view: ProjectView | undefined
  let path: string | undefined
  let selected = ''
  let creating = true
  let id = ''
  let draft = new MapDraft()
  let brush = 'ground'
  let width = '16'
  let height = '12'
  let terrainState: MapTerrainEditorState = { selected: 'ground', newId: '' }
  let activeTab: MapEditorTab = 'paint'
  let placementTool: MapPlacementTool = 'object'
  let tabs: ReturnType<typeof mapEditorTabs> | undefined
  let refreshActions = () => {}
  let dirty = false
  let busy = false
  let confirming = false
  let submitted: MapCommand | undefined
  let board: ReturnType<typeof mapTileGrid> | undefined
  let images: ReturnType<typeof mapTileImages> | undefined
  let graphics: (IGraphicResources & { dispose(): void }) | undefined
  let tilesetEditor: ReturnType<typeof mapTilesetEditor> | undefined
  let graphicsRevision = ''
  let tilesetState: TilesetEditorState = { selected: '', newId: '', column: 0, row: 0 }
  let layerState: MapLayerEditorState = { selected: '', newId: '', erasing: false }
  let gridViewport = mapGridViewport()
  let selection = new MapTileSelection()
  let tileTools: ReturnType<typeof mapSelectionTools> | undefined
  let entryEditor: ReturnType<typeof mapEntryTriggerEditor> | undefined
  const entryState: MapEntryTriggerEditorState = { selected: -1 }
  const objectState: MapObjectEditorState = { selected: -1, overrides: {} }
  let placementDetails = false
  let objectEditor: ReturnType<typeof mapObjectEditor> | undefined
  const capture = () => ({ map: draft.data, id })
  const history = new MapDraftHistory(capture())
  const inputGroups = new WeakMap<Element, number>()
  let nextInputGroup = 1
  let strokeActive = false
  let strokeChanged = false

  const draftHistory = () => ({
    active: history.active || strokeChanged,
    canUndo: history.canUndo || strokeChanged,
    canRedo: !strokeChanged && history.canRedo,
    blocked: busy || confirming,
  })

  const notifyHistory = () => {
    tileTools?.refresh()
    refreshActions()
    options.onHistoryChange?.()
  }

  const syncDirty = () => {
    dirty =
      strokeChanged ||
      history.dirty ||
      width !== String(draft.data.width) ||
      height !== String(draft.data.height) ||
      Boolean(terrainState.newId || layerState.newId || tilesetState.newId) ||
      (!creating && !view?.maps?.[selected])
  }

  const record = (group?: number) => {
    history.record(capture(), layerState.selected, group)
    syncDirty()
    notifyHistory()
  }

  const finishStroke = () => {
    if (!strokeActive) return
    strokeActive = false
    strokeChanged = false
    record()
  }

  const controls = ruleFormControls(
    document,
    () => {
      const input = document.activeElement
      let group: number | undefined

      if (input?.tagName === 'INPUT' || input?.tagName === 'TEXTAREA') {
        group = inputGroups.get(input)

        if (group === undefined) {
          group = nextInputGroup++
          inputGroups.set(input, group)
        }
      }

      record(group)
    },
    t,
  )

  const report = (cause: unknown) => {
    error.textContent =
      cause instanceof MapDraftError
        ? t(`maps.${cause.code}`)
        : cause instanceof Error
          ? cause.message
          : String(cause)
  }

  const change = (operation: () => void) => {
    try {
      finishStroke()
      history.breakGroup()
      operation()
      record()
      error.textContent = ''
      render()
    } catch (cause) {
      report(cause)
    }
  }

  const reset = () => {
    finishStroke()

    if (!creating && !view?.maps?.[selected]) {
      selected = view?.game?.maps?.[0] ?? ''
      selection = new MapTileSelection()
    }

    if (!selected) creating = true
    draft = new MapDraft(creating ? undefined : view?.maps?.[selected])
    id = creating ? 'new-map' : selected

    if (creating) {
      let suffix = 2

      while (view?.game?.maps?.some((mapId) => mapId.toLowerCase() === id.toLowerCase()))
        id = `new-map-${suffix++}`
    }

    brush = Object.hasOwn(draft.data.terrain, brush)
      ? brush
      : (Object.keys(draft.data.terrain)[0] ?? '')
    width = String(draft.data.width)
    height = String(draft.data.height)
    terrainState = {
      selected: Object.hasOwn(draft.data.terrain, terrainState.selected)
        ? terrainState.selected
        : brush,
      newId: '',
    }
    const retainedLayer = draft.data.layers?.find((layer) => layer.id === layerState.selected)
    layerState = {
      selected: retainedLayer?.id ?? '',
      newId: '',
      erasing: Boolean(retainedLayer && layerState.erasing),
    }
    const tile = draft.data.terrain[terrainState.selected]?.tile
    tilesetState = {
      selected: tile?.tileset ?? '',
      newId: '',
      column: tile?.column ?? 0,
      row: tile?.row ?? 0,
    }
    history.reset(capture())
    dirty = false
    error.textContent = ''
    render()
    notifyHistory()
  }

  const confirm = async (message: string) => {
    if (busy || confirming) return false
    confirming = true
    fields.disabled = true
    notifyHistory()

    try {
      return await options.confirm(message)
    } finally {
      confirming = false
      fields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)
      notifyHistory()
    }
  }

  const resize = async () => {
    finishStroke()
    const nextWidth = Number(width)
    const nextHeight = Number(height)

    if (nextWidth === draft.data.width && nextHeight === draft.data.height) return true
    // Validate dimensions before asking about cropping or allocating a larger map.
    const candidate = new MapDraft(draft.data)
    const groundFill = layerState.selected ? (draft.data.tiles[0]?.[0] ?? brush) : brush
    candidate.resize(nextWidth, nextHeight, groundFill)

    if (
      (nextWidth < draft.data.width || nextHeight < draft.data.height) &&
      !(await confirm(t('maps.cropConfirm')))
    )
      return false
    draft = candidate
    width = String(draft.data.width)
    height = String(draft.data.height)
    record()
    render()

    return true
  }

  const submit = (command: MapCommand) => {
    finishStroke()
    const parsed = commandSchema.safeParse(command)

    if (!parsed.success) {
      error.textContent = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')

      return
    }

    submitted = command
    error.textContent = ''
    save(command)
  }

  const navigate = (mapId?: string, newMap = false): boolean => {
    const next = newMap
      ? ''
      : (mapId ?? (view?.maps?.[selected] ? selected : (view?.game?.maps?.[0] ?? '')))

    const nextCreating = newMap || !next

    if (next === selected && nextCreating === creating) return true

    if (dirty) {
      error.textContent = t('maps.saveFirst')

      return false
    }

    placementDetails = false
    entryState.selected = objectState.selected = -1
    objectState.overrides = {}
    selected = next
    creating = nextCreating
    brush = ''
    terrainState = { selected: '', newId: '' }
    gridViewport = mapGridViewport()
    selection = new MapTileSelection()
    layerState = { selected: '', newId: '', erasing: false }
    reset()

    return true
  }

  const restoreDraft = (direction: 'undo' | 'redo') => {
    if (busy || confirming) return
    finishStroke()
    const restored = direction === 'undo' ? history.undo() : history.redo()

    if (!restored) return
    const pendingWidth = width !== String(draft.data.width)
    const pendingHeight = height !== String(draft.data.height)

    const restoreEntry = (
      previous: readonly { id: string }[] = [],
      next: readonly { id: string }[] = [],
      index = 0,
    ) => {
      if (previous.length < next.length) {
        const added = next.findIndex((entry) => !previous.some((other) => other.id === entry.id))

        if (added >= 0) return added
      }

      const matched = next.findIndex((entry) => entry.id === previous[index]?.id)

      return matched >= 0 ? matched : Math.min(index, next.length - 1)
    }

    const previousObject = draft.data.objects?.[objectState.selected]
    objectState.selected = restoreEntry(
      draft.data.objects,
      restored.state.map.objects,
      objectState.selected,
    )
    entryState.selected = restoreEntry(
      draft.data.entryTriggers,
      restored.state.map.entryTriggers,
      entryState.selected,
    )
    const nextObject = restored.state.map.objects?.[objectState.selected]

    if (nextObject && previousObject?.id === nextObject.id)
      objectState.overrides[nextObject.id] = restoreEntry(
        previousObject.states,
        nextObject.states,
        objectState.overrides[nextObject.id],
      )
    draft = new MapDraft(restored.state.map)
    id = restored.state.id

    if (!pendingWidth) width = String(draft.data.width)

    if (!pendingHeight) height = String(draft.data.height)
    layerState.selected = draft.data.layers?.some((layer) => layer.id === restored.layer)
      ? restored.layer
      : ''
    layerState.erasing = Boolean(layerState.selected && layerState.erasing)

    if (!Object.hasOwn(draft.data.terrain, brush)) brush = Object.keys(draft.data.terrain)[0] ?? ''
    selection.setTool(selection.tool === 'paste' ? 'select' : selection.tool)
    selection.reconcile(draft, layerState.selected)
    syncDirty()
    error.textContent = ''
    render()
    notifyHistory()

    if (activeTab === 'objects' && placementDetails) {
      if (placementTool === 'object') objectEditor?.focusSelected()
      else entryEditor?.focusSelected()
    } else if (activeTab === 'paint' || activeTab === 'objects') board?.focus()
    else tabs?.focus()
  }

  const switchTab = (tab: MapEditorTab) => {
    if (busy || confirming) return
    finishStroke()
    history.breakGroup()
    activeTab = tab
    render()
    tabs?.focus()
  }

  const render = () => {
    board?.dispose()
    images?.dispose()
    board = undefined
    fields.replaceChildren()

    if (!view?.game) return

    if (!draft.data.entryTriggers?.[entryState.selected])
      entryState.selected = draft.data.entryTriggers?.length ? 0 : -1

    if (!draft.data.objects?.[objectState.selected])
      objectState.selected = draft.data.objects?.length ? 0 : -1

    if (!Object.hasOwn(draft.data.terrain, terrainState.selected))
      terrainState.selected = Object.keys(draft.data.terrain)[0] ?? ''
    images = mapTileImages(
      draft.data,
      view.assets,
      graphics,
      () => {
        board?.refresh()
        tilesetEditor?.refresh()
      },
      (message) => {
        error.textContent = message
      },
    )
    const form = document.createElement('form')
    form.className = 'map-editor-form'
    const savedIds = view.game.maps ?? []

    const picker = controls.select(
      t('maps.map'),
      creating ? '' : selected,
      [['', t('maps.new')], ...savedIds.map((mapId) => [mapId, mapId] as const)],
      (value) => {
        if (!navigate(value || undefined, value === ''))
          picker.querySelector('select')!.value = creating ? '' : selected
        else options.onNavigate?.(value || undefined)
      },
      false,
    )

    // The explorer lists every map and New map, so this picker only backs keyboard tests.
    picker.setAttribute('data-explorer-chosen', '')

    const name = controls.input(t('maps.id'), id, (value) => {
      id = value.trim()
    })

    name.querySelector('input')!.readOnly = !creating
    const dimensions = document.createElement('div')
    dimensions.className = 'map-editor-dimensions'
    dimensions.append(
      controls.input(
        t('maps.width'),
        width,
        (value) => {
          width = value
        },
        'number',
      ),
      controls.input(
        t('maps.height'),
        height,
        (value) => {
          height = value
        },
        'number',
      ),
      controls.button(t('maps.resize'), async () => {
        if (busy || confirming) return

        try {
          await resize()
        } catch (cause) {
          report(cause)
        }
      }),
    )

    for (const input of dimensions.querySelectorAll('input')) {
      input.min = '1'
      input.step = '1'
    }

    const references = view.scenes.flatMap((scene) =>
      scene.components.flatMap((component) =>
        component.type === 'map-view' && component.map === selected
          ? [{ scene: scene.id, component }]
          : [],
      ),
    )

    const help = document.createElement('p')
    help.className = 'help'
    help.textContent = references.length
      ? t('maps.references', {
          scenes: [...new Set(references.map((reference) => reference.scene))].join(', '),
        })
      : t('maps.placeHelp')

    const terrain = mapTerrainEditor(
      document,
      draft,
      controls,
      t,
      terrainState,
      tilesetState,
      render,
      change,
      () => board?.refresh(),
      (removed, replacement) => {
        if (brush === removed) brush = replacement
      },
    )

    const brushes = document.createElement('div')
    brushes.className = 'map-brushes'

    const brushPicker = controls.select(
      t('maps.brush'),
      brush,
      Object.keys(draft.data.terrain),
      (value) => {
        brush = value
        render()
      },
      false,
    )

    const instructions = document.createElement('p')
    instructions.className = 'help'
    instructions.textContent = `${t('maps.paintHelp')} ${t('maps.entryGridLegend')}`

    const spawns = new Set(
      references.flatMap(({ component }) =>
        component.playerSpawn ? [`${component.playerSpawn.x},${component.playerSpawn.y}`] : [],
      ),
    )

    const { element: layers, picker: layerPicker } = mapLayerEditor(
      document,
      draft,
      controls,
      t,
      layerState,
      render,
      change,
      confirm,
    )

    const gridDisabled = () =>
      busy ||
      confirming ||
      (activeTab !== 'objects' &&
        draft.data.layers?.find((layer) => layer.id === layerState.selected)?.visible === false)

    const openTrigger = (point: TilePoint) => {
      if (gridDisabled()) return
      finishStroke()
      history.breakGroup()

      const index =
        draft.data.entryTriggers?.findIndex(({ x, y }) => x === point.x && y === point.y) ?? -1

      let opened = index >= 0

      if (index >= 0) {
        placementDetails = true
        entryState.selected = index
        error.textContent = ''
        render()
      } else {
        const action = Object.keys(view?.rules?.actions ?? {})[0]

        if (!action) {
          error.textContent = t('maps.entryRuleFirst')

          return
        }

        change(() => {
          entryState.selected = draft.addEntryTrigger(point, action)
          placementDetails = true
          opened = true
        })
      }

      if (opened) entryEditor?.focusSelected()
    }

    const openObject = (point: TilePoint) => {
      if (gridDisabled()) return
      finishStroke()
      history.breakGroup()

      const index =
        draft.data.objects?.findIndex(({ x, y }) => x === point.x && y === point.y) ?? -1

      let opened = index >= 0

      if (index >= 0) {
        placementDetails = true
        objectState.selected = index
        error.textContent = ''
        render()
      } else {
        const action = Object.keys(view?.rules?.actions ?? {})[0]

        if (!action) {
          error.textContent = t('maps.entryRuleFirst')

          return
        }

        if (spawns.has(`${point.x},${point.y}`)) {
          error.textContent = t('maps.objectSpawn')

          return
        }

        change(() => {
          objectState.selected = draft.addObject(point, action, brush, t('maps.objectDefaultLabel'))
          placementDetails = true
          opened = true
        })
      }

      if (opened) objectEditor?.focusSelected()
    }

    tileTools = mapSelectionTools(document, draft, layerState, selection, t, {
      disabled: gridDisabled,
      repaint: () => board?.refresh(false),
      focusGrid: () => board?.focus(),
      edited: () => {
        record()
        board?.refreshOverview()
        error.textContent = ''
      },
      report,
      assets: view.assets,
      imageUrl: (image) => images?.url(image),
      history: { state: draftHistory, restore: restoreDraft },
    })

    const placement = mapPlacementTools(document, controls, t, placementTool, {
      disabled: gridDisabled,
      select: (tool) => {
        if (busy || confirming) return
        finishStroke()
        placementDetails = false
        placementTool = tool
        switchTab('objects')
        board?.focus()
      },
      activate: placementTool === 'object' ? openObject : openTrigger,
      selected: ({ x, y }) => {
        const selected =
          placementTool === 'object'
            ? draft.data.objects?.[objectState.selected]
            : draft.data.entryTriggers?.[entryState.selected]

        return selected?.x === x && selected.y === y
      },
      paint: () => {
        switchTab('paint')
        board?.focus()
      },
      historyActive: () => draftHistory().active,
      restore: restoreDraft,
    })

    board = mapTileGrid(
      document,
      draft,
      () => brush,
      () => {
        if (strokeActive) {
          strokeChanged = true
          dirty = true
          notifyHistory()
        } else record()
      },
      gridDisabled,
      t,
      spawns,
      view.assets,
      (image) => images?.url(image),
      () => layerState.selected,
      () => layerState.erasing,
      gridViewport,
      activeTab === 'objects' ? placement.interaction : tileTools.interaction,
      {
        begin: () => {
          finishStroke()
          history.breakGroup()
          strokeActive = true
        },
        end: finishStroke,
      },
    )
    tilesetEditor = mapTilesetEditor(
      document,
      draft.data,
      view.assets,
      terrainState.selected,
      controls,
      t,
      (image) => images?.url(image),
      tilesetState,
      render,
      () => {
        board?.refresh()

        terrain.refresh()
      },
      report,
    )
    const saveButton = document.createElement('button')
    saveButton.type = 'submit'
    saveButton.textContent = t(creating ? 'maps.create' : 'maps.save')
    saveButton.disabled = !creating && !view.maps?.[selected]
    const title = document.createElement('strong')
    const status = document.createElement('span')
    status.className = 'map-draft-status'
    status.setAttribute('role', 'status')
    const undo = controls.button(t('maps.undoDraft'), () => restoreDraft('undo'))
    const redo = controls.button(t('maps.redoDraft'), () => restoreDraft('redo'))

    const actions = saveBar(
      document,
      title,
      status,
      saveButton,
      undo,
      redo,
      controls.button(t('maps.discard'), reset),
    )

    actions.classList.add('map-editor-header')
    refreshActions = () => {
      title.textContent = id || t('maps.new')
      status.textContent = t(dirty ? 'maps.unsaved' : 'maps.noChanges')
      undo.disabled = busy || confirming || !draftHistory().canUndo
      redo.disabled = busy || confirming || !draftHistory().canRedo
    }

    refreshActions()
    tabs = mapEditorTabs(document, t, activeTab, switchTab)
    actions.append(tabs.element)
    const pages = tabs.pages

    const deleteMap = !creating
      ? controls.button(
          t('maps.delete'),
          async () => {
            if (busy || confirming) return

            if (dirty) {
              error.textContent = t('maps.saveFirst')

              return
            }

            if (await confirm(t('maps.deleteConfirm', { id: selected })))
              submit({ type: 'game.removeMap', mapId: selected })
          },
          dirty,
        )
      : undefined

    brushes.append(layerPicker, brushPicker, tileTools.picker)

    const editTerrain = controls.button(t('maps.editTerrain'), () => {
      terrainState.selected = brush
      const tile = draft.data.terrain[brush]?.tile

      if (tile)
        Object.assign(tilesetState, {
          selected: tile.tileset,
          column: tile.column,
          row: tile.row,
        })
      switchTab('terrain')
    })

    entryEditor = mapEntryTriggerEditor(
      draft,
      Object.keys(view.rules?.actions ?? {}),
      controls,
      t,
      change,
      entryState,
      () => board?.refresh(false),
    )

    objectEditor = mapObjectEditor(
      draft,
      Object.keys(view.rules?.actions ?? {}),
      controls,
      t,
      change,
      objectState,
      () => board?.refresh(false),
      spawns,
      view.rules?.state ?? [],
    )

    const fill = controls.button(
      t(layerState.selected ? 'maps.fillLayer' : 'maps.fill'),
      async () => {
        if (busy || confirming) return

        const message = layerState.selected
          ? t('maps.fillLayerConfirm', {
              layer:
                draft.data.layers?.find((layer) => layer.id === layerState.selected)?.name ??
                layerState.selected,
              terrain: layerState.erasing ? t('maps.emptyTile') : brush,
            })
          : t('maps.fillConfirm', { terrain: brush })

        if (await confirm(message))
          change(() => draft.fill(layerState.erasing ? null : brush, layerState.selected))
      },
    )

    const paintWorkspace = document.createElement('div')
    paintWorkspace.className = 'map-paint-workspace'
    const paintCanvas = document.createElement('div')
    paintCanvas.className = 'map-paint-canvas'
    paintCanvas.append(brushes)

    if (activeTab !== 'objects') paintCanvas.append(board.element)
    paintCanvas.append(instructions, editTerrain, fill, tileTools.element)
    paintWorkspace.append(paintCanvas, layers)
    pages.paint.append(paintWorkspace)
    pages.terrain.append(terrain.element, tilesetEditor.element, terrain.settings, terrain.manage)
    const placementWorkspace = document.createElement('div')
    placementWorkspace.className = 'map-placement-workspace'
    const placementCanvas = document.createElement('div')
    placementCanvas.className = 'map-placement-canvas'
    placementWorkspace.dataset.details = String(placementDetails)
    const editingObjects = placementTool === 'object'
    const entries = editingObjects ? (draft.data.objects ?? []) : (draft.data.entryTriggers ?? [])
    const current = editingObjects ? objectState : entryState

    const caption = (entry: (typeof entries)[number]) => {
      const label =
        ('label' in entry && typeof entry.label === 'string' ? entry.label : entry.action) ||
        entry.id

      return `${label} (${entry.x}, ${entry.y})`
    }

    const entryPicker = controls.select(
      t(editingObjects ? 'maps.objectPicker' : 'maps.triggerPicker'),
      String(current.selected),
      entries.map((entry, index) => [String(index), caption(entry)] as const),
      (value) => {
        current.selected = Number(value)
        placementDetails = true
        render()

        if (editingObjects) objectEditor?.focusSelected()
        else entryEditor?.focusSelected()
      },
      false,
    )

    const pickerControl = entryPicker.querySelector('select')!
    entryPicker.hidden = !entries.length

    const back = controls.button(t('maps.backToMap'), () => {
      placementDetails = false
      render()
      board?.focus(entries[current.selected])
    })

    const detailsButton = controls.button(t('maps.placementDetails'), () => {
      placementDetails = true
      render()

      if (editingObjects) objectEditor?.focusSelected()
      else entryEditor?.focusSelected()
    })

    back.className = detailsButton.className = 'map-compact-switch'
    const tools = document.createElement('div')
    tools.className = 'map-placement-header'
    tools.append(placement.element, entryPicker, placementDetails ? back : detailsButton)
    placementWorkspace.append(tools)

    if (activeTab === 'objects') placementCanvas.append(board.element)
    const properties = document.createElement('div')
    properties.className = 'map-placement-properties'
    entryEditor.element.hidden = placementTool !== 'trigger'
    objectEditor.element.hidden = placementTool !== 'object'
    properties.append(objectEditor.element, entryEditor.element)

    const updateCaption = () => {
      const entry = entries[current.selected]
      const option = pickerControl.options?.[current.selected]

      if (entry && option) option.textContent = caption(entry)
    }

    properties.addEventListener('input', updateCaption)
    properties.addEventListener('change', updateCaption)
    placementWorkspace.append(placementCanvas, properties)
    pages.objects.append(placementWorkspace)
    pages.settings.append(name, dimensions, help)

    if (deleteMap) pages.settings.append(deleteMap)
    form.append(actions, picker, ...mapEditorTabIds.map((tab) => pages[tab]))
    form.addEventListener('submit', async (event) => {
      event.preventDefault()

      if (busy || confirming) return

      try {
        if (!(await resize())) return

        if (creating && savedIds.some((mapId) => mapId.toLowerCase() === id.toLowerCase())) {
          error.textContent = t('maps.mapExists')

          return
        }

        submit({ type: 'game.upsertMap', mapId: id, map: draft.data, createOnly: creating })
      } catch (cause) {
        report(cause)
      }
    })
    fields.append(form)

    for (const input of fields.querySelectorAll('input'))
      input.addEventListener('blur', () => history.breakGroup())
    fields.disabled = busy || confirming || Boolean(view.diagnostics.length)
  }

  registerEditorDraft(
    root,
    'map',
    z.object({
      selected: z.string(),
      creating: z.boolean(),
      id: z.string(),
      map: mapDraftSchema,
      brush: z.string(),
      width: z.string(),
      height: z.string(),
      terrainState: z.object({ selected: z.string(), newId: z.string() }),
      activeTab: z.enum(mapEditorTabIds),
      placementTool: z.enum(['object', 'trigger']),
      placementDetails: z.boolean().optional(),
      overrides: z.record(z.string(), z.number()).optional(),
      entrySelection: z.number().int().min(-1).optional(),
      objectSelection: z.number().int().min(-1).optional(),
      mapTool: z.enum(['paint', 'select', 'paste']).optional(),
      layerState: z.object({ selected: z.string(), newId: z.string(), erasing: z.boolean() }),
      tilesetState: z.object({
        selected: z.string(),
        newId: z.string(),
        column: z.number(),
        row: z.number(),
      }),
    }),
    () =>
      dirty || strokeChanged
        ? {
            selected,
            creating,
            id,
            map: draft.data,
            brush,
            width,
            height,
            terrainState,
            activeTab,
            placementTool,
            placementDetails,
            overrides: objectState.overrides,
            entrySelection: entryState.selected,
            objectSelection: objectState.selected,
            mapTool: selection.tool,
            layerState,
            tilesetState,
          }
        : undefined,
    (saved) => {
      selected = saved.selected
      creating = saved.creating
      id = saved.id
      draft = new MapDraft(saved.map)
      brush = saved.brush
      width = saved.width
      height = saved.height
      terrainState = saved.terrainState
      activeTab = saved.activeTab
      placementTool = saved.placementTool
      placementDetails = saved.placementDetails ?? false
      objectState.overrides = saved.overrides ?? {}
      entryState.selected = saved.entrySelection ?? -1

      objectState.selected = saved.objectSelection ?? -1

      if (saved.mapTool) selection.setTool(saved.mapTool === 'paste' ? 'select' : saved.mapTool)
      layerState = saved.layerState
      tilesetState = saved.tilesetState
      history.reset({ map: view?.maps?.[selected] ?? new MapDraft().data, id: selected })
      history.record(capture(), layerState.selected)
      dirty = true
      render()
      notifyHistory()
    },
    'map-placement-v2',
  )

  return {
    canNavigate: (mapId?: string, newMap = false) => {
      const next = newMap
        ? ''
        : (mapId ?? (view?.maps?.[selected] ? selected : (view?.game?.maps?.[0] ?? '')))

      return (next === selected && (newMap || !next) === creating) || !dirty
    },
    navigate,
    draftHistory,
    restoreDraft,
    currentMap: () => (creating ? undefined : selected),
    hasDrafts: () => dirty,
    dispose: () => {
      board?.dispose()
      images?.dispose()
      graphics?.dispose()
    },
    render(state: ProjectEditorState, replaceFields: boolean) {
      const projectChanged = path !== state.path
      const changed = view !== state.view
      const busyChanged = busy !== state.busy
      path = state.path
      view = state.view
      busy = state.busy

      if (
        changed &&
        !projectChanged &&
        !creating &&
        (dirty || history.active) &&
        view?.maps?.[selected]
      ) {
        history.setBaseline({ map: view.maps[selected]!, id: selected })
        syncDirty()
      }

      const revision = `${path}:${view?.revision}`

      if (revision !== graphicsRevision) {
        images?.dispose()
        graphics?.dispose()
        graphics = view && options.createGraphics?.(path ?? '')
        graphicsRevision = revision
      }

      if (submitted && !busy && state.error) submitted = undefined

      const saved =
        submitted && replaceFields && state.lastCommand === submitted.type && !state.error

      if (saved && submitted) {
        if (submitted.type === 'game.removeMap') selection = new MapTileSelection()
        selected =
          submitted.type === 'game.upsertMap' ? submitted.mapId : (view?.game?.maps?.[0] ?? '')
        creating = !selected
        submitted = undefined
        reset()
        options.onSaved?.(selected || undefined)
      } else if (projectChanged || (replaceFields && !state.preserveDrafts)) {
        if (projectChanged) {
          layerState = { selected: '', newId: '', erasing: false }
          brush = ''
          terrainState = { selected: '', newId: '' }
          activeTab = 'paint'
          placementTool = 'object'
          placementDetails = false
          entryState.selected = objectState.selected = -1
          objectState.overrides = {}
          gridViewport = mapGridViewport()
          selection = new MapTileSelection()
        }

        selected = projectChanged ? (view?.game?.maps?.[0] ?? '') : selected
        creating = !selected
        reset()
      } else if (changed && !dirty && !history.active) reset()
      else if (changed || !busyChanged) render()
      fields.disabled = busy || confirming || !view?.game || Boolean(view.diagnostics.length)
      notifyHistory()
    },
  }
}
