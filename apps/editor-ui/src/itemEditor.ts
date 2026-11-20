import { recoveredComponent } from './recoveredSceneComponents.js'
import { componentShortcuts, type OpenSceneComponent } from './componentShortcuts.js'
import { itemViewFields } from './itemViewFields.js'
import { saveStatus } from './formSaveStatus.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import { inventorySchema } from '@ancadeba/schemas'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import {
  combatStatsProfileSchema,
  type CombatStatsProfile,
  equipmentComponentSchema,
  inventoryComponentSchema,
  itemDetailsComponentSchema,
  type InventoryDefinition,
  type ItemDetailsComponentDefinition,
  type EquipmentComponentDefinition,
  type InventoryComponentDefinition,
} from '@ancadeba/schemas'
import type { ProjectEditorState } from './projectController.js'
import {
  onOffChoices,
  placementFields,
  ruleFormControls,
  saveBar,
  languageWatcher,
} from './ruleFormControls.js'
import { itemUseForm } from './itemUseForm.js'
import { itemPresentationForm } from './itemPresentationForm.js'
import { combatStatsForm } from './combatStatsForm.js'
import { bindInventoryEditor } from './inventoryEditor.js'
import { sceneChoices } from './choiceLabels.js'

/** Revision conflicts preserve this independent draft, including edits to ordered properties. */
export function bindItemEditor(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate = editorLocalization().t,
  openComponent?: OpenSceneComponent,
  openKey?: (key: string) => void,
) {
  const document = root.ownerDocument
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  const fields = document.createElement('fieldset')
  const inventoryRoot = document.createElement('section')
  const navigation = document.createElement('div')
  navigation.className = 'editor-mode-controls'
  root.replaceChildren(navigation, error, inventoryRoot, fields)
  const inventoryEditor = bindInventoryEditor(inventoryRoot, save, t, openKey)
  let definitions = true
  let view: ProjectView | undefined
  let path: string | undefined
  let sceneId = ''
  let target = ''
  let item: InventoryDefinition['itemTypes'][string] | undefined

  let component:
    | ItemDetailsComponentDefinition
    | EquipmentComponentDefinition
    | InventoryComponentDefinition
    | undefined

  let slots: [string, string][] | undefined
  let combatStats: CombatStatsProfile | undefined
  let dirty = false
  let busy = false
  let creating = false
  let submitted: EditorCommand | undefined
  let hiddenPreviews: InventoryComponentDefinition['previews'] = {}

  const languageChanged = languageWatcher(t)

  const controls = ruleFormControls(
    document,
    () => {
      dirty = true
    },
    t,
  )

  const showDefinitions = (value: boolean) => {
    if (value !== definitions && (dirty || inventoryEditor.hasDrafts())) {
      error.textContent = t('items.saveBeforeEditors')

      return false
    }

    definitions = value
    error.textContent = ''
    fields.hidden = value
    inventoryRoot.hidden = !value
    definitionButton.setAttribute('aria-pressed', String(value))
    viewButton.setAttribute('aria-pressed', String(!value))

    return true
  }

  const definitionButton = controls.button(t('items.definitions'), () => showDefinitions(true))

  const viewButton = controls.button(t('items.views'), () => showDefinitions(false))

  navigation.setAttribute('data-file-navigation', '')
  navigation.append(definitionButton, viewButton)
  showDefinitions(true)

  const submit = (command: EditorCommand) => {
    if (busy) return
    const parsed = commandSchema.safeParse(command)
    error.textContent = parsed.success
      ? ''
      : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')

    if (parsed.success) {
      submitted = parsed.data
      save(parsed.data)
    }
  }

  const reset = () => {
    creating = false
    hiddenPreviews = {}
    item = target.startsWith('item:')
      ? structuredClone(view?.inventory?.itemTypes[target.slice(5)])
      : undefined
    slots = target.startsWith('owner:')
      ? Object.entries(view?.inventory?.owners[target.slice(6)]?.equipmentSlots ?? {})
      : undefined
    combatStats = target.startsWith('owner:')
      ? structuredClone(view?.inventory?.owners[target.slice(6)]?.combatStats)
      : undefined

    const source =
      target.startsWith('view:') &&
      view?.scenes
        .find((scene) => scene.id === sceneId)
        ?.components.find((entry) => entry.id === target.slice(5))

    component =
      source &&
      (source.type === 'item-details' ||
        source?.type === 'equipment' ||
        source?.type === 'inventory')
        ? structuredClone(source)
        : undefined
    dirty = false
    error.textContent = ''
    render()
  }

  const navigate = (nextScene?: string, nextComponent?: string) => {
    const nextTarget = nextComponent ? `view:${nextComponent}` : target

    if (nextComponent && !showDefinitions(false)) return false

    if ((!nextScene || nextScene === sceneId) && nextTarget === target) return true

    if (dirty) {
      error.textContent = t('items.saveFirstTargets')

      return false
    }

    sceneId = nextScene ?? sceneId
    target = nextTarget
    reset()

    return true
  }

  function render() {
    fields.replaceChildren()

    if (!view?.game) return
    const scene = view.scenes.find((scene) => scene.id === sceneId)

    const scenePicker = controls.select(
      t('items.gameScene'),
      sceneId,
      sceneChoices(view, 'game'),
      (value) => {
        if (!navigate(value)) scenePicker.querySelector('select')!.value = sceneId
      },
      false,
    )

    scenePicker.className = 'context-picker'

    const targets = [
      ...Object.keys(view.inventory?.itemTypes ?? {}).map(
        (id) => [`item:${id}`, t('items.itemTitle', { id })] as const,
      ),
      ...Object.keys(view.inventory?.owners ?? {}).map(
        (id) => [`owner:${id}`, t('items.ownerSlots', { id })] as const,
      ),
      ...(openComponent && (!component || !dirty) ? [] : (scene?.components ?? []))
        .filter((component) => ['inventory', 'item-details', 'equipment'].includes(component.type))
        .map(
          (component) => [`view:${component.id}`, `${component.type}: ${component.id}`] as const,
        ),
    ]

    const picker = controls.select(
      t('items.editingTarget'),
      target,
      [['', t('form.choose')], ...targets],
      (value) => {
        if (dirty) {
          error.textContent = t('items.saveFirstTargets')
          picker.querySelector('select')!.value = target

          return
        }

        target = value
        reset()
      },
      false,
    )

    picker.className = 'context-picker'

    fields.append(scenePicker, picker)

    if (scene && openComponent) {
      const links = componentShortcuts(
        controls,
        view,
        scene,
        ['inventory', 'item-details', 'equipment'],
        openComponent,
      )

      fields.append(controls.fold('item-scene-views', t('items.views'), !item && !slots, links))
    } else if (scene)
      for (const type of ['inventory', 'item-details', 'equipment'] as const)
        fields.append(
          controls.button(t('items.addView', { type }), () => {
            if (dirty) {
              error.textContent = t('items.saveFirst')

              return
            }

            let id: string = type
            let number = 1

            while (scene.components.some((component) => component.id === id))
              id = `${type}-${number++}`
            const inventory = scene.components.find((component) => component.type === 'inventory')
            const owner = Object.keys(view?.inventory?.owners ?? {})[0]

            if ((type === 'inventory' && !owner) || (type !== 'inventory' && !inventory)) {
              error.textContent =
                type === 'inventory' ? t('items.ownerFirst') : t('items.panelFirst')

              return
            }

            const data = {
              id,
              type,
              inventory: inventory?.id ?? '',
              owner: inventory?.owners[0] ?? '',
              placement: { row: 1, column: 1 },
            }

            component =
              type === 'inventory'
                ? inventoryComponentSchema.parse({
                    id,
                    type,
                    owners: [owner],
                    placement: { row: 1, column: 1 },
                  })
                : type === 'equipment'
                  ? equipmentComponentSchema.parse(data)
                  : itemDetailsComponentSchema.parse(data)
            item = undefined
            slots = undefined
            target = `view:${id}`
            creating = true
            hiddenPreviews = {}
            dirty = true
            render()
          }),
        )
    const form = document.createElement('form')
    const button = document.createElement('button')
    button.type = 'submit'
    button.textContent = t(
      item ? 'items.saveItemSettings' : slots ? 'items.saveOwnerSettings' : 'items.save',
    )
    form.append(
      saveBar(
        document,
        button,
        saveStatus(document, t, () => dirty),
        controls.button(t('items.discard'), reset),
      ),
    )

    if (item)
      form.append(
        ...itemPresentationForm(controls, view, item, render),
        itemUseForm(controls, view, item, render),
      )

    if (slots) {
      form.append(
        controls.select(
          t('items.statProfile'),
          combatStats ? 'enabled' : 'disabled',
          onOffChoices(t),
          (value) => {
            const fields =
              view?.rules?.state.filter((field) => typeof field.value === 'number') ?? []

            combatStats =
              value === 'enabled'
                ? combatStatsProfileSchema.parse({
                    health: { source: 'game.state', path: fields[0]?.path ?? ['health'] },
                    maximumHealth: 40,
                  })
                : undefined
            render()
          },
        ),
      )

      if (combatStats) form.append(...combatStatsForm(controls, view, combatStats, render))
      slots.forEach((slot, index) =>
        form.append(
          controls.group(
            t('form.slot', { id: index + 1 }),
            controls.input(t('items.slotId'), slot[0], (value) => {
              slot[0] = value.trim()
            }),
            controls.input(t('items.slotName'), slot[1], (value) => {
              slot[1] = value
            }),
            controls.button(t('items.removeSlot'), () => {
              slots!.splice(index, 1)
              controls.markEdited()
              render()
            }),
          ),
        ),
      )
      form.append(
        controls.button(t('items.addSlot'), () => {
          slots!.push(['', ''])
          controls.markEdited()
          render()
        }),
      )
    }

    const source = scene?.components.find((entry) => entry.id === target.slice(5))

    if (component && scene) {
      const fields = itemViewFields(
        controls,
        view,
        scene,
        component,
        creating,
        render,
        hiddenPreviews,
      )

      form.append(
        ...fields.main,
        ...fields.behavior,
        ...placementFields(t).map(([key, label]) =>
          controls.input(
            label,
            String(component!.placement[key]),
            (value) => {
              component!.placement[key] = Number(value)
            },
            'number',
          ),
        ),
        ...fields.layout,
      )
    }

    if (!item && !slots && !component) return
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (item)
        submit({
          type: 'inventory.setItemPresentation',
          itemType: target.slice(5),
          presentation: item,
          combatBonuses: item.combatBonuses ?? null,
          combatEffects: item.combatEffects ?? null,
          use: item.use ?? null,
        })
      else if (slots) {
        if (new Set(slots.map((slot) => slot[0])).size !== slots.length) {
          error.textContent = t('items.uniqueSlotIds')

          return
        }

        submit({
          type: 'inventory.setEquipmentSlots',
          owner: target.slice(6),
          slots: Object.fromEntries(slots),
          combatStats: combatStats ?? null,
        })
      } else if (component) {
        const id = component.id

        if (creating && scene?.components.some((entry) => entry.id === id)) {
          error.textContent = t('form.componentExists')

          return
        }

        submit({ type: 'scene.upsertItemView', sceneId, component, createOnly: creating })
      }
    })
    fields.append(form)

    if (component && source && !creating)
      fields.append(
        controls.button(t('items.removeView'), () =>
          submit({ type: 'scene.removeItemView', sceneId, componentId: source.id }),
        ),
      )
  }

  registerEditorDraft(
    root,
    'item',
    z.object({
      definitions: z.boolean(),
      sceneId: z.string(),
      target: z.string(),
      item: inventorySchema.shape.itemTypes.valueType.optional(),
      component: z
        .union([itemDetailsComponentSchema, equipmentComponentSchema, inventoryComponentSchema])
        .optional(),
      slots: z.array(z.tuple([z.string(), z.string()])).optional(),
      combatStats: combatStatsProfileSchema.optional(),
      creating: z.boolean(),
      hiddenPreviews: inventoryComponentSchema.shape.previews,
    }),
    () =>
      dirty || inventoryEditor.hasDrafts()
        ? {
            definitions,
            sceneId,
            target,
            item,
            component,
            slots,
            combatStats,
            creating,
            hiddenPreviews,
          }
        : undefined,
    (saved) => {
      definitions = saved.definitions
      sceneId = saved.sceneId
      target = saved.target
      item = saved.item
      component = saved.component
      slots = saved.slots
      combatStats = saved.combatStats
      creating = saved.creating
      hiddenPreviews = saved.hiddenPreviews
      fields.hidden = definitions
      inventoryRoot.hidden = !definitions
      dirty = !definitions
      render()
    },
    'item-editor-v3',
  )

  return {
    takeRecoveredComponents() {
      if (!dirty || !component || !target.startsWith('view:')) return []
      const entry = { ...recoveredComponent(view, sceneId, component), hiddenPreviews }

      if (creating) delete entry.existingId
      target = ''
      reset()

      return [entry]
    },
    canNavigate: (nextScene?: string, nextComponent?: string) =>
      !(nextComponent && definitions && (dirty || inventoryEditor.hasDrafts())) &&
      (((!nextScene || nextScene === sceneId) &&
        (!nextComponent || `view:${nextComponent}` === target)) ||
        !dirty),
    navigate,
    canNavigateInventory: (id: string) =>
      (!dirty || definitions) && inventoryEditor.canNavigate(id),
    navigateInventory(id: string) {
      if (!showDefinitions(true)) return false

      return inventoryEditor.navigate(id)
    },
    hasDrafts: () => dirty || inventoryEditor.hasDrafts(),
    render(state: ProjectEditorState, replaceFields: boolean) {
      const translated = languageChanged()
      inventoryEditor.render(state, replaceFields)
      const changed = view !== state.view
      const projectChanged = path !== state.path
      path = state.path
      view = state.view
      busy = state.busy

      const saved =
        submitted && !busy && !state.error && replaceFields && state.lastCommand === submitted.type

      if (saved && submitted?.type === 'scene.upsertItemView')
        target = `view:${submitted.component.id}`

      if (!busy) submitted = undefined

      const resetFields = projectChanged || (replaceFields && !state.preserveDrafts)

      if (resetFields) {
        sceneId = view?.scenes.find((scene) => scene.type === 'game')?.id ?? ''
        target = ''
      }

      if (translated) {
        definitionButton.textContent = t('items.definitions')
        viewButton.textContent = t('items.views')
      }

      if (resetFields || saved || (changed && !dirty)) reset()
      else if (changed || translated) render()
      fields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)
    },
  }
}
