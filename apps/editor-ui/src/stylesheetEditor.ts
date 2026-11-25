import { saveStatus } from './formSaveStatus.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import { commandSchema, type EditorCommand, type ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import type { ProjectEditorState } from './projectController.js'
import { ruleFormControls, saveBar } from './ruleFormControls.js'

const starterCss = `.ancadeba-scene {
  --ge-scene-background: #18202b;
  --ge-scene-color: #f4f1e8;
  --ge-scene-font-family: Georgia, serif;
}
`

/** CSS remains a text draft until a revision-checked save publishes its file and assignment. */
export function bindStylesheetEditor(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate = editorLocalization().t,
  validateCss?: (css: string) => void,
) {
  const document = root.ownerDocument
  const fields = document.createElement('fieldset')
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  const feedback = document.createElement('p')
  feedback.setAttribute('role', 'status')
  root.replaceChildren(error, fields)
  let view: ProjectView | undefined
  let path: string | undefined
  let file = ''
  let previousFile = ''
  let css = ''
  let creating = false
  let dirty = false
  let busy = false
  let submitted: EditorCommand | undefined
  let language = t('stylesheets.heading')

  const controls = ruleFormControls(document, () => {
    dirty = true
    feedback.textContent = ''
  })

  const allowed = () =>
    !view?.diagnostics.some(
      (diagnostic) =>
        diagnostic.file !== view?.game?.stylesheet ||
        !['missing_file', 'invalid_stylesheet'].includes(diagnostic.code),
    )

  const reset = () => {
    const stylesheets = view?.stylesheets ?? {}

    if (!file || !Object.hasOwn(stylesheets, file))
      file = view?.game?.stylesheet ?? Object.keys(stylesheets)[0] ?? 'custom.css'
    creating = !Object.hasOwn(stylesheets, file)
    css = stylesheets[file] ?? starterCss
    dirty = false
    error.textContent = ''
    feedback.textContent = ''
    render()
  }

  const beginNew = () => {
    if (dirty) {
      error.textContent = t('stylesheets.saveFirst')

      return false
    }

    if (!creating) previousFile = file
    let suffix = 2
    file = 'custom.css'

    while (
      Object.keys(view?.stylesheets ?? {}).some(
        (entry) => entry.toLowerCase() === file.toLowerCase(),
      )
    )
      file = `custom-${suffix++}.css`
    css = css || starterCss
    creating = true
    dirty = true
    error.textContent = ''
    feedback.textContent = ''
    render()

    return true
  }

  const check = () => {
    try {
      validateCss?.(css)
      error.textContent = ''
      feedback.textContent = t('stylesheets.valid')

      return true
    } catch (cause) {
      error.textContent =
        cause instanceof Error
          ? `${cause.message}${cause.cause instanceof Error ? `: ${cause.cause.message}` : ''}`
          : String(cause)

      return false
    }
  }

  const submit = (command: EditorCommand) => {
    if (busy || !allowed()) return
    const parsed = commandSchema.safeParse(command)

    if (!parsed.success) {
      error.textContent = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')

      return
    }

    submitted = parsed.data
    error.textContent = ''
    save(parsed.data)
  }

  function render() {
    fields.replaceChildren()

    if (!view?.game) return
    const { select, input, button, create } = controls
    const active = create('p')
    active.textContent = view.game.stylesheet
      ? t('stylesheets.active', { file: view.game.stylesheet })
      : t('stylesheets.builtin')
    const help = create('p')
    help.className = 'help'
    help.textContent = t('stylesheets.help')

    const picker = select(
      t('stylesheets.saved'),
      creating ? '' : file,
      [['', t('stylesheets.new')], ...Object.keys(view.stylesheets ?? {})],
      (value) => {
        if (!value) {
          if (!beginNew()) picker.querySelector('select')!.value = creating ? '' : file

          return
        }

        if (dirty) {
          error.textContent = t('stylesheets.saveFirst')
          picker.querySelector('select')!.value = creating ? '' : file

          return
        }

        file = value
        reset()
      },
      false,
    )

    const identity = input(t('stylesheets.path'), file, (value) => {
      if (creating) file = value.trim()
    })

    identity.querySelector('input')!.readOnly = !creating
    const text = create('textarea')
    text.rows = 22
    text.value = css
    text.spellcheck = false
    text.className = 'stylesheet-source'
    text.addEventListener('input', () => {
      css = text.value
      controls.markEdited()
    })
    const label = create('label')
    label.className = 'stylesheet-source-field'
    label.append(t('stylesheets.source'), text)
    const form = create('form')
    form.className = 'stylesheet-editor-form'
    const saveButton = create('button')
    saveButton.type = 'submit'
    saveButton.textContent = t('stylesheets.save')
    const assignment = create('div')
    assignment.className = 'stylesheet-assignment'
    assignment.append(
      active,
      button(
        t('stylesheets.assign'),
        () => {
          if (dirty) {
            error.textContent = t('stylesheets.saveFirst')

            return
          }

          if (check()) submit({ type: 'game.assignStylesheet', file })
        },
        creating || view.game.stylesheet === file,
      ),
      button(
        t('stylesheets.detach'),
        () => {
          if (dirty) {
            error.textContent = t('stylesheets.saveFirst')

            return
          }

          submit({ type: 'game.assignStylesheet', file: null })
        },
        !view.game.stylesheet,
      ),
    )
    form.append(
      saveBar(
        document,
        saveButton,
        saveStatus(document, t, () => dirty),
        button(t('stylesheets.discard'), () => {
          if (creating) file = previousFile
          reset()
        }),
      ),
      assignment,
      picker,
      button(t('stylesheets.new'), beginNew),
      identity,
      label,
      button(t('stylesheets.check'), check),
      help,
      feedback,
    )
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (busy || !check()) return

      if (
        creating &&
        Object.keys(view?.stylesheets ?? {}).some(
          (entry) => entry.toLowerCase() === file.toLowerCase(),
        )
      ) {
        error.textContent = t('stylesheets.duplicate')

        return
      }

      submit({ type: 'game.upsertStylesheet', file, css, createOnly: creating, assign: false })
    })
    fields.append(form)
    fields.disabled = busy || !allowed()
  }

  registerEditorDraft(
    root,
    'stylesheet',
    z.object({
      file: z.string(),
      previousFile: z.string(),
      css: z.string(),
      creating: z.boolean(),
    }),
    () => (dirty ? { file, previousFile, css, creating } : undefined),
    (saved) => {
      previousFile = saved.previousFile
      file = saved.file
      css = saved.css
      creating = saved.creating
      dirty = true
      render()
    },
  )

  return {
    selectedFile: () => (creating ? undefined : file),
    hasDrafts: () => dirty,
    draftLocations: () => [{ key: creating ? 'stylesheet-new' : 'stylesheet:' + file }],
    canNavigate: (next?: string, create = false) =>
      create ? creating || !dirty : !next || next === file || !dirty,
    navigate(next?: string, create = false) {
      if (create) {
        if (creating && dirty) return true

        return beginNew()
      }

      if (!next || next === file) return true

      if (dirty) {
        error.textContent = t('stylesheets.saveFirst')

        return false
      }

      file = next
      reset()

      return true
    },
    render(state: ProjectEditorState, replace: boolean) {
      const projectChanged = path !== state.path
      const changed = view !== state.view
      const languageChanged = language !== t('stylesheets.heading')
      language = t('stylesheets.heading')
      path = state.path
      view = state.view
      busy = state.busy

      const saved =
        submitted && replace && !busy && !state.error && state.lastCommand === submitted.type

      if (saved && submitted?.type === 'game.upsertStylesheet') file = submitted.file

      if (!busy) submitted = undefined

      if (projectChanged) {
        file = ''
        previousFile = ''
      }

      if (projectChanged || saved || (replace && !state.preserveDrafts) || (changed && !dirty))
        reset()
      else if (changed || languageChanged) render()
      fields.disabled = busy || !view?.game || !allowed()
    },
  }
}
