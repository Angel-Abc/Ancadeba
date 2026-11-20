import type { RecoveredComponent } from './recoveredSceneComponents.js'
import { z } from 'zod'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import {
  sceneComponentSchema,
  inventoryComponentSchema,
  resolveMapView,
  assertGraphicReference,
  type SceneComponentDefinition,
  type InventoryComponentDefinition,
} from '@ancadeba/schemas'
import type { RenderedGraphic } from '@ancadeba/ui-components'
import type { Translate } from '@ancadeba/utilities'
import { registerEditorDraft } from './editorDraftState.js'
import { editorLocalization } from './localization.js'
import { saveStatus } from './formSaveStatus.js'
import { placementFields, ruleFormControls, saveBar, scopedFolds } from './ruleFormControls.js'
import type { ProjectEditorState } from './projectController.js'
import {
  componentGroups,
  componentSaveCommand,
  componentUnavailable,
  inspectorTypes,
  newInspectorComponent,
  shopCreationPanels,
  type ComponentType,
} from './componentRegistry.js'
import {
  inspectorFields,
  inspectorSelectionSchema,
  type OpenSpecialist,
} from './inspectorFields.js'
import { inspectorTranslations } from './inspectorTranslations.js'
import type { SceneGraphicPreviewFactory } from './sceneGraphicEditor.js'

export function bindComponentEditor(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  {
    t = editorLocalization().t,
    onCreated,
    onCancel,
    onOpen,
    createPreview,
  }: {
    t?: Translate
    onCreated?: (sceneId: string, componentId: string) => void
    onCancel?: (sceneId: string) => void
    onOpen?: OpenSpecialist
    createPreview?: SceneGraphicPreviewFactory
  } = {},
) {
  const document = root.ownerDocument
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  const fields = document.createElement('fieldset')
  fields.className = 'scene-inspector'
  root.replaceChildren(error, fields)
  let view: ProjectView | undefined
  let path: string | undefined

  let sceneId = '',
    componentId = ''

  let preset: string | undefined
  let newType: ComponentType = 'text'

  let creating = false,
    dirty = false,
    busy = false

  let draft: SceneComponentDefinition | undefined
  let panels: InventoryComponentDefinition[] = []
  let selection = inspectorSelectionSchema.parse({})
  let hiddenPreviews: InventoryComponentDefinition['previews'] = {}
  let preview: RenderedGraphic | undefined
  const bindingPending = { alias: '', value: '' }
  let submitted: { type: EditorCommand['type']; id: string } | undefined
  let language = t('component.add')

  let discard: HTMLButtonElement | undefined

  const base = ruleFormControls(
    document,
    () => {
      dirty = true

      if (discard) discard.hidden = false
    },
    t,
  )

  const scene = () => view?.scenes.find((entry) => entry.id === sceneId)

  const replacePreview = (next: RenderedGraphic | undefined) => {
    preview?.dispose()
    preview = next
  }

  const open: OpenSpecialist = (kind, id) => {
    if (dirty || creating) {
      error.textContent = t('inspector.saveFirst')

      return
    }

    onOpen?.(kind, id)
  }

  function reset(resetSelection = false) {
    const current = scene()
    draft =
      current && view
        ? creating
          ? newInspectorComponent(newType, current, view)
          : structuredClone(current.components.find((entry) => entry.id === componentId))
        : undefined

    if (creating && draft && preset) {
      if (draft.type === 'combat') draft.encounter = preset

      if (draft.type === 'character-progression') draft.profile = preset

      if (draft.type === 'button') draft.action = { type: 'request-action', action: preset }
    }

    panels =
      creating && draft?.type === 'shop' && current && view ? shopCreationPanels(current, view) : []

    if (resetSelection) selection = inspectorSelectionSchema.parse({})

    if (draft?.type === 'nearby' && !Object.hasOwn(draft.entries, selection.selected))
      selection.selected = Object.keys(draft.entries)[0] ?? ''
    selection.newTarget = ''
    selection.newAction = ''
    hiddenPreviews = {}
    bindingPending.alias = ''
    bindingPending.value = ''
    error.textContent = ''
    dirty = false
    render()
  }

  function showError(message: string, form: HTMLElement, section?: string) {
    error.textContent = message

    for (const detail of form.querySelectorAll<HTMLDetailsElement>('details')) {
      if (
        detail.tagName.toLowerCase() === 'details' &&
        (!section || detail.getAttribute('data-section') === section)
      )
        detail.open = true
    }
  }

  function render() {
    replacePreview(undefined)
    fields.replaceChildren()
    const current = scene()

    if (!view || !current) return
    const model = draft
    const form = document.createElement('form')
    form.className = 'component-form'
    const type = creating ? newType : model?.type

    const translated = inspectorTranslations(
      scopedFolds(base, [path, sceneId, componentId || 'new', type].join('/')),
      (id) => open('localization', id),
    )

    const controls = translated.controls
    const reason = creating ? componentUnavailable(newType, current, view) : undefined
    const submit = document.createElement('button')
    submit.type = 'submit'
    submit.textContent = t(creating ? 'component.create' : 'component.save')
    submit.disabled = !model || Boolean(reason)
    discard = controls.button(t('component.discard'), () => reset())
    discard.hidden = creating && !dirty
    form.append(
      saveBar(
        document,
        submit,
        saveStatus(document, t, () => dirty),
        discard,
        ...(creating
          ? [
              controls.button(t('component.cancel'), () => {
                reset(true)
                onCancel?.(sceneId)
              }),
            ]
          : []),
      ),
    )

    if (creating) {
      const picker = document.createElement('select')
      const label = document.createElement('label')
      label.append(t('component.type'), picker)

      for (const group of new Set(Object.values(componentGroups))) {
        const options = document.createElement('optgroup')
        options.label = t(`inspector.${group}`)

        for (const entry of inspectorTypes.filter((key) => componentGroups[key] === group)) {
          const option = document.createElement('option')
          option.value = entry
          const missing = componentUnavailable(entry, current, view)
          option.textContent = t(`tree.${entry}`) + (missing ? ' — ' + t(missing) : '')
          option.disabled = Boolean(missing)
          options.append(option)
        }

        picker.append(options)
      }

      picker.value = newType
      picker.addEventListener('change', () => {
        if (dirty) {
          picker.value = newType
          error.textContent = t('component.discardFirst')

          return
        }

        const selectedType = inspectorTypes.find((key) => key === picker.value)

        if (selectedType) {
          preset = undefined
          newType = selectedType
          reset(true)
        }
      })
      const identity = controls.row(label)
      form.append(identity)

      if (model)
        identity.append(
          controls.input(t('component.id'), model.id, (id) => {
            model.id = id.trim()
          }),
        )
    }

    if (reason || (model?.type === 'language-select' && !view.game?.languages)) {
      const help = document.createElement('p')
      help.className = 'help'
      help.textContent = t(reason ?? 'component.languageHelp')
      form.append(help)
    }

    if (model && !reason) {
      const sections = inspectorFields({
        controls,
        view,
        scene: current,
        draft: model,
        selection,
        creating,
        error,
        bindingPending,
        panels,
        hiddenPreviews,
        render,
        open,
        createPreview,
        replacePreview,
      })

      for (const [key, children] of [
        ['content', sections.main],
        ['behavior', sections.behavior],
        [
          'layout',
          [
            ...placementFields(t).map(([key, label]) =>
              controls.input(
                label,
                String(model.placement[key]),
                (value) => {
                  model.placement[key] = Number(value)
                },
                'number',
              ),
            ),
            ...sections.layout,
          ],
        ],
      ] as const) {
        if (!children.length) continue
        const body = controls.create('div')
        body.className = 'inspector-fields'
        body.append(...children)
        const wrapper = controls.fold(key, t(`inspector.${key}`), key === 'content', body)
        wrapper.setAttribute('data-section', key)
        translated.arrange(wrapper)
        form.append(wrapper)
      }
    }

    form.addEventListener(
      'invalid',
      (event) => {
        const target = event.target

        if (!(target instanceof HTMLElement)) return
        let ancestor = target.parentElement

        while (ancestor && ancestor !== form) {
          if (ancestor instanceof HTMLDetailsElement) ancestor.open = true
          ancestor = ancestor.parentElement
        }
      },
      true,
    )
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (!model || busy || !view || reason) return
      error.textContent = ''

      if (model.type === 'text' && bindingPending.alias) {
        showError(t('component.pendingBinding'), form, 'behavior')

        return
      }

      if (creating && current.components.some((entry) => entry.id === model.id)) {
        error.textContent = t('component.duplicateId')

        return
      }

      if (model.type === 'map-view' || model.type === 'graphic') {
        try {
          if (model.type === 'map-view')
            resolveMapView(
              new Map(Object.entries(view.maps ?? {})),
              model.map,
              model.viewport,
              model.playerSpawn,
            )
          else if (view.assets) assertGraphicReference(view.assets, model.visual, model.appearance)
        } catch (cause) {
          showError(cause instanceof Error ? cause.message : String(cause), form)

          return
        }
      }

      const parsed = commandSchema.safeParse(componentSaveCommand(sceneId, model, creating, panels))

      if (!parsed.success) {
        showError(
          parsed.error.issues.map((issue) => issue.path.join('.') + ' ' + issue.message).join('\n'),
          form,
          parsed.error.issues[0]?.path.includes('placement') ? 'layout' : undefined,
        )

        return
      }

      submitted = { type: parsed.data.type, id: model.id }
      save(parsed.data)
    })
    fields.append(form)
  }

  registerEditorDraft(
    root,
    'component',
    z.object({
      sceneId: z.string(),
      componentId: z.string(),
      draft: sceneComponentSchema.optional(),
      creating: z.boolean(),
      newType: z.enum(inspectorTypes),
      preset: z.string().optional(),
      bindingPending: z.object({ alias: z.string(), value: z.string() }),
      selection: inspectorSelectionSchema.optional(),
      panels: z.array(inventoryComponentSchema).optional(),
      hiddenPreviews: inventoryComponentSchema.shape.previews.optional(),
    }),
    () =>
      dirty
        ? {
            sceneId,
            componentId,
            draft,
            creating,
            newType,
            preset,
            bindingPending,
            selection,
            panels,
            hiddenPreviews,
          }
        : undefined,
    (saved) => {
      sceneId = saved.sceneId
      componentId = saved.componentId
      draft = saved.draft
      creating = saved.creating
      preset = saved.preset
      newType = saved.newType
      panels = saved.panels ?? []
      hiddenPreviews = saved.hiddenPreviews ?? {}
      selection = saved.selection ?? inspectorSelectionSchema.parse({})
      Object.assign(bindingPending, saved.bindingPending)
      dirty = true
      render()
    },
    'component-inspector-v3',
  )

  const same = (id?: string, component?: string, add = false) =>
    sceneId === (id ?? '') && componentId === (component ?? '') && creating === add

  return {
    hasDrafts: () => dirty,
    canNavigate: (id?: string, component?: string, add = false) =>
      same(id, component, add) || !dirty,
    resumeDraft(entry: RecoveredComponent) {
      newType = entry.component.type
      draft = structuredClone(entry.component)
      panels = structuredClone(entry.panels ?? [])
      hiddenPreviews = structuredClone(entry.hiddenPreviews ?? {})
      selection = inspectorSelectionSchema.parse({ slot: entry.slot })

      if (draft.type === 'nearby')
        Object.assign(selection, entry.nearby ?? { selected: Object.keys(draft.entries)[0] ?? '' })
      dirty = true
      render()
    },
    startCreation(type: ComponentType, reference?: string) {
      if (!creating || dirty) return
      preset = reference
      newType = type
      reset(true)
    },
    rememberEntry() {
      const entry = structuredClone(selection)

      return () => {
        selection = entry
        render()
      }
    },
    navigate(id?: string, component?: string, add = false) {
      if (same(id, component, add)) return true

      if (dirty) {
        error.textContent = t('component.discardFirst')

        return false
      }

      sceneId = id ?? ''
      componentId = component ?? ''
      preset = undefined
      creating = add
      newType = 'text'
      submitted = undefined
      reset(true)

      return true
    },
    render(state: ProjectEditorState, replace: boolean) {
      const projectChanged = path !== state.path
      const changed = view !== state.view
      const translated = language !== t('component.add')
      language = t('component.add')
      path = state.path
      view = state.view
      busy = state.busy

      const saved =
        submitted && replace && !busy && !state.error && submitted.type === state.lastCommand
          ? submitted
          : undefined

      const created = creating && saved

      if (created) {
        componentId = created.id
        creating = false
      }

      if (!busy) submitted = undefined

      if (projectChanged || saved || (replace && !state.preserveDrafts) || (changed && !dirty))
        reset(projectChanged)
      else if (translated || changed) render()

      if (state.error && dirty) showError(state.error, fields)
      fields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)

      if (created) onCreated?.(sceneId, componentId)
    },
    dispose: () => replacePreview(undefined),
  }
}
