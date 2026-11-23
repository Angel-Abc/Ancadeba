import { recoveredComponent } from './recoveredSceneComponents.js'
import { componentShortcuts, type OpenSceneComponent } from './componentShortcuts.js'
import { rememberEntryFocus } from './specialistEntries.js'
import { saveStatus } from './formSaveStatus.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import { actionBarComponentSchema, sceneControlSchema } from '@ancadeba/schemas'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import type { ActionBarComponentDefinition, InputDefinition } from '@ancadeba/schemas'
import type { ProjectEditorState } from './projectController.js'
import { ruleFormControls, saveBar, languageWatcher } from './ruleFormControls.js'
import { actionBarForm } from './actionBarForm.js'
import {
  createInputDraft,
  inputDefinitionForm,
  readInputDraft,
  type InputDraft,
  type InputSelection,
} from './inputDefinitionForm.js'
import { sceneChoices } from './choiceLabels.js'

function defaultInput(): InputDefinition {
  const slots = Array.from({ length: 15 }, (_, index) => `slot-${index + 1}`)

  return {
    'schema-version': '1.0.0',
    'virtual-keys': slots,
    keyboard: Object.fromEntries(
      'QWERTASDFGZXCVB'.split('').map((key, index) => [`Key${key}`, slots[index]!]),
    ),
    contexts: { gameplay: Object.fromEntries(slots.map((slot) => [slot, slot])) },
    'initial-context': 'gameplay',
  }
}

export function bindActionBarPanel(
  panel: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate = editorLocalization().t,
  openComponent?: OpenSceneComponent,
) {
  const document = panel.ownerDocument
  const navigation = document.createElement('div')
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  const barFields = document.createElement('fieldset')
  const inputFields = document.createElement('fieldset')
  panel.replaceChildren(navigation, error, barFields, inputFields)

  let view: ProjectView | undefined
  let loadedPath: string | undefined
  let sceneId = ''
  let selectedSlot = '1'
  let barDraft: ActionBarComponentDefinition | undefined
  let inputDraft: InputDraft | undefined
  let inputSelection: InputSelection = { view: 'keyboard', context: '', entries: {} }
  let inputId = 'controls'
  let barDirty = false
  let inputDirty = false
  let busy = false

  const languageChanged = languageWatcher(t)

  const barControls = ruleFormControls(
    document,
    () => {
      barDirty = true
    },
    t,
  )

  const inputControls = ruleFormControls(
    document,
    () => {
      inputDirty = true
    },
    t,
  )

  const barTab = barControls.button(t('controls.sceneActionBar'), () => showInputs(false))
  const inputTab = inputControls.button(t('controls.inputBindings'), () => showInputs(true))
  navigation.append(barTab, inputTab)

  function showInputs(show: boolean) {
    barFields.hidden = show
    inputFields.hidden = !show
    barTab.setAttribute('aria-pressed', String(!show))
    inputTab.setAttribute('aria-pressed', String(show))
  }

  showInputs(false)

  const submit = (command: EditorCommand) => {
    if (busy) return
    const parsed = commandSchema.safeParse(command)
    error.textContent = parsed.success
      ? ''
      : parsed.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('\n')

    if (parsed.success) save(parsed.data)
  }

  function navigate(nextScene?: string): boolean {
    if (!nextScene || nextScene === sceneId) return true

    if (barDirty) {
      error.textContent = t('controls.saveBarFirst')

      return false
    }

    sceneId = nextScene
    selectedSlot = '1'
    resetBar()
    error.textContent = ''
    showInputs(false)

    return true
  }

  function renderBar() {
    barFields.replaceChildren()

    if (!view?.game) return
    const scene = view.scenes.find(({ id, type }) => id === sceneId && type === 'game')

    const picker = barControls.select(
      t('form.gameScene'),
      sceneId,
      sceneChoices(view, 'game'),
      (next) => {
        if (!navigate(next)) picker.querySelector('select')!.value = sceneId
      },
      false,
    )

    picker.className = 'context-picker'

    barFields.append(picker)

    if (!scene) {
      barFields.append(t('controls.selectScene'))

      return
    }

    if (openComponent && !barDirty) {
      barFields.append(componentShortcuts(barControls, view, scene, ['action-bar'], openComponent))

      return
    }

    if (!barDraft) {
      barFields.append(
        barControls.button(t('controls.addBar'), () => {
          const { rows, columns } = scene.screen.grid
          barDraft = {
            id: 'action-bar',
            type: 'action-bar',
            slots: {},
            placement: {
              row: Math.max(1, rows - 2),
              column: 1,
              rowSpan: Math.min(3, rows),
              columnSpan: columns,
            },
          }
          barDirty = true
          renderBar()
        }),
      )

      return
    }

    const form = document.createElement('form')
    const saveButton = document.createElement('button')
    saveButton.type = 'submit'
    saveButton.textContent = t('controls.saveBar')
    form.append(
      saveBar(
        document,
        saveButton,
        saveStatus(document, t, () => barDirty),
      ),
      ...actionBarForm(
        barControls,
        view,
        barDraft,
        selectedSlot,
        (id) => {
          selectedSlot = id
          renderBar()
        },
        (edit) => {
          edit()
          barDirty = true
          renderBar()
        },
        sceneId,
      ),
    )
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (barDraft) submit({ type: 'scene.setActionBar', sceneId, component: barDraft })
    })
    barFields.append(
      form,
      barControls.button(t('controls.discardBar'), () => {
        resetBar()
        error.textContent = ''
      }),
      barControls.button(
        t('controls.removeBar'),
        () => submit({ type: 'scene.setActionBar', sceneId, component: null }),
        !scene.components.some((component) => component.type === 'action-bar'),
      ),
    )
  }

  function resetBar() {
    barDraft = structuredClone(
      view?.scenes
        .find(({ id }) => id === sceneId)
        ?.components.find((component) => component.type === 'action-bar'),
    )
    barDirty = false
    renderBar()
  }

  function resetInput() {
    inputDraft = view?.input ? createInputDraft(view.input) : undefined
    inputId = view?.game?.input ?? 'controls'
    inputDirty = false
    renderInput()
  }

  function renderInput() {
    const restoreFocus = rememberEntryFocus(inputFields)
    inputFields.replaceChildren()

    if (!view?.game) return

    if (!inputDraft) {
      inputFields.append(
        inputControls.button(t('controls.createInput'), () => {
          inputDraft = createInputDraft(defaultInput())
          inputDirty = true
          renderInput()
        }),
      )

      return
    }

    const form = document.createElement('form')

    const editor = inputDefinitionForm(
      inputControls,
      inputDraft,
      inputSelection,
      () => {
        inputDirty = true
      },
      (message) => {
        error.textContent = message
      },
    )

    const location = document.createElement('p')
    location.textContent = t('controls.inputFile', { id: view.game.input ?? inputId })
    const help = document.createElement('p')
    help.textContent = t('controls.inputHelp')
    const saveButton = document.createElement('button')
    saveButton.type = 'submit'
    saveButton.textContent = t('controls.saveInput')
    form.append(
      saveBar(
        document,
        saveButton,
        saveStatus(document, t, () => inputDirty),
        inputControls.button(t('controls.discardInput'), resetInput),
      ),

      ...(!view.game.input
        ? [
            inputControls.input(t('controls.inputFileId'), inputId, (value) => {
              inputId = value.trim()
            }),
          ]
        : []),
      editor.element,
      location,
      help,
    )
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (busy || !inputDraft) return

      try {
        submit({ type: 'game.updateInput', inputId, input: readInputDraft(inputDraft, t) })
      } catch (failure) {
        editor.reveal(failure)
        error.textContent = failure instanceof Error ? failure.message : String(failure)
      }
    })
    inputFields.append(form)
    restoreFocus?.()
  }

  registerEditorDraft(
    panel,
    'controls',
    z.object({
      sceneId: z.string(),
      selectedSlot: z.string(),
      barDraft: actionBarComponentSchema.optional(),
      barDirty: z.boolean(),
      inputDirty: z.boolean(),
      inputId: z.string(),
      inputSelection: z
        .object({
          view: z.enum(['keyboard', 'contexts', 'keys', 'scene']),
          context: z.string(),
          entries: z.record(z.string(), z.number()),
        })
        .optional(),
      showInput: z.boolean().optional(),
      inputDraft: z
        .object({
          virtualKeys: z.string(),
          sceneKeys: z.partialRecord(sceneControlSchema, z.string()).default({}),
          keyboard: z.array(z.object({ code: z.string(), key: z.string() })),
          contexts: z.record(z.string(), z.array(z.object({ key: z.string(), input: z.string() }))),
          initialContext: z.string(),
          newContext: z.string(),
        })
        .optional(),
    }),
    () =>
      barDirty || inputDirty
        ? {
            sceneId,
            selectedSlot,
            barDraft,
            barDirty,
            inputDirty,
            inputId,
            inputDraft,
            inputSelection,
            showInput: !inputFields.hidden,
          }
        : undefined,
    (saved) => {
      sceneId = saved.sceneId
      selectedSlot = saved.selectedSlot
      barDraft = saved.barDraft
      barDirty = saved.barDirty
      inputDirty = saved.inputDirty
      inputId = saved.inputId
      inputDraft = saved.inputDraft

      if (saved.inputSelection) inputSelection = saved.inputSelection
      showInputs(saved.showInput ?? saved.inputDirty)
      renderBar()
      renderInput()
    },
    'input-bindings-v3',
  )

  return {
    takeRecoveredComponents() {
      if (!barDirty || !barDraft) return []
      const entry = { ...recoveredComponent(view, sceneId, barDraft), slot: selectedSlot }
      resetBar()

      return [entry]
    },
    canNavigate: (nextScene?: string) => !nextScene || nextScene === sceneId || !barDirty,
    navigate,
    hasDrafts: () => barDirty || inputDirty,
    draftLocations: () => [
      ...(barDirty
        ? [
            {
              key: 'controls',
              detail: t('controls.sceneActionBar'),
              reveal: () => showInputs(false),
            },
          ]
        : []),
      ...(inputDirty
        ? [{ key: 'controls', detail: t('controls.inputBindings'), reveal: () => showInputs(true) }]
        : []),
    ],
    render(state: ProjectEditorState, replaceFields: boolean) {
      const translated = languageChanged()
      const projectChanged = state.path !== loadedPath
      const viewChanged = view !== state.view
      view = state.view
      loadedPath = state.path
      busy = state.busy
      const reset = projectChanged || (replaceFields && !state.preserveDrafts)
      const barSaved = replaceFields && state.lastCommand === 'scene.setActionBar'
      const inputSaved = replaceFields && state.lastCommand === 'game.updateInput'

      if (reset) {
        inputSelection = { view: 'keyboard', context: '', entries: {} }
        sceneId = view?.scenes.find(({ type }) => type === 'game')?.id ?? ''
        selectedSlot = '1'
      }

      if (translated) {
        barTab.textContent = t('controls.sceneActionBar')
        inputTab.textContent = t('controls.inputBindings')
      }

      if (reset || barSaved || (viewChanged && !barDirty)) resetBar()
      else if (viewChanged || translated) renderBar()

      if (reset || inputSaved || (viewChanged && !inputDirty)) resetInput()
      else if (translated) renderInput()

      if (reset || barSaved || inputSaved) error.textContent = ''
      barFields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)
      inputFields.disabled = busy || !view?.game || Boolean(view.diagnostics.length)
    },
  }
}
