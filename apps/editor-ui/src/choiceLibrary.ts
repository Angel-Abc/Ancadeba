import {
  choiceFile,
  choiceFormIds,
  choiceSchema,
  assetIdSchema,
  type ChoiceDefinition,
} from '@ancadeba/schemas'
import type { EditorCommand, ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import { z } from 'zod'
import { choiceOptions } from './choiceOptions.js'
import { registerEditorDraft } from './editorDraftState.js'
import type { ConfirmAction } from './editorConfirmation.js'
import { formLabel, formWording } from './formElements.js'
import { saveStatus } from './formSaveStatus.js'
import type { ProjectEditorState } from './projectController.js'
import { languageWatcher, ruleFormControls, saveBar } from './ruleFormControls.js'
import { fieldPath, focusIssue, rememberEntryFocus } from './specialistEntries.js'

export function bindChoiceLibrary(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate,
  confirm: ConfirmAction,
) {
  const document = root.ownerDocument
  let view: ProjectView | undefined
  let projectPath: string | undefined
  let fileScope: string | undefined
  let original: string | undefined
  let draft: ChoiceDefinition | undefined
  let dirty = false
  let busy = false
  let pending: EditorCommand['type'] | undefined
  let message = ''
  const selection = { option: 0 }
  const languageChanged = languageWatcher(t)
  const error = document.createElement('p')
  error.setAttribute('role', 'alert')
  error.className = 'error'

  const c = ruleFormControls(
    document,
    () => {
      dirty = true
      error.hidden = true
      message = ''

      for (const control of root.querySelectorAll<HTMLButtonElement | HTMLSelectElement>(
        '[data-choice-navigation]',
      ))
        control.disabled = true
    },
    t,
  )

  function open(id?: string) {
    original = id && view?.choices?.[id] ? id : undefined
    draft = original ? structuredClone(view!.choices![original]!) : undefined
    dirty = false
    message = ''
    selection.option = 0
    draw()
  }

  function create() {
    if (!view || dirty || busy) return

    const field = view.rules?.state.find(
      (entry) => typeof entry.value === 'string' && assetIdSchema.safeParse(entry.value).success,
    )

    const option = typeof field?.value === 'string' ? field.value : 'option'
    let id = 'choice'
    let suffix = 2

    while (view.choices?.[id]) id = 'choice-' + suffix++
    original = undefined
    draft = {
      'schema-version': '1.0.0',
      id,
      label: t('forms.choice'),
      path: field?.path.slice() ?? [],
      options: [{ id: option, label: option }],
      default: option,
    }
    dirty = true
    selection.option = 0
    message = ''
    draw()
  }

  function issue(path: PropertyKey[], reason: string) {
    if (path[0] === 'options' && typeof path[1] === 'number') selection.option = path[1]
    message = reason
    draw()
    focusIssue(root, path)
  }

  function submit() {
    if (!draft || busy || pending) return

    if (!original && view?.choices?.[draft.id]) return issue(['id'], t('choices.exists'))
    const parsed = choiceSchema.safeParse(draft)

    if (!parsed.success) {
      const problem = parsed.error.issues[0]!

      return issue(problem.path, problem.message)
    }

    pending = 'game.upsertChoice'
    save({ type: pending, choice: parsed.data })
  }

  async function remove(choice: ChoiceDefinition) {
    if (!original || !view || dirty || busy || pending) return
    const currentView = view

    if (
      !(await confirm(
        t('choices.confirmRemove', { name: formLabel(view, choice) }),
        'choices.remove',
      ))
    )
      return

    if (currentView !== view || draft !== choice || busy || dirty || pending) return
    pending = 'game.removeChoice'
    save({ type: pending, choiceId: original })
  }

  function draw() {
    const restoreFocus = rememberEntryFocus(root)
    root.replaceChildren()

    if (!view) return
    const project = view
    const library = Object.values(project.choices ?? {})
    const controls = c.create('fieldset')
    controls.disabled = busy
    error.textContent = message
    error.hidden = !message
    root.append(error, controls)

    if (!fileScope && library.length) {
      const picker = c.select(
        t('choices.heading'),
        original ?? '',
        [
          ['', t('form.none')],
          ...library.map((entry) => [entry.id, formLabel(project, entry)] as const),
        ],
        (id) => open(id),
        false,
      )

      const select = picker.querySelector('select')!
      select.disabled = dirty
      select.setAttribute('data-choice-navigation', '')
      controls.append(picker)
    }

    const add = c.button(t('choices.create'), create, dirty)
    add.setAttribute('data-choice-navigation', '')

    if (!fileScope) controls.append(add)
    const choice = draft

    if (!choice) return

    const identity = c.input(t('choices.id'), choice.id, (id) => {
      choice.id = id
    })

    identity.querySelector('input')!.readOnly = Boolean(original)
    const paths = (view.rules?.state ?? []).filter((field) => typeof field.value === 'string')
    controls.append(
      fieldPath(identity, 'id'),
      ...formWording(c, view, choice, []),
      fieldPath(
        c.select(
          t('form.stateField'),
          JSON.stringify(choice.path),
          [
            ['[]', t('form.none')],
            ...paths.map(({ path }) => [JSON.stringify(path), path.join('.')] as const),
          ],
          (value) => {
            choice.path = JSON.parse(value)
          },
        ),
        'path',
      ),
      choiceOptions(c, view, choice, selection, draw),
      saveBar(
        document,
        c.button(t('choices.save'), submit),
        saveStatus(document, t, () => dirty),
        c.button(t(original ? 'form.discardChanges' : 'component.cancel'), () => open(original)),
      ),
    )

    if (original) {
      const uses = choiceFormIds(original, Object.values(view.forms ?? {})).map(
        (choiceId) => formLabel(project, project.forms![choiceId]!) + ' (' + choiceId + ')',
      )

      if (view.game?.characterProfile?.fields.includes(original)) uses.push(t('character.profile'))

      if (uses.length) {
        const used = c.create('p')
        used.textContent = t('choices.usedBy', { names: uses.join(', ') })
        controls.append(used)
      }

      const button = c.button(
        t('choices.remove'),
        () => {
          void remove(choice)
        },
        dirty || Boolean(uses.length),
      )

      button.setAttribute('data-choice-navigation', '')
      controls.append(button)
    }

    restoreFocus?.()
  }

  registerEditorDraft(
    root,
    'choice-library',
    z.object({ choice: choiceSchema, original: z.string().optional(), option: z.number() }),
    () => (dirty && draft ? { choice: draft, original, option: selection.option } : undefined),
    (saved) => {
      draft = saved.choice
      original = saved.original
      selection.option = saved.option
      dirty = true
      draw()
    },
  )

  return {
    open(id?: string) {
      if (id === fileScope) return
      fileScope = id

      if (id && id !== original && !dirty) open(id)
      else draw()
    },
    canOpen: (id?: string) => !dirty || !id || id === original,
    hasDrafts: () => dirty,
    render(state: ProjectEditorState, replace: boolean) {
      const changed = view !== state.view
      const switched = projectPath !== state.path
      const wasBusy = busy
      const translated = languageChanged()
      view = state.view
      busy = state.busy
      projectPath = state.path

      if (switched) {
        fileScope = undefined
        pending = undefined
        open()

        return
      }

      if (pending && !busy) {
        const command = pending
        pending = undefined

        if (state.error) {
          const problem = state.validationIssues?.find(
            (e) => draft && e.file === choiceFile(draft.id),
          )

          if (problem) return issue(problem.path, problem.message)
          message = state.error
        } else if (state.lastCommand === command) {
          open(command === 'game.upsertChoice' ? draft?.id : undefined)

          return
        }
      }

      if (changed && !dirty && original && !message) open(original)
      else if (changed || replace || translated || wasBusy !== busy) draw()
    },
  }
}
