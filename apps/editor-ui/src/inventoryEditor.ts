import {
  entryEditor,
  rememberEntryFocus,
  focusIssue,
  fieldPath,
  type EntrySelections,
} from './specialistEntries.js'
import { inspectorTranslations } from './inspectorTranslations.js'
import { scopedFolds } from './ruleFormControls.js'
import { saveStatus } from './formSaveStatus.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import {
  assetIdSchema,
  inventorySchema,
  inventoryItemTypeSchema,
  inventoryOwnerSchema,
  inventoryStartingItemSchema,
  mergeInventorySources,
  inventoryIssues,
} from '@ancadeba/schemas'
import type { ProjectEditorState } from './projectController.js'
import { displayLabel, ruleFormControls, saveBar, languageWatcher } from './ruleFormControls.js'
import {
  inventoryDefinitionForms,
  type InventoryEntrySelection,
} from './inventoryDefinitionForms.js'

/** Owns one inventory file draft, including all of its related definitions and placements. */
export function bindInventoryEditor(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate = editorLocalization().t,
  openKey?: (key: string) => void,
) {
  const document = root.ownerDocument
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  const fields = document.createElement('fieldset')
  root.replaceChildren(error, fields)
  let view: ProjectView | undefined
  let path: string | undefined
  let selectedFile = ''
  let id = 'items'

  let draft = inventorySchema.parse({
    'schema-version': '1.0.0',
    itemTypes: {},
    owners: {},
    items: {},
  })

  let selected: InventoryEntrySelection = { kind: 'itemTypes', id: '' }
  const files = new Map<string, InventoryEntrySelection>()
  let subentries: Record<string, EntrySelections> = {}
  let newId = ''
  const slot = { id: '', label: '' }
  let dirty = false
  let busy = false
  let submitted: Extract<EditorCommand, { type: 'game.upsertInventory' }> | undefined

  const languageChanged = languageWatcher(t)

  const controls = ruleFormControls(
    document,
    () => {
      dirty = true
    },
    t,
  )

  const report = (cause: unknown) => {
    error.textContent = cause instanceof Error ? cause.message : String(cause)
  }

  const context = () => {
    const sources = Object.entries(view?.inventoryFiles ?? {})
      .filter(([file]) => file !== selectedFile)
      .map(([file, inventory]) => ({ file, inventory }))

    const merged = mergeInventorySources([
      ...sources,
      { file: selectedFile || id, inventory: draft },
    ])

    return { inventory: merged.inventory ?? draft, issues: merged.issues }
  }

  const change = (operation: () => void) => {
    try {
      operation()
      dirty = true
      error.textContent = ''
      render()
    } catch (cause) {
      report(cause)
    }
  }

  const reset = () => {
    if (selectedFile && !view?.game?.inventory?.includes(selectedFile))
      selectedFile = view?.game?.inventory?.[0] ?? ''

    const source =
      view?.inventoryFiles?.[selectedFile] ??
      (view?.game?.inventory?.length === 1 && selectedFile ? view.inventory : undefined)

    draft = inventorySchema.parse(
      structuredClone(
        source ?? { 'schema-version': '1.0.0', itemTypes: {}, owners: {}, items: {} },
      ),
    )
    id = selectedFile || 'items'

    if (!selectedFile) {
      let suffix = 2

      while (view?.game?.inventory?.some((value) => value.toLowerCase() === id.toLowerCase()))
        id = `items-${suffix++}`
    }

    if (!Object.hasOwn(draft[selected.kind], selected.id)) {
      if (!Object.keys(draft[selected.kind]).length && !files.has(selectedFile))
        selected.kind =
          (['itemTypes', 'owners', 'items'] as const).find(
            (kind) => Object.keys(draft[kind]).length,
          ) ?? selected.kind
      selected.id = Object.keys(draft[selected.kind])[0] ?? ''
    }

    newId = ''
    slot.id = ''
    slot.label = ''
    dirty = false
    error.textContent = ''
    render()
  }

  const navigate = (file: string) => {
    if (file === selectedFile) return true

    if (dirty) {
      error.textContent = t('items.saveInventoryFirst')

      return false
    }

    files.set(selectedFile, { ...selected })
    selectedFile = file
    selected = files.get(file) ?? { kind: 'itemTypes', id: '' }
    reset()

    return true
  }

  const canSwitchEntry = () => {
    if (!slot.id && !slot.label) return true
    error.textContent = t('items.pendingSlotSwitch')

    return false
  }

  function render() {
    const restoreFocus = rememberEntryFocus(fields)
    fields.replaceChildren()

    if (!view?.game) return
    const current = view
    const form = document.createElement('form')
    form.className = 'inventory-editor-form'

    const picker = controls.select(
      t('items.inventoryFile'),
      selectedFile,
      [
        ['', t('items.newInventory')],
        ...(view.game.inventory ?? []).map((id) => [id, id] as const),
      ],
      (value) => {
        if (!navigate(value)) picker.querySelector('select')!.value = selectedFile
      },
      false,
    )

    picker.setAttribute('data-file-navigation', '')

    const name = controls.input(t('items.inventoryId'), id, (value) => {
      id = value.trim()
    })

    name.querySelector('input')!.readOnly = Boolean(selectedFile)
    const saveButton = document.createElement('button')
    saveButton.type = 'submit'
    saveButton.textContent = t('items.saveInventory')
    const help = document.createElement('p')
    help.className = 'help'
    help.textContent = t('items.inventoryHelp')

    const kind = controls.select(
      t('items.entryKind'),
      selected.kind,
      [
        ['itemTypes', t('items.itemTypes')],
        ['owners', t('items.owners')],
        ['items', t('items.startingItems')],
      ],
      (value) => {
        if (value === selected.kind) return

        if (!canSwitchEntry()) {
          kind.querySelector('select')!.value = selected.kind

          return
        }

        selected = { kind: value, id: Object.keys(draft[value])[0] ?? '' }
        render()
      },
      false,
    )

    const merged = context().inventory

    // Entries show their names; a starting item shows its instance ID and item type.
    const entryLabel = (entryId: string) => {
      if (selected.kind === 'items') {
        const itemType = draft.items[entryId]?.itemType ?? ''
        const type = merged.itemTypes[itemType]

        return `${entryId} · ${type ? displayLabel(current, itemType, type) : itemType}`
      }

      const definition = draft[selected.kind][entryId]

      const name =
        (definition?.labelKey && current.translations?.[definition.labelKey]) ||
        definition?.label ||
        entryId

      return name === entryId ? entryId : `${name} (${entryId})`
    }

    form.append(
      saveBar(
        document,
        saveButton,
        saveStatus(document, t, () => dirty),
        controls.button(t('items.discardInventory'), reset),
      ),
      picker,
      kind,
    )

    const adding = controls.group(
      t(`items.new.${selected.kind}`),
      fieldPath(
        controls.input(t('items.newEntryId'), newId, (value) => {
          newId = value.trim()
        }),
        'newId',
      ),
      controls.button(
        t(`items.add.${selected.kind}`),
        () =>
          change(() => {
            if (
              !assetIdSchema.safeParse(newId).success ||
              Object.keys(merged[selected.kind]).some(
                (id) => id.toLowerCase() === newId.toLowerCase(),
              )
            )
              throw new Error(t('items.invalidEntryId'))

            if (selected.kind === 'itemTypes')
              draft.itemTypes[newId] = inventoryItemTypeSchema.parse({ label: newId })
            else if (selected.kind === 'owners')
              draft.owners[newId] = inventoryOwnerSchema.parse({ label: newId })
            else {
              const itemType = Object.keys(merged.itemTypes)[0]
              const owner = Object.keys(merged.owners)[0]

              if (!itemType || !owner) throw new Error(t('items.typeAndOwnerFirst'))
              draft.items[newId] = inventoryStartingItemSchema.parse({
                itemType,
                placement: { type: 'carried', owner },
              })
            }

            selected.id = newId
            newId = ''
          }),
        selected.kind === 'items' &&
          (!Object.keys(merged.itemTypes).length || !Object.keys(merged.owners).length),
      ),
    )

    const ids = Object.keys(draft[selected.kind])

    if (ids.length) {
      const selectedIndex = Math.max(0, ids.indexOf(selected.id))

      const collection = entryEditor(
        controls,
        { entry: selectedIndex },
        'entry',
        t('items.entry'),
        ids,
        entryLabel,
        (entryId) => {
          selected.id = entryId
          const scope = JSON.stringify([selectedFile, selected.kind, entryId])
          const local = inspectorTranslations(scopedFolds(controls, scope), openKey)
          const body = controls.create('div')
          body.className = 'inventory-entry-fields'
          body.append(
            ...inventoryDefinitionForms(
              local.controls,
              { ...current, inventory: merged },
              draft,
              selected,
              slot,
              change,
              render,
              (subentries[scope] ??= {}),
              local.arrange,
            ),
          )
          local.arrange(body)

          return body
        },
        {
          values: ids,
          canSelect: canSwitchEntry,
          actions: () => {
            const actions = controls.create('div')
            actions.append(
              controls.fold('add-' + selected.kind, t(`items.add.${selected.kind}`), false, adding),
              controls.button(t(`items.remove.${selected.kind}`), () =>
                change(() => {
                  const index = ids.indexOf(selected.id)
                  delete draft[selected.kind][selected.id]
                  selected.id = ids[index + 1] ?? ids[index - 1] ?? ''
                  slot.id = ''
                  slot.label = ''
                }),
              ),
            )

            return actions
          },
        },
      )

      form.append(collection)
    } else form.append(adding)

    if (selectedFile)
      form.append(controls.fold('file', t('items.inventoryFile'), false, name, help))
    else form.append(name, help)

    const invalid = (issuePath: readonly PropertyKey[]) => {
      const [kind, id, ...path] = issuePath[0] === 'inventory' ? issuePath.slice(1) : issuePath

      if (
        (kind === 'itemTypes' || kind === 'owners' || kind === 'items') &&
        typeof id === 'string' &&
        Object.hasOwn(draft[kind], id)
      ) {
        if (selected.kind !== kind || selected.id !== id) {
          selected = { kind, id }
          render()
        }

        focusIssue(
          fields,
          path.length === 1 && path[0] === 'placement' ? ['placement', 'type'] : path,
        )
      } else if (kind === 'inventoryId') name.querySelector('input')?.focus()
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (busy) return

      if (newId || slot.id || slot.label) {
        error.textContent = t('items.pendingSave')
        focusIssue(fields, [newId ? 'newId' : slot.id ? 'newSlotId' : 'newSlotName'])

        return
      }

      const parsed = commandSchema.safeParse({
        type: 'game.upsertInventory',
        inventoryId: id,
        inventory: draft,
        createOnly: !selectedFile,
      })

      if (!parsed.success) {
        invalid(parsed.error.issues[0]!.path)
        error.textContent = parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('\n')

        return
      }

      const merged = context()
      const issues = [...merged.issues, ...inventoryIssues(merged.inventory, current.assets)]

      if (issues.length) {
        invalid((issues.find((issue) => issue.path.includes(selected.id)) ?? issues[0]!).path)
        error.textContent = issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('\n')

        return
      }

      if (parsed.data.type !== 'game.upsertInventory') return
      submitted = structuredClone(parsed.data)
      error.textContent = ''
      save(parsed.data)
    })
    fields.append(form)
    restoreFocus?.()
    fields.disabled = busy || Boolean(view.diagnostics.length)
  }

  registerEditorDraft(
    root,
    'inventory',
    z.object({
      selectedFile: z.string(),
      subentries: z.record(z.string(), z.record(z.string(), z.number())).optional(),
      id: z.string(),
      draft: inventorySchema,
      selected: z.object({ kind: z.enum(['itemTypes', 'owners', 'items']), id: z.string() }),
      newId: z.string(),
      slot: z.object({ id: z.string(), label: z.string() }),
    }),
    () => (dirty ? { selectedFile, id, draft, selected, newId, slot, subentries } : undefined),
    (saved) => {
      subentries = saved.subentries ?? {}
      selectedFile = saved.selectedFile
      id = saved.id
      draft = saved.draft
      selected = saved.selected
      newId = saved.newId
      Object.assign(slot, saved.slot)
      dirty = true
      render()
    },
    'selected-entry',
  )

  return {
    hasDrafts: () => dirty,
    canNavigate: (id: string) => id === selectedFile || !dirty,
    navigate,
    render(state: ProjectEditorState, replaceFields: boolean) {
      const translated = languageChanged()
      const projectChanged = path !== state.path
      const changed = view !== state.view
      path = state.path
      view = state.view
      busy = state.busy

      const saved =
        submitted && !busy && replaceFields && !state.error && state.lastCommand === submitted.type
          ? submitted
          : undefined

      if (!busy) submitted = undefined

      if (projectChanged) {
        files.clear()
        subentries = {}
        selectedFile = view?.game?.inventory?.[0] ?? ''
        selected = { kind: 'itemTypes', id: '' }
      }

      if (saved) selectedFile = saved.inventoryId

      if (
        projectChanged ||
        saved ||
        (replaceFields && !state.preserveDrafts) ||
        (changed && !dirty)
      )
        reset()
      else if (changed || translated) render()
      fields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)
    },
  }
}
