import type { EditorCommand, ProjectView } from '@ancadeba/editor-core'
import {
  characterForm,
  formFile,
  formSchema,
  type FormDefinition,
  type FormElement,
} from '@ancadeba/schemas'
import type { Translate } from '@ancadeba/utilities'
import { z } from 'zod'
import type { ProjectEditorState } from './projectController.js'
import type { ProjectPanelDependencies } from './projectPanelDependencies.js'
import type { ConfirmAction } from './editorConfirmation.js'
import { registerEditorDraft } from './editorDraftState.js'
import { inspectorTranslations } from './inspectorTranslations.js'
import { fieldPath, focusIssue } from './specialistEntries.js'
import { saveStatus } from './formSaveStatus.js'
import { languageWatcher, ruleFormControls, saveBar } from './ruleFormControls.js'
import { sceneTitle } from './projectTree.js'
import {
  elementName,
  formElementFields,
  formKinds,
  formLabel,
  formNumberValue,
  formWording,
} from './formElements.js'
import { firstFormSelection, formLayoutEditor, type FormElementPicker } from './formLayoutEditor.js'
import { formPlayerPreview } from './formPlayerPreview.js'

interface FormNavigation {
  key(): string
  select(key: string): void
  create(): void
  cancel(origin: string): void
  created(id: string, label: string): void
  openKey(key: string): void
  openPlacement(scene: string, id: string): void
  confirm: ConfirmAction
}

const placementSchema = z.object({ scene: z.string(), component: z.string() })

const selectionSchema = z.object({
  row: z.number(),
  column: z.number(),
  element: z.number(),
  option: z.number(),
})

export function bindFormLibrary(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate,
  createGraphics: ProjectPanelDependencies['createGraphics'],
  navigation?: FormNavigation,
) {
  const document = root.ownerDocument
  const previewRoot = document.createElement('div')
  previewRoot.setAttribute('data-draft-exclude', '')
  const preview = formPlayerPreview(previewRoot, t, createGraphics)
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')
  let view: ProjectView | undefined
  let projectPath: string | undefined
  let draft: FormDefinition | undefined
  let original: string | undefined
  let returnKey = 'form-library'
  let placement: z.infer<typeof placementSchema> | undefined
  let selection = firstFormSelection()
  const numberText = new WeakMap<FormElement, string>()
  const adding: FormElementPicker = { kind: 'text' }
  let preset = false
  let dirty = false
  let saving = false
  let busy = false
  let previewing = false
  let message = ''
  let invalidControl: Element | undefined
  let updateNames: (() => void) | undefined
  const languageChanged = languageWatcher(t)

  function showPreview() {
    if (!draft || !view || root.hidden) return

    const component = view.scenes
      .find((s) => s.id === placement?.scene)
      ?.components.find((c) => c.id === placement?.component)

    preview.show(
      view,
      draft,
      projectPath ?? '',
      component?.type === 'form' && component.form === draft.id ? component : undefined,
    )
  }

  const base = ruleFormControls(
    document,
    () => {
      dirty = true
      message = ''
      error.hidden = true
      invalidControl?.removeAttribute('aria-invalid')
      invalidControl?.removeAttribute('aria-describedby')
      invalidControl = undefined

      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-form-new]'))
        button.disabled = true
      updateNames?.()
      showPreview()
    },
    t,
  )

  const translated = inspectorTranslations(base, navigation && ((key) => navigation.openKey(key)))
  const c = translated.controls

  function reset(form?: FormDefinition) {
    original = form?.id
    draft = form && structuredClone(form)
    selection = firstFormSelection(draft)
    dirty = false
    previewing = false
    message = ''
    adding.kind = 'text'
    placement = undefined
    preview.reset()
  }

  function open(id?: string, key?: string) {
    if (dirty) return

    if (id === original && Boolean(id) === Boolean(draft)) {
      if (key && key !== navigation?.key() && (placement || previewing)) {
        placement = undefined
        previewing = false
        draw()
      }

      return
    }

    reset(id ? view?.forms?.[id] : undefined)
    draw()
  }

  function start() {
    if (!view || dirty) return
    const origin = navigation?.key()
    returnKey =
      origin && (origin.startsWith('form:') || origin.startsWith('data-file:forms:'))
        ? origin
        : 'form-library'
    const profile = view.game?.characterProfile
    const baseId = preset && profile ? 'character' : 'form'
    let id = baseId
    let n = 2

    while (view.forms?.[id]) id = baseId + '-' + n++
    reset()
    draft =
      preset && profile
        ? characterForm(id, profile)
        : { 'schema-version': '1.0.0', id, label: t('forms.new'), rows: [] }
    preset = false
    selection = firstFormSelection(draft)
    dirty = true
    draw('identity')
  }

  function requestNew(useProfile: boolean) {
    if (dirty || busy) return
    preset = useProfile

    if (navigation) navigation.create()
    else start()
    preset = false
  }

  function cancel() {
    if (busy) return
    reset()
    draw()
    navigation?.cancel(returnKey)
  }

  function discard() {
    if (!original || busy) return
    const context = placement
    reset(view?.forms?.[original])
    placement = context
    draw('entry')
  }

  function validationMessage(path: PropertyKey[], kind?: string) {
    const key = path.at(-1)

    if (key === 'id') return t('forms.invalidId')

    if (key === 'field' || path.includes('path')) return t('forms.invalidBinding')

    if (key === 'default') return t('forms.invalidDefault')

    if (key === 'visual' || path.includes('appearance')) return t('forms.invalidGraphic')

    if (kind === 'portrait') return t('forms.invalidPortrait')

    if (typeof key === 'string' && key.endsWith('Key')) return t('forms.invalidKey')

    if (key === 'options') return t('forms.invalidOption')

    return t('forms.invalidWording')
  }

  function showIssue(
    path: readonly PropertyKey[],
    reason: 'local' | 'project' | 'exists' = 'local',
  ) {
    const location = [...path]
    let kind: string | undefined

    const r = Number(path[1]),
      col = Number(path[2]),
      i = Number(path[3])

    if (path[0] === 'rows' && draft?.rows[r]?.[col]?.[i]) {
      const element = draft.rows[r]![col]![i]!
      kind = element.type
      Object.assign(selection, {
        row: r,
        column: col,
        element: i,
        option: path[4] === 'options' && typeof path[5] === 'number' ? path[5] : 0,
      })

      if (
        element.type === 'choice' &&
        !element.options.length &&
        (path[4] === 'default' || path[4] === 'options')
      ) {
        location.splice(4, location.length - 4, 'options')
      }

      if (path.length === 4) {
        if (element.type === 'choice' && reason === 'local') {
          const duplicate = element.options.findIndex(
            (o, n) => element.options.findIndex((v) => v.id === o.id) !== n,
          )

          if (duplicate >= 0) {
            selection.option = duplicate
            location.push('options', duplicate, 'id')
          } else location.push('default')
        } else if (kind === 'profile-field') location.push('field')
        else if (kind === 'graphic') location.push('visual')
        else if (kind !== 'portrait') location.push('path')
      }
    }

    message = reason === 'exists' ? t('forms.exists') : validationMessage(location, kind)
    previewing = false
    draw()

    if (kind === 'portrait') focus('entry')
    else focusIssue(root, location)
    const input = document.activeElement

    if (input && root.contains?.(input)) {
      invalidControl = input
      input.setAttribute('aria-invalid', 'true')
      input.setAttribute('aria-describedby', error.id)
    }
  }

  function submit() {
    if (!draft || busy || saving) return
    const parsed = formSchema.safeParse(draft)

    if (!parsed.success) {
      showIssue(parsed.error.issues[0]!.path)

      return
    }

    if (!original && view?.forms?.[draft.id]) {
      showIssue(['id'], 'exists')

      return
    }

    saving = true
    save({ type: 'game.upsertForm', form: parsed.data })
  }

  function focus(name: string) {
    if (name === 'entry') {
      const picker = root.querySelector<HTMLElement>('.form-element-picker select')

      if (picker?.getClientRects?.().length) picker.focus()
      else
        root
          .querySelector<HTMLElement>(
            '.form-outline [aria-pressed="true"],[data-form-control="first"]',
          )
          ?.focus?.()
    } else {
      root
        .querySelector<HTMLElement>(
          `[data-form-control="${name}"] input,[data-form-control="${name}"] select,button[data-form-control="${name}"]`,
        )
        ?.focus?.()
    }
  }

  function draw(focusName?: string) {
    const active = document.activeElement

    const activePath =
      !focusName &&
      active &&
      !root.hidden &&
      root.contains?.(active) &&
      active.matches?.('input,select,textarea')
        ? active.closest('[data-model-path]')?.getAttribute('data-model-path')
        : undefined

    updateNames = undefined
    error.id = 'form-library-error'
    error.textContent = message
    error.hidden = !message
    const form = draft
    const project = view
    root.replaceChildren()

    if (!project) return

    const buttons = () =>
      ['forms.blank', 'forms.preset'].map((key) => {
        const useProfile = key === 'forms.preset'

        const button = c.button(
          t(key),
          () => requestNew(useProfile),
          busy || dirty || (useProfile && !project.game?.characterProfile),
        )

        button.setAttribute('data-form-new', '')
        button.setAttribute('data-inspector-link', key)

        return button
      })

    if (!form) {
      root.append(...buttons())

      for (const entry of Object.values(project.forms ?? {})) {
        const button = c.button(formLabel(project, entry), () =>
          navigation ? navigation.select('form:' + entry.id) : open(entry.id),
        )

        root.append(button)
      }

      return
    }

    const bar = saveBar(
      document,
      c.button(t(original ? 'forms.save' : 'forms.create'), submit, busy),
      saveStatus(document, t, () => dirty),
      c.button(
        t(original ? 'form.discardChanges' : 'component.cancel'),
        original ? discard : cancel,
        busy,
      ),
    )

    const shell = c.create('div')
    shell.className = 'form-workspace'
    shell.setAttribute('data-view', previewing ? 'preview' : 'edit')
    const switches = c.create('div')
    switches.className = 'form-view-switch specialist-views preview-actions'
    switches.setAttribute('role', 'group')
    switches.setAttribute('aria-label', t('specialist.view'))

    function setView(next: boolean) {
      previewing = next
      shell.setAttribute('data-view', next ? 'preview' : 'edit')
      edit.setAttribute('aria-pressed', String(!next))
      player.setAttribute('aria-pressed', String(next))
    }

    const edit = c.button(t('layout.edit'), () => setView(false))
    const player = c.button(t('forms.preview'), () => setView(true))
    switches.append(edit, player)
    setView(previewing)

    const layout = formLayoutEditor(
      c,
      project,
      form,
      selection,
      adding,
      draw,
      navigation?.confirm,
      () => !busy && draft === form,
    )

    const body = c.create('fieldset')
    body.className = 'form-author'
    body.disabled = busy

    const identity = fieldPath(
      c.input(t('forms.id'), form.id, (v) => {
        form.id = v
      }),
      'id',
    )

    identity.setAttribute('data-form-control', 'identity')
    identity.querySelector('input')!.readOnly = Boolean(original)

    const metadata = c.fold(
      original ? 'form-metadata' : 'form-create-metadata',
      t('forms.settings'),
      !original,
      identity,
      ...formWording(c, project, form, []),
    )

    if (!original) body.append(metadata)
    const element = form.rows[selection.row]?.[selection.column]?.[selection.element]

    if (form.rows.length) body.append(layout.picker)

    if (element) {
      const field = formElementFields(
        c,
        project,
        element,
        ['rows', selection.row, selection.column, selection.element],
        selection,
        numberText,
        draw,
      )

      body.append(field)
      updateNames = () => {
        layout.updateName()
        const legend = field.children[0]

        if (legend) legend.textContent = elementName(project, t, element)
      }
    }

    if (!element) body.append(layout.addTools)

    if (form.rows.length)
      body.append(
        c.fold(
          'form-layout',
          t('forms.structure'),
          false,
          ...(element ? [layout.addTools] : []),
          layout.actions,
        ),
      )

    if (original) body.append(metadata)

    if (original) {
      const links = project.scenes.flatMap((scene) =>
        scene.components.flatMap((component) => {
          if (component.type !== 'form' || component.form !== original) return []

          const button = c.button(sceneTitle(project, scene) + ' · ' + component.id, () =>
            navigation?.openPlacement(scene.id, component.id),
          )

          button.setAttribute('data-inspector-link', 'component/' + scene.id + '/' + component.id)

          return [button]
        }),
      )

      if (links.length) body.append(c.fold('form-uses', t('forms.usedIn'), false, ...links))
      body.append(c.fold('form-new-actions', t('forms.new'), false, ...buttons()))
    }

    translated.arrange(body)
    const playerBox = c.create('section')
    playerBox.className = 'form-player'
    const heading = c.create('h4')
    heading.textContent = t('forms.preview')
    playerBox.append(heading, previewRoot)
    shell.append(switches, layout.outline, body, playerBox)
    root.append(bar, error, shell)
    showPreview()

    if (focusName) focus(focusName)
    else if (activePath && !busy && !message) focusIssue(root, JSON.parse(activePath))
  }

  registerEditorDraft(
    root,
    'form-library',
    z.object({
      form: formSchema,
      original: z.string().optional(),
      returnKey: z.string(),
      selection: selectionSchema,
      kind: z.enum(formKinds),
      previewing: z.boolean(),
      placement: placementSchema.optional(),
      numbers: z.array(z.tuple([z.number(), z.number(), z.number(), z.string()])),
    }),
    () => {
      if (!draft || !dirty) return undefined
      const editing = draft
      const form = structuredClone(editing)
      const numbers: [number, number, number, string][] = []
      form.rows.forEach((row, r) =>
        row.forEach((column, col) =>
          column.forEach((e, i) => {
            if (e.type !== 'number') return
            const raw = numberText.get(editing.rows[r]![col]![i]!)

            if (raw !== undefined) numbers.push([r, col, i, raw])

            if (!Number.isFinite(e.default)) e.default = 0
          }),
        ),
      )

      return {
        form,
        original,
        returnKey,
        selection,
        kind: adding.kind,
        previewing,
        placement,
        numbers,
      }
    },
    (saved) => {
      original = saved.original
      draft = saved.form

      for (const [r, col, i, raw] of saved.numbers) {
        const e = draft.rows[r]?.[col]?.[i]

        if (e?.type === 'number') {
          numberText.set(e, raw)
          e.default = formNumberValue(raw)
        }
      }

      returnKey = saved.returnKey
      selection = saved.selection
      adding.kind = saved.kind
      placement = saved.placement
      previewing = saved.previewing
      dirty = true
      saving = false
      message = ''
      draw()
    },
    'form-workspace-v1',
  )

  return {
    open,
    start,
    placementLabel(id: string, component?: string) {
      const scene = view?.scenes.find((s) => s.id === id)

      return [scene && view ? sceneTitle(view, scene) : id, component].filter(Boolean).join(' · ')
    },
    fromScene(scene: string, component: string) {
      placement = { scene, component }
      showPreview()
    },
    rememberSelection() {
      const id = original
      const current = { ...selection }
      const context = placement
      const player = previewing

      return () => {
        if (original !== id) return
        selection = current
        placement = context
        previewing = player
        draw()
      }
    },
    canNavigate: (key?: string) =>
      !dirty || key === undefined || (original ? 'form:' + original : 'form-new') === key,
    hasDrafts: () => dirty,
    setVisible(visible: boolean) {
      if (root.hidden === !visible) return
      root.hidden = !visible

      if (visible) showPreview()
      else preview.hide()
    },
    render(state: ProjectEditorState, replace: boolean) {
      const switched = projectPath !== state.path
      const changed = view !== state.view
      const wasBusy = busy
      const translated = languageChanged()
      projectPath = state.path
      busy = state.busy
      view = state.view

      if (switched) {
        reset()
        saving = false
        preview.dispose()
      }

      if (!busy && saving) {
        saving = false

        if (
          !state.error &&
          state.lastCommand === 'game.upsertForm' &&
          draft &&
          view?.forms?.[draft.id]
        ) {
          const created = !original
          original = draft.id
          dirty = false
          message = ''

          if (created) navigation?.created(original, formLabel(view, draft))
        } else if (state.error) {
          const issue = state.validationIssues?.find((e) => draft && e.file === formFile(draft.id))

          if (issue) {
            showIssue(issue.path, 'project')

            return
          }

          message = state.error
        }
      }

      if (!dirty && original && changed && view?.forms?.[original]) {
        draft = structuredClone(view.forms[original]!)

        if (!draft.rows[selection.row]?.[selection.column]?.[selection.element])
          selection = firstFormSelection(draft)
      }

      if (switched || changed || replace || wasBusy !== busy || translated) draw()
    },
    dispose() {
      preview.dispose()
    },
  }
}
