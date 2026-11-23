import { combatWordingForm, type WordingSelection } from './combatWordingForm.js'
import { combatFile, combatTextSchema } from '@ancadeba/schemas'
import { linkedTranslationFields } from './inspectorTranslations.js'
import { focusIssue } from './specialistEntries.js'
import { recoveredComponent } from './recoveredSceneComponents.js'
import { componentShortcuts, type OpenSceneComponent } from './componentShortcuts.js'
import { saveStatus } from './formSaveStatus.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import { combatSourceSchema } from '@ancadeba/schemas'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import { combatComponentSchema, type CombatSource } from '@ancadeba/schemas'
import { bindCombatLibraryEditor } from './combatLibraryEditor.js'
import { sharedCombatForm } from './sharedCombatForm.js'
import type { ProjectEditorState } from './projectController.js'
import {
  placementFields,
  ruleFormControls,
  saveBar,
  languageWatcher,
  scopedFolds,
} from './ruleFormControls.js'
import { combatForm } from './combatForm.js'
import { bindCombatSimulationPanel } from './combatSimulationPanel.js'
import { sceneChoices } from './choiceLabels.js'

export function bindCombatEditor(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate = editorLocalization().t,
  openComponent?: OpenSceneComponent,
  openLibrary?: (id: string) => void,
  openKey?: (key: string) => void,
  openWordingKey = openKey,
) {
  const document = root.ownerDocument
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  const fields = document.createElement('fieldset')
  const libraryRoot = document.createElement('section')
  const simulationRoot = document.createElement('fieldset')
  const navigation = document.createElement('div')
  navigation.className = 'specialist-views'
  navigation.setAttribute('role', 'group')
  const pageIds = ['encounter', 'simulation', 'libraries'] as const

  type Page = (typeof pageIds)[number]

  let page: Page = 'encounter'
  let libraryFile = false
  root.replaceChildren(error, navigation, fields, simulationRoot, libraryRoot)
  const simulation = bindCombatSimulationPanel(simulationRoot, t, (command) => submit(command))
  const libraryEditor = bindCombatLibraryEditor(libraryRoot, save, t, openKey)
  let view: ProjectView | undefined
  let path: string | undefined
  let fileKey: string | undefined
  let submitted: EditorCommand['type'] | undefined
  let sceneId = ''
  let encounterId = ''
  let draft: CombatSource | undefined
  let component: ReturnType<typeof combatComponentSchema.parse> | undefined
  let dirty = false
  let definitionOnly = Boolean(openComponent)
  let busy = false
  let creating = false
  let playerHealth = ''
  let enemyHealth = ''

  const languageChanged = languageWatcher(t)

  const selections = new Map<string, WordingSelection>()

  function wordingSelection(id: string) {
    let selection = selections.get(id)

    if (!selection) {
      selection = { code: 'interceptionPreview', query: '', open: false }
      selections.set(id, selection)
    }

    return selection
  }

  const baseControls = ruleFormControls(
    document,
    () => {
      dirty = true
      simulation.invalidateResults()
    },
    t,
  )

  const controls = linkedTranslationFields(baseControls, openKey)

  const pageLabels = {
    encounter: 'combat.encounter',
    simulation: 'specialist.simulation',
    libraries: 'specialist.libraries',
  }

  function selectPage(id: Page) {
    if (id === page) return true

    if (
      (id === 'libraries' && (dirty || simulation.hasDrafts())) ||
      (page === 'libraries' && libraryEditor.hasDrafts())
    ) {
      error.textContent = t('combat.saveFirstTargets')

      return false
    }

    page = id

    if (page === 'simulation') simulation.render(view, draft)
    error.textContent = ''
    showPage()

    return true
  }

  const pages = pageIds.map((id) => {
    const button = controls.button('', () => selectPage(id))
    navigation.append(button)

    return { id, button }
  })

  function showPage() {
    navigation.hidden = libraryFile
    navigation.setAttribute('aria-label', t('specialist.view'))
    fields.hidden = page !== 'encounter'
    simulationRoot.hidden = page !== 'simulation'
    libraryRoot.hidden = page !== 'libraries'

    for (const { id, button } of pages) {
      button.hidden = (id === 'libraries' && Boolean(fileKey)) || (id === 'simulation' && !draft)
      button.textContent = t(pageLabels[id])
      button.setAttribute('aria-pressed', String(id === page))
    }
  }

  const reset = () => {
    const scene = view?.scenes.find((scene) => scene.id === sceneId)
    const found = scene?.components.find((component) => component.type === 'combat')
    encounterId =
      encounterId ||
      (found?.type === 'combat'
        ? found.encounter
        : definitionOnly
          ? (Object.keys(view?.combatSources ?? {})[0] ?? '')
          : '')
    draft =
      encounterId && view?.combatSources?.[encounterId]
        ? structuredClone(view.combatSources[encounterId])
        : undefined
    component = draft
      ? found?.type === 'combat'
        ? structuredClone({ ...found, encounter: draft.id })
        : combatComponentSchema.parse({
            id: 'combat',
            type: 'combat',
            encounter: draft.id,
            placement: { row: 1, column: 1 },
          })
      : undefined
    dirty = false
    creating = false
    error.textContent = ''
    render()
  }

  const navigate = (id?: string, nextEncounter?: string) => {
    if (
      (id === undefined || id === sceneId) &&
      (nextEncounter === undefined || nextEncounter === encounterId)
    )
      return true

    if (dirty || simulation.hasDrafts()) {
      error.textContent = t('combat.saveFirstTargets')

      return false
    }

    sceneId = id ?? sceneId
    encounterId = nextEncounter ?? ''
    reset()

    return true
  }

  function focusEncounterIssue(path: readonly PropertyKey[]) {
    if (path[0] === 'messages' || path[0] === 'messageKeys') {
      const code = combatTextSchema.keyof().safeParse(path[1])

      if (draft && code.success) {
        Object.assign(wordingSelection(encounterId), { query: '', code: code.data, open: true })
        scopedFolds(baseControls, `encounter:${draft.id}`).unfold('texts')
        render()
      }
    }

    focusIssue(fields, path)
  }

  const submit = (command: EditorCommand) => {
    if (busy) return

    if (
      command.type === 'game.upsertCombat' &&
      creating &&
      (view?.game?.combat ?? []).some(
        (id) => id.toLowerCase() === command.encounter.id.toLowerCase(),
      )
    ) {
      error.textContent = t('combat.encounterExists')

      return
    }

    const parsed = commandSchema.safeParse(command)
    error.textContent = parsed.success
      ? ''
      : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')

    if (!parsed.success && command.type === 'game.upsertCombat')
      focusEncounterIssue(parsed.error.issues[0]!.path.slice(1))

    if (parsed.success) {
      if (parsed.data.type === 'game.upsertCombat') encounterId = parsed.data.encounter.id

      if (
        [
          'game.upsertCombat',
          'game.removeCombat',
          'scene.setCombat',
          'combat.copySharedEntry',
        ].includes(parsed.data.type)
      )
        submitted = parsed.data.type
      save(parsed.data)
    }
  }

  function render() {
    if (!draft && page === 'simulation') page = 'encounter'
    showPage()
    fields.replaceChildren()
    simulation.render(view, draft)

    if (!view?.game) return
    const scene = view.scenes.find((scene) => scene.id === sceneId)

    const healthFields = (view.rules?.state ?? []).flatMap((field) =>
      typeof field.value === 'number' && field.value > 0
        ? [{ path: field.path, value: field.value }]
        : [],
    )

    const fieldId = (path: string[]) => (path.length ? JSON.stringify(path) : '')

    if (!healthFields.some((field) => fieldId(field.path) === playerHealth))
      playerHealth = fieldId(
        (healthFields.find((field) => field.path.at(-1) === 'health') ?? healthFields[0])?.path ??
          [],
      )

    if (
      enemyHealth === playerHealth ||
      !healthFields.some((field) => fieldId(field.path) === enemyHealth)
    )
      enemyHealth = fieldId(
        (
          healthFields.find(
            (field) => field.path.at(-1) === 'enemyHealth' && fieldId(field.path) !== playerHealth,
          ) ?? healthFields.find((field) => fieldId(field.path) !== playerHealth)
        )?.path ?? [],
      )

    const healthChoices = healthFields.map(
      (field) => [fieldId(field.path), `${field.path.join('.')} · ${field.value}`] as const,
    )

    const help = document.createElement('p')
    help.className = 'help'
    help.textContent = t('combat.healthHelp')

    const picker = controls.select(
      t('combat.gameScene'),
      sceneId,
      sceneChoices(view, 'game'),
      (value) => {
        if (!navigate(value, encounterId)) picker.querySelector('select')!.value = sceneId
      },
      false,
    )

    picker.className = 'context-picker'

    const encounters = controls.select(
      t('combat.encounter'),
      encounterId,
      [['', t('form.choose')], ...Object.keys(view.combat ?? {})],
      (value) => {
        if (!navigate(sceneId, value)) encounters.querySelector('select')!.value = encounterId
      },
      false,
    )

    encounters.className = 'context-picker'

    // Creating an encounter is folded away while one is open, so its form starts near the top.
    // Each case keeps its own fold state; a fold that starts open records itself as opened.
    const fileNavigation = controls.create('div')
    fileNavigation.setAttribute('data-file-navigation', '')
    fields.append(fileNavigation)
    fileNavigation.append(
      ...(!definitionOnly ? [picker] : []),
      encounters,
      controls.fold(
        draft ? 'new-encounter:editing' : 'new-encounter:empty',
        t('combat.newEncounter'),
        !draft,
        controls.group(
          t('combat.newEncounterHealth'),
          help,
          controls.select(
            t('combat.newPlayerHealth'),
            playerHealth,
            healthChoices,
            (value) => {
              playerHealth = value
            },
            false,
          ),
          controls.select(
            t('combat.newEnemyHealth'),
            enemyHealth,
            healthChoices,
            (value) => {
              enemyHealth = value
            },
            false,
          ),
        ),
        controls.button(t('combat.addEncounter'), () => {
          if (dirty || simulation.hasDrafts()) {
            error.textContent = t('combat.saveFirst')

            return
          }

          const playerField = healthFields.find((field) => fieldId(field.path) === playerHealth)
          const enemyField = healthFields.find((field) => fieldId(field.path) === enemyHealth)

          if (
            (!definitionOnly && scene?.type !== 'game') ||
            !playerField ||
            !enemyField ||
            playerHealth === enemyHealth
          ) {
            error.textContent = t('combat.chooseSceneAndHealth')

            return
          }

          error.textContent = ''
          let id = 'training'
          let number = 1

          while (view?.game?.combat?.some((entry) => entry.toLowerCase() === id.toLowerCase()))
            id = `training-${number++}`

          draft = combatSourceSchema.parse({
            'schema-version': '1.0.0',
            id,
            label: 'Training',
            player: {
              id: 'player',
              label: 'Player',
              health: { source: 'game.state', path: [...playerField.path] },
              maximumHealth: Math.max(40, playerField.value),
              moves: ['attack', 'guard'],
            },
            enemies: [
              {
                id: 'opponent',
                label: 'Opponent',
                health: { source: 'game.state', path: [...enemyField.path] },
                maximumHealth: Math.max(20, enemyField.value),
                moves: ['attack'],
                rotation: ['attack'],
              },
            ],
            moves: {
              attack: { type: 'attack', label: 'Attack', apCost: 1, damage: { min: 2, max: 4 } },
              guard: { type: 'guard', label: 'Guard', apCost: 1, guard: 4 },
            },
          })
          encounterId = id
          creating = true
          component = combatComponentSchema.parse({
            id: 'combat',
            type: 'combat',
            encounter: id,
            placement: {
              row: 1,
              column: 1,
              rowSpan: Math.min(5, scene?.screen.grid.rows ?? 1),
              columnSpan: scene?.screen.grid.columns ?? 1,
            },
          })
          dirty = true
          render()
        }),
      ),
    )

    if (!draft || (!scene && !definitionOnly) || !component) return
    const current = component
    const form = document.createElement('form')
    const button = document.createElement('button')
    button.type = 'submit'
    button.textContent = t('combat.saveEncounter')

    const placement =
      openComponent && scene && view.combatSources?.[encounterId]
        ? controls.fold(
            'scene-placement',
            t('inspector.addToScene'),
            false,
            picker,
            componentShortcuts(controls, view, scene, ['combat'], openComponent, encounterId),
          )
        : undefined

    form.append(
      saveBar(
        document,
        button,
        saveStatus(document, t, () => dirty),
        controls.button(t('combat.discard'), reset),
      ),
      ...(placement ? [placement] : []),
      controls.section(
        'encounter-shared',
        sharedCombatForm(
          controls,
          view,
          draft,
          render,
          (library) => {
            if (openLibrary) openLibrary(library)
            else if (selectPage('libraries')) libraryEditor.navigate(library)
          },
          (command) => {
            if (dirty) {
              error.textContent = t('combat.saveFirstCopy')

              return
            }

            submit(command)
          },
        ),
      ),
      ...combatForm(scopedFolds(controls, `encounter:${draft.id}`), view, draft, render, creating),
      combatWordingForm(
        scopedFolds(baseControls, `encounter:${draft.id}`),
        view,
        draft,
        wordingSelection(encounterId),
        openWordingKey,
      ),
    )

    if (!definitionOnly && scene)
      form.append(
        controls.section(
          'encounter-view',
          controls.group(
            t('form.combatView'),
            controls.input(t('combat.componentId'), current.id, (value) => {
              current.id = value.trim()
            }),
            controls.select(
              t('combat.mainTextTarget'),
              current.textTarget ?? '',
              [
                '',
                ...scene.components
                  .filter((component) => component.type === 'text')
                  .map((component) => component.id),
              ],
              (value) => {
                current.textTarget = value || undefined
              },
            ),
            controls.select(
              t('combat.lootInventory'),
              current.lootInventory ?? '',
              [
                '',
                ...scene.components
                  .filter((component) => component.type === 'inventory')
                  .map((component) => component.id),
              ],
              (value) => {
                current.lootInventory = value || undefined
              },
            ),
            ...placementFields(t).map(([key, label]) =>
              controls.input(
                label,
                String(current.placement[key]),
                (value) => {
                  current.placement[key] = Number(value)
                },
                'number',
              ),
            ),
          ),
        ),
      )
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (draft && component)
        submit({
          type: 'game.upsertCombat',
          encounter: draft,
          createOnly: creating,
          ...(definitionOnly
            ? {}
            : { scene: { id: sceneId, component: { ...component, encounter: draft.id } } }),
        })
    })
    fields.append(
      form,
      ...(!definitionOnly
        ? [
            controls.button(t('combat.removeView'), () =>
              submit({ type: 'scene.setCombat', sceneId, component: null }),
            ),
          ]
        : []),
      controls.button(
        t('combat.deleteEncounter'),
        () => {
          if (draft) submit({ type: 'game.removeCombat', encounterId: draft.id })
        },
        creating,
      ),
    )
  }

  registerEditorDraft(
    root,
    'combat',
    z.object({
      definitionOnly: z.boolean().optional(),
      page: z.enum(['encounter', 'simulation', 'libraries']).optional(),
      sceneId: z.string(),
      encounterId: z.string(),
      draft: combatSourceSchema.optional(),
      component: combatComponentSchema.optional(),
      creating: z.boolean(),
      playerHealth: z.string(),
      enemyHealth: z.string(),
      wording: z
        .object({
          code: combatTextSchema.keyof(),
          query: z.string(),
          open: z.boolean(),
          shown: z.boolean().optional(),
        })
        .optional(),
      encounterDirty: z.boolean().default(true),
    }),
    () =>
      dirty || simulation.hasDrafts() || libraryEditor.hasDrafts()
        ? {
            sceneId,
            encounterId,
            draft,
            component,
            creating,
            playerHealth,
            enemyHealth,
            definitionOnly,
            encounterDirty: dirty,
            wording: wordingSelection(encounterId),
            page,
          }
        : undefined,
    (saved) => {
      definitionOnly = saved.definitionOnly ?? false
      sceneId = saved.sceneId
      encounterId = saved.encounterId

      if (saved.wording) selections.set(encounterId, saved.wording)
      draft = saved.draft
      component = saved.component
      creating = saved.creating
      playerHealth = saved.playerHealth
      enemyHealth = saved.enemyHealth
      page = saved.page ?? 'encounter'
      dirty = saved.encounterDirty
      render()
    },
    'encounter-wording-v3',
  )

  return {
    takeRecoveredComponents() {
      if (definitionOnly || !openComponent) return []
      const drafts = dirty && component ? [recoveredComponent(view, sceneId, component)] : []
      definitionOnly = true
      render()

      return drafts
    },
    canNavigate: (id?: string, nextEncounter?: string) =>
      ((id === undefined || id === sceneId) &&
        (nextEncounter === undefined || nextEncounter === encounterId)) ||
      (!dirty && !simulation.hasDrafts()),
    navigate,
    showEncounter() {
      page = 'encounter'
      showPage()
    },
    rememberSelection() {
      const scene = sceneId
      const encounter = encounterId

      const previous = page

      return () => {
        if (navigate(scene, encounter)) {
          page = previous
          showPage()
        }
      }
    },
    canOpenFile(key: string, library: boolean) {
      if (key === fileKey) return true

      return !libraryEditor.hasDrafts() && (!library || (!dirty && !simulation.hasDrafts()))
    },
    openFile(key: string, library?: string) {
      if (key === fileKey) return
      fileKey = key
      libraryFile = Boolean(library)
      page = libraryFile ? 'libraries' : 'encounter'
      showPage()

      if (library) libraryEditor.navigate(library)
    },
    hasDrafts: () => dirty || libraryEditor.hasDrafts() || simulation.hasDrafts(),
    draftLocations: () =>
      pageIds
        .filter((id) =>
          id === 'encounter'
            ? dirty
            : id === 'simulation'
              ? simulation.hasDrafts()
              : libraryEditor.hasDrafts(),
        )
        .map((id) => ({
          key: fileKey || 'combat',
          detail: t(pageLabels[id]),
          reveal: () => {
            selectPage(id)
          },
        })),
    render(state: ProjectEditorState, replaceFields: boolean) {
      const translated = languageChanged()
      libraryEditor.render(state, replaceFields)
      const projectChanged = path !== state.path

      if (projectChanged) selections.clear()
      const changed = view !== state.view
      path = state.path
      view = state.view
      busy = state.busy

      if (
        changed &&
        draft &&
        ['combat.upsertSimulationScenario', 'combat.removeSimulationScenario'].includes(
          state.lastCommand ?? '',
        )
      )
        draft.simulationScenarios = structuredClone(
          view?.combatSources?.[draft.id]?.simulationScenarios,
        )

      const saved =
        submitted && !busy && !state.error && replaceFields && submitted === state.lastCommand

      const issue =
        !busy &&
        state.error &&
        submitted === 'game.upsertCombat' &&
        state.validationIssues?.find((issue) => issue.file === combatFile(encounterId))

      if (!busy) submitted = undefined
      const resetFields = projectChanged || (replaceFields && !state.preserveDrafts)

      if (resetFields) {
        fileKey = undefined
        libraryFile = false
        page = 'encounter'
        simulation.reset()
        sceneId = view?.scenes.find((scene) => scene.type === 'game')?.id ?? ''
        encounterId = ''
      }

      if (resetFields || saved || (changed && !dirty)) reset()
      else if (changed || translated) render()
      fields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)

      if (issue) {
        error.textContent = issue.message
        focusEncounterIssue(issue.path)
      }

      simulationRoot.disabled = fields.disabled
    },
  }
}
