import { linkedTranslationFields } from './inspectorTranslations.js'
import {
  entryEditor,
  fieldPath,
  focusIssue,
  rememberEntryFocus,
  type EntrySelections,
} from './specialistEntries.js'
import { saveStatus } from './formSaveStatus.js'
import { combatPassivesForm } from './combatPassiveForms.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import {
  combatLibrarySchema,
  combatLibraryFile,
  resolveCombatSource,
  type CombatLibrary,
} from '@ancadeba/schemas'
import type { ProjectEditorState } from './projectController.js'
import {
  ruleFormControls,
  saveBar,
  displayLabel,
  languageWatcher,
  scopedFolds,
} from './ruleFormControls.js'
import { combatMovesForm } from './combatMovesForm.js'
import { combatStatusesForm } from './combatAbilitiesForm.js'
import { combatRulesetsForm } from './combatRulesetsForm.js'
import { combatAIProfilesForm } from './combatAIProfilesForm.js'

export function bindCombatLibraryEditor(
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
  let libraryId = ''
  let draft: CombatLibrary | undefined
  let dirty = false
  let busy = false
  let submittedId: string | undefined
  let creating = false

  const categories = ['moves', 'statuses', 'rulesets', 'aiProfiles', 'passives'] as const

  type Category = (typeof categories)[number]

  let category: Category = 'moves'
  let selected: EntrySelections = {}

  function reveal(path: readonly PropertyKey[]) {
    const next = categories.find((id) => id === path[0])

    if (next && next !== category) {
      category = next
      render()
    }

    focusIssue(fields, path)
  }

  const languageChanged = languageWatcher(t)

  const controls = linkedTranslationFields(
    ruleFormControls(
      document,
      () => {
        dirty = true
      },
      t,
    ),
    openKey,
  )

  const reset = () => {
    draft = view?.combatLibraries?.[libraryId]
      ? structuredClone(view.combatLibraries[libraryId])
      : undefined
    dirty = false
    creating = false
    error.textContent = ''
    render()
  }

  const navigate = (id: string) => {
    if (id === libraryId) {
      root.scrollIntoView?.({ block: 'start' })

      return true
    }

    if (dirty && id !== libraryId) {
      error.textContent = t('combat.librarySaveFirstSwitch')

      return false
    }

    libraryId = id
    selected = {}
    category = 'moves'
    reset()
    root.scrollIntoView?.({ block: 'start' })

    return true
  }

  const submit = (command: EditorCommand) => {
    if (busy) return

    if (
      command.type === 'game.upsertCombatLibrary' &&
      creating &&
      (view?.game?.combatLibraries ?? []).some(
        (id) => id.toLowerCase() === command.library.id.toLowerCase(),
      )
    ) {
      error.textContent = t('combat.libraryExists')

      return
    }

    const parsed = commandSchema.safeParse(command)
    error.textContent = parsed.success
      ? ''
      : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')

    if (!parsed.success && command.type === 'game.upsertCombatLibrary')
      reveal(parsed.error.issues[0]!.path.slice(1))

    if (parsed.success) {
      submittedId =
        parsed.data.type === 'game.upsertCombatLibrary' ? parsed.data.library.id : undefined
      save(parsed.data)
    }
  }

  function render() {
    const restore = rememberEntryFocus(fields)
    fields.replaceChildren()

    if (!view?.game) return

    const picker = controls.select(
      t('combat.library'),
      libraryId,
      ['', ...Object.keys(view.combatLibraries ?? {})],
      (value) => {
        if (!navigate(value)) picker.querySelector('select')!.value = libraryId
      },
      false,
    )

    const fileNavigation = controls.group(
      t('tree.files.combatLibraries'),
      picker,
      controls.button(t('combat.addLibrary'), () => {
        if (dirty) {
          error.textContent = t('combat.librarySaveFirst')

          return
        }

        let id = 'common'
        let number = 1

        while (
          view?.game?.combatLibraries?.some((entry) => entry.toLowerCase() === id.toLowerCase())
        )
          id = `common-${number++}`
        libraryId = id
        category = 'moves'
        selected = {}
        draft = combatLibrarySchema.parse({ 'schema-version': '1.0.0', id })
        creating = true
        dirty = true
        render()
      }),
    )

    fileNavigation.setAttribute('data-file-navigation', '')

    if (!draft) {
      fields.append(fileNavigation)

      return
    }

    const current = draft
    const usage = document.createElement('p')

    const encounters = Object.values(view.combatSources ?? {}).filter(
      (source) =>
        Object.hasOwn(view?.combat?.[source.id]?.passiveDefinitions ?? {}, libraryId) ||
        source.rulesets?.some((reference) => reference.library === libraryId) ||
        source.enemies.some((enemy) => enemy.aiProfile?.library === libraryId) ||
        [...(source.sharedMoves ?? []), ...(source.sharedStatuses ?? [])].some(
          (ref) => ref.library === libraryId,
        ) ||
        source.itemUse?.itemTypes.some(
          (id) => view?.inventory?.itemTypes[id]?.use?.ability.library === libraryId,
        ),
    )

    const items = Object.entries(view.inventory?.itemTypes ?? {}).filter(
      ([, item]) =>
        item.combatEffects?.passives?.some((reference) => reference.library === libraryId) ||
        item.use?.ability.library === libraryId ||
        item.combatEffects?.grantedMoves?.some((reference) => reference.library === libraryId),
    )

    usage.textContent = t('combat.libraryUsage', {
      encounters: encounters.map((source) => source.id).join(', ') || t('combat.none'),
      items: items.map(([id]) => id).join(', ') || t('combat.none'),
    })
    const entryUsage = document.createElement('ul')

    const resolved = Object.values(view.combatSources ?? {}).map((source) => ({
      id: source.id,
      origins: resolveCombatSource(
        source,
        new Map(Object.entries(view?.combatLibraries ?? {})),
        undefined,
        view?.inventory,
      ).origins,
    }))

    const project = view

    const usageOf = (kind: Category, id: string) => {
      const matches = (ref: { library: string; id: string } | null | undefined) =>
        ref?.library === libraryId && ref.id === id

      switch (kind) {
        case 'aiProfiles':
          return encounters
            .filter((source) => source.enemies.some((enemy) => matches(enemy.aiProfile)))
            .map((source) => source.id)
        case 'rulesets':
          return encounters
            .filter((source) => source.rulesets?.some(matches))
            .map((source) => source.id)
        case 'passives':
          return [
            ...Object.values(project.combat ?? {})
              .filter((def) => Object.hasOwn(def.passiveDefinitions?.[libraryId] ?? {}, id))
              .map((def) => def.id),
            ...items
              .filter(([, item]) => item.combatEffects?.passives?.some(matches))
              .map(([item]) => item),
          ]
        default:
          return [
            ...resolved
              .filter((entry) => entry.origins[kind][id]?.library === libraryId)
              .map((entry) => entry.id),
            ...(kind === 'moves'
              ? items
                  .filter(
                    ([, item]) =>
                      matches(item.use?.ability) || item.combatEffects?.grantedMoves?.some(matches),
                  )
                  .map(([item]) => item)
              : []),
          ]
      }
    }

    for (const kind of categories)
      for (const id of Object.keys(current[kind] ?? {})) {
        const row = document.createElement('li')
        row.textContent = `${t(`combat.category.${kind}`)} · ${id}: ${usageOf(kind, id).join(', ') || t('combat.unused')}`
        entryUsage.append(row)
      }

    const form = document.createElement('form')
    const saveButton = document.createElement('button')
    saveButton.type = 'submit'
    saveButton.textContent = t('combat.saveLibrary')

    const identity = controls.input(t('combat.libraryId'), current.id, (value) => {
      if (creating) current.id = value.trim()
    })

    identity.querySelector('input')!.readOnly = !creating
    const entries = scopedFolds(controls, `library:${current.id}`)
    const ids = Object.keys(current[category] ?? {})

    const edited = () => {
      const updated = Object.keys(current[category] ?? {})
      const added = updated.find((id) => !ids.includes(id))

      if (added) selected[category] = updated.indexOf(added)
      render()
    }

    const details = (id: string) => {
      const body = controls.create('div')

      if (id && (category === 'moves' || category === 'statuses' || category === 'passives')) {
        const note = document.createElement('p')
        note.textContent = t('combat.entryUses', {
          names: usageOf(category, id).join(', ') || t('combat.unused'),
        })
        body.append(note)
      }

      switch (category) {
        case 'moves':
          body.append(...combatMovesForm(entries, project, current, edited, { selectedId: id }))
          break
        case 'statuses':
          body.append(combatStatusesForm(entries, project, current, edited, id))
          break
        case 'rulesets':
          body.append(combatRulesetsForm(entries, project, current, edited, id))
          break
        case 'aiProfiles':
          body.append(combatAIProfilesForm(entries, project, current, edited, id))
          break
        case 'passives':
          body.append(combatPassivesForm(entries, project, current, edited, id))
          break
      }

      return fieldPath(body, category, id)
    }

    const choose = controls.select(
      t('combat.entryCategory'),
      category,
      categories.map((id) => [id, t(`combat.category.${id}`)] as const),
      (value) => {
        category = value
        render()
        fields.querySelector<HTMLSelectElement>('[data-library-category] select')?.focus()
      },
      false,
    )

    choose.setAttribute('data-library-category', '')
    form.append(
      saveBar(
        document,
        saveButton,
        saveStatus(document, t, () => dirty),
        controls.button(t('combat.discardLibrary'), reset),
      ),
      fileNavigation,
      ...(creating ? [fieldPath(identity, 'id')] : []),
      choose,
      ids.length
        ? entryEditor(
            entries,
            selected,
            category,
            t(`combat.category.${category}`),
            ids,
            (id) => displayLabel(project, id, current[category]![id]!),
            details,
            { ids, values: ids, path: [category] },
          )
        : details(''),
      controls.fold(
        'library-usage',
        t('combat.usageReport'),
        false,
        ...(!creating ? [identity] : []),
        usage,
        entryUsage,
      ),
    )
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      submit({ type: 'game.upsertCombatLibrary', library: current, createOnly: creating })
    })
    fields.append(
      form,
      controls.button(
        t('combat.deleteLibrary'),
        () => submit({ type: 'game.removeCombatLibrary', libraryId }),
        creating,
      ),
    )
    restore?.()
  }

  registerEditorDraft(
    root,
    'combat-library',
    z.object({
      libraryId: z.string(),
      draft: combatLibrarySchema.optional(),
      creating: z.boolean(),
      category: z.enum(categories),
      selected: z.record(z.string(), z.number()),
    }),
    () => (dirty ? { libraryId, draft, creating, category, selected } : undefined),
    (saved) => {
      libraryId = saved.libraryId
      draft = saved.draft
      category = saved.category
      selected = saved.selected
      creating = saved.creating
      dirty = true
      render()
    },
    'library-entries-v1',
  )

  return {
    navigate,
    hasDrafts: () => dirty,
    render(state: ProjectEditorState, replaceFields: boolean) {
      const translated = languageChanged()
      const projectChanged = path !== state.path
      const changed = view !== state.view
      path = state.path
      view = state.view
      busy = state.busy

      const saved =
        replaceFields &&
        ['game.upsertCombatLibrary', 'game.removeCombatLibrary'].includes(state.lastCommand ?? '')

      if (saved && submittedId) {
        libraryId = submittedId
        submittedId = undefined
      }

      if (projectChanged || (replaceFields && !state.preserveDrafts)) libraryId = ''

      if (
        projectChanged ||
        saved ||
        (replaceFields && !state.preserveDrafts) ||
        (changed && !dirty)
      )
        reset()
      else if (changed || translated) render()
      fields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)

      if (!busy && submittedId && state.error) {
        const file = combatLibraryFile(submittedId)
        const issue = state.validationIssues?.find((issue) => issue.file === file)
        submittedId = undefined

        if (issue) {
          error.textContent = issue.message
          reveal(issue.path)
        }
      }
    },
  }
}
