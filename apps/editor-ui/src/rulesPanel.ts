import { linkedTranslationFields } from './inspectorTranslations.js'
import { componentShortcuts, type OpenSceneComponent } from './componentShortcuts.js'
import { sceneChoices } from './choiceLabels.js'
import { saveStatus } from './formSaveStatus.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import { gameRulesSchema, ruleFile } from '@ancadeba/schemas'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import type { GameRulesDefinition } from '@ancadeba/schemas'
import type { ProjectEditorState } from './projectController.js'
import { ruleFormControls, saveBar, languageWatcher } from './ruleFormControls.js'
import { focusIssue, rememberEntryFocus, type EntrySelections } from './specialistEntries.js'
import { rulesDefinitionForm } from './rulesDefinitionForm.js'
import {
  ruleTriggerForms,
  ruleTriggerSections,
  type RuleTriggerSection,
} from './ruleTriggerForms.js'

const defaultRuleId = 'rules'

export function bindRulesPanel(
  panel: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate = editorLocalization().t,
  openComponent?: OpenSceneComponent,
  openKey?: (key: string) => void,
) {
  const document = panel.ownerDocument
  const rulesFields = document.createElement('fieldset')
  const triggerFields = document.createElement('fieldset')
  const navigation = document.createElement('div')
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  panel.replaceChildren(navigation, error, rulesFields, triggerFields)

  let view: ProjectView | undefined
  let loadedPath: string | undefined
  let draft: GameRulesDefinition = { state: [], actions: {} }
  let ruleId = defaultRuleId
  let newRuleId = ''
  let submitted: EditorCommand | undefined
  let selected = ''
  let entries: EntrySelections = {}
  const ruleViews = ['actions', 'state', 'display'] as const
  let ruleView: (typeof ruleViews)[number] = 'actions'
  let triggerView: RuleTriggerSection = 'buttons'
  let rulesDirty = false
  const dirtyTriggers = new Set<RuleTriggerSection>()

  const triggerLabels = {
    buttons: 'rules.sceneButtons',
    nearby: 'tree.nearby',
    inspection: 'rules.inspection',
    actions: 'specialist.itemActions',
  } as const

  const placementScenes = new Map<RuleTriggerSection, string>()
  let triggerForms = new Map<RuleTriggerSection, HTMLElement>()
  let busy = false

  function revealRuleIssue(path: readonly PropertyKey[]) {
    ruleView =
      path[0] === 'state'
        ? 'state'
        : path[0] === 'clock' || path[0] === 'log'
          ? 'display'
          : 'actions'

    if (path[0] === 'actions' && typeof path[1] === 'string') selected = path[1]
    renderRules()
    focusIssue(rulesFields, path)
  }

  const submit = (command: EditorCommand) => {
    if (busy) return
    const parsed = commandSchema.safeParse(command)
    error.textContent = parsed.success
      ? ''
      : parsed.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('\n')

    if (!parsed.success && command.type === 'game.updateRules') {
      const path = parsed.error.issues[0]!.path.slice(1)
      revealRuleIssue(path)
    }

    if (parsed.success) {
      submitted = structuredClone(parsed.data)
      save(parsed.data)
    }
  }

  const languageChanged = languageWatcher(t)

  const rulesControls = linkedTranslationFields(
    ruleFormControls(
      document,
      () => {
        rulesDirty = true
      },
      t,
    ),
    openKey,
  )

  const triggerControls = ruleFormControls(document, () => {}, t)

  const definitions = rulesControls.button(t('rules.definitions'), () => showTriggers(false))
  const triggers = rulesControls.button(t('rules.triggers'), () => showTriggers(true))
  navigation.append(definitions, triggers)
  showTriggers(false)

  function showTriggers(show: boolean) {
    if (show && openComponent) renderTriggers()
    rulesFields.hidden = show
    triggerFields.hidden = !show
    definitions.setAttribute('aria-pressed', String(!show))
    triggers.setAttribute('aria-pressed', String(show))
  }

  const selectAction = (id: string) => {
    selected = id
  }

  const change = (edit: () => void) => {
    edit()
    rulesDirty = true
    renderRules()
  }

  function renderRules() {
    const restoreFocus = rememberEntryFocus(rulesFields)
    rulesFields.replaceChildren()

    if (!view?.game) return
    const form = document.createElement('form')
    const ids = view.game.rules ?? []
    const choices = ids.length ? ids : [defaultRuleId]

    const filePicker = rulesControls.select(
      t('rules.file'),
      ruleId,
      [...choices, ['', t('rules.newFile')]],
      (next) => {
        if (rulesDirty) {
          filePicker.querySelector('select')!.value = ruleId
          error.textContent = t('rules.saveFirstFiles')

          return
        }

        entries = {}
        ruleView = 'actions'
        ruleId = next
        newRuleId = ''
        error.textContent = ''
        resetRules()
      },
      false,
    )

    const otherFields = Object.entries(view.ruleFiles ?? {})
      .filter(([id]) => id !== ruleId)
      .flatMap(([, rules]) => rules.state)

    const saveButton = document.createElement('button')
    saveButton.type = 'submit'
    saveButton.textContent = t('rules.save')
    form.append(
      saveBar(
        document,
        saveButton,
        saveStatus(document, t, () => rulesDirty),
        rulesControls.button(t('rules.discard'), () => {
          newRuleId = ''
          resetRules()
          error.textContent = ''
        }),
      ),
    )

    const groups = rulesDefinitionForm(
      rulesControls,
      view,
      draft,
      selected,
      (id) => {
        selectAction(id)
        renderRules()
      },
      change,
      renderRules,
      otherFields,
      entries,
    )

    const showView = () =>
      groups.forEach((group, index) => {
        group.hidden = ruleViews[index] !== ruleView
      })

    const viewPicker = rulesControls.select(
      t('specialist.view'),
      ruleView,
      [
        ['actions', t('rules.actions')],
        ['state', t('rules.initialState')],
        ['display', t('rules.clockAndLog')],
      ],
      (value) => {
        ruleView = value
        showView()
      },
      false,
    )

    form.append(filePicker, viewPicker)

    if (!ruleId)
      form.append(
        rulesControls.input(t('rules.newId'), newRuleId, (value) => {
          newRuleId = value.trim()
        }),
      )

    form.append(...groups)
    form.addEventListener(
      'invalid',
      (event) => {
        const index = groups.findIndex(
          (group) => event.target instanceof Node && group.contains(event.target),
        )

        if (index < 0) return
        ruleView = ruleViews[index]!
        viewPicker.querySelector('select')!.value = ruleView
        showView()
      },
      true,
    )
    showView()
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (!ruleId && ids.some((id) => id.toLowerCase() === newRuleId.toLowerCase())) {
        error.textContent = t('rules.idExists')

        return
      }

      submit({ type: 'game.updateRules', ruleId: ruleId || newRuleId, rules: draft })
    })
    rulesFields.append(form)
    restoreFocus?.()
  }

  function renderTriggers() {
    if (!view?.game) {
      triggerFields.replaceChildren()
      triggerForms.clear()

      return
    }

    const retained = new Map([...triggerForms].filter(([section]) => dirtyTriggers.has(section)))

    const forms = ruleTriggerForms(triggerControls, view, submit, {
      retained,
      shortcut(section) {
        if (
          !openComponent ||
          dirtyTriggers.has(section) ||
          (section !== 'buttons' && section !== 'nearby') ||
          !view
        )
          return
        const project = view
        const choices = sceneChoices(project, 'game')

        const group = triggerControls.group(
          t(section === 'buttons' ? 'rules.sceneButtons' : 'tree.nearby'),
        )

        const scene =
          project.scenes.find((scene) => scene.id === placementScenes.get(section)) ??
          project.scenes.find((scene) => scene.type === 'game')

        if (!scene) return group
        group.append(
          triggerControls.select(
            t('form.gameScene'),
            scene.id,
            choices,
            (id) => {
              placementScenes.set(section, id)
              renderTriggers()
            },
            false,
          ),
          componentShortcuts(
            triggerControls,
            project,
            scene,
            [section === 'buttons' ? 'button' : 'nearby'],
            openComponent,
            section === 'buttons' ? selected : undefined,
          ),
        )

        return group
      },
      controls: (section) => ruleFormControls(document, () => dirtyTriggers.add(section), t),
      discarded: (section) => {
        dirtyTriggers.delete(section)
        renderTriggers()
      },
    })

    triggerForms = new Map(ruleTriggerSections.map((section, index) => [section, forms[index]!]))

    const showTask = () => {
      for (const [section, form] of triggerForms) form.hidden = section !== triggerView
    }

    triggerFields.replaceChildren(
      triggerControls.select(
        t('specialist.trigger'),
        triggerView,
        (['buttons', 'nearby', 'inspection', 'actions'] as const).map((section) => [
          section,
          t(triggerLabels[section]),
        ]),
        (value) => {
          triggerView = value
          showTask()
        },
        false,
      ),
      ...forms,
    )
    showTask()
  }

  function resetRules() {
    const ids = view?.game?.rules ?? []
    const ruleFiles = view?.ruleFiles

    if (ruleId && ids.length && !ids.includes(ruleId)) ruleId = ids[0]!
    const saved = ruleFiles && Object.hasOwn(ruleFiles, ruleId) ? ruleFiles[ruleId] : undefined
    draft = structuredClone(saved ?? { state: [], actions: {} })

    if (!Object.hasOwn(draft.actions, selected)) selected = Object.keys(draft.actions)[0] ?? ''
    rulesDirty = false
    renderRules()
  }

  registerEditorDraft(
    panel,
    'rules',
    z.object({
      draft: gameRulesSchema,
      ruleId: z.string(),
      newRuleId: z.string(),
      selected: z.string(),
      rulesDirty: z.boolean(),
      ruleView: z.enum(ruleViews),
      triggerView: z.enum(ruleTriggerSections),
      entries: z.record(z.string(), z.number().int().nonnegative()),
      dirtyTriggers: z.array(z.enum(ruleTriggerSections)),
      triggers: z.boolean(),
    }),
    () =>
      rulesDirty || dirtyTriggers.size
        ? {
            draft,
            ruleId,
            newRuleId,
            selected,
            rulesDirty,
            entries,
            ruleView,
            triggerView,
            dirtyTriggers: [...dirtyTriggers],
            triggers: !triggerFields.hidden,
          }
        : undefined,
    (saved) => {
      draft = saved.draft
      ruleId = saved.ruleId
      newRuleId = saved.newRuleId
      selected = saved.selected
      ruleView = saved.ruleView
      triggerView = saved.triggerView
      entries = saved.entries
      rulesDirty = saved.rulesDirty
      dirtyTriggers.clear()

      triggerForms.clear()

      for (const section of saved.dirtyTriggers) dirtyTriggers.add(section)
      renderRules()
      renderTriggers()
      showTriggers(saved.triggers)
    },
    'selected-rules-v1',
  )

  return {
    render(state: ProjectEditorState, replaceFields: boolean) {
      const translated = languageChanged()
      const projectChanged = state.path !== loadedPath
      const viewChanged = view !== state.view
      view = state.view
      loadedPath = state.path
      busy = state.busy

      const saved =
        submitted && !busy && replaceFields && !state.error && state.lastCommand === submitted.type
          ? submitted
          : undefined

      const issue =
        !busy &&
        state.error &&
        submitted?.type === 'game.updateRules' &&
        state.validationIssues?.find((issue) => issue.file === ruleFile(ruleId || newRuleId))

      if (!busy) submitted = undefined
      const rulesSaved = saved?.type === 'game.updateRules'

      const triggerSection: RuleTriggerSection | undefined =
        saved?.type === 'scene.upsertRuleButton'
          ? 'buttons'
          : saved?.type === 'inventory.setRuleInspection'
            ? 'inspection'
            : saved?.type === 'inventory.setItemActions'
              ? 'actions'
              : saved?.type === 'scene.upsertNearby'
                ? 'nearby'
                : undefined

      const reset = projectChanged || (replaceFields && !state.preserveDrafts)

      if (reset) {
        ruleView = 'actions'
        triggerView = 'buttons'
        entries = {}
        ruleId = view?.game?.rules?.[0] ?? defaultRuleId
        newRuleId = ''
        dirtyTriggers.clear()
        placementScenes.clear()
        triggerForms.clear()
        submitted = undefined
      }

      if (saved?.type === 'game.updateRules') ruleId = saved.ruleId

      if (triggerSection) dirtyTriggers.delete(triggerSection)

      if (translated) {
        definitions.textContent = t('rules.definitions')
        triggers.textContent = t('rules.triggers')
      }

      if (reset || rulesSaved || (viewChanged && !rulesDirty)) {
        resetRules()
      } else if (translated) renderRules()

      if (reset || triggerSection || viewChanged || translated) {
        renderTriggers()
      }

      if (reset || rulesSaved || triggerSection) error.textContent = ''
      rulesFields.disabled = busy || !view?.game
      triggerFields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)

      if (issue) {
        error.textContent = issue.message
        revealRuleIssue(issue.path)
      }
    },
    hasDrafts: () => rulesDirty || dirtyTriggers.size > 0,
    draftLocations: () => [
      ...(rulesDirty
        ? [
            {
              key: view?.game?.rules?.includes(ruleId) ? 'rule-file:' + ruleId : 'rules',
              detail: t('rules.definitions'),
              reveal: () => showTriggers(false),
            },
          ]
        : []),
      ...[...dirtyTriggers].map((section) => ({
        key: 'rules',
        detail: t(triggerLabels[section]),
        reveal() {
          triggerView = section

          if (!openComponent) renderTriggers()
          showTriggers(true)
        },
      })),
    ],
    rememberTab() {
      const triggers = !triggerFields.hidden

      return () => showTriggers(triggers)
    },
    /** Opens a rule file's definitions; refuses while the current file has a draft. */
    canNavigate: (id: string) => id === ruleId || !rulesDirty,
    navigate(id: string) {
      if (id === ruleId) {
        showTriggers(false)

        return true
      }

      if (rulesDirty) return false
      ruleId = id
      entries = {}
      ruleView = 'actions'
      newRuleId = ''
      error.textContent = ''
      showTriggers(false)
      resetRules()

      return true
    },
  }
}
