import type { EditorCommand, ProjectView } from '@ancadeba/editor-core'
import {
  characterForm,
  formSchema,
  graphicAppearanceSchema,
  localizeForm,
  localizeDefinitions,
  ruleStateType,
  type FormDefinition,
  type FormElement,
} from '@ancadeba/schemas'
import { renderForm } from '@ancadeba/ui-components'
import type { Translate } from '@ancadeba/utilities'
import type { ProjectEditorState } from './projectController.js'
import type { ProjectPanelDependencies } from './projectPanelDependencies.js'
import { graphicAppearanceForm } from './graphicAppearanceForm.js'
import { ruleFormControls, translationChoices } from './ruleFormControls.js'

export function bindFormLibrary(
  root: HTMLElement,
  save: (command: EditorCommand) => void,
  t: Translate,
  createGraphics: ProjectPanelDependencies['createGraphics'],
) {
  const document = root.ownerDocument
  const previewRoot = document.createElement('div')
  const error = document.createElement('p')
  error.setAttribute('role', 'alert')
  let view: ProjectView | undefined
  let draft: FormDefinition | undefined
  let original: string | undefined
  let path: string | undefined
  let dirty = false
  let saving = false
  let busy = false
  let preview: ReturnType<typeof renderForm> | undefined
  let graphics: ReturnType<typeof createGraphics> | undefined

  const kinds = [
    'choice',
    'text',
    'number',
    'checkbox',
    'graphic',
    'profile-field',
    'portrait',
  ] as const

  let kind: FormElement['type'] = 'text'

  const edited = () => {
    dirty = true
    showPreview()
  }

  const c = ruleFormControls(document, edited, t)

  const change = (operation: () => void) => {
    operation()
    dirty = true
    draw()
  }

  function showPreview() {
    preview?.dispose()
    preview = undefined
    previewRoot.replaceChildren()

    if (!draft || !view || root.hidden) return

    try {
      const messages = view.translations ?? {}
      const definition = localizeForm(draft, { messages, fallback: messages })

      const profile =
        view.game?.characterProfile &&
        localizeDefinitions(view.game, new Map(), { messages, fallback: messages }).game
          .characterProfile

      if (
        definition.rows
          .flat(2)
          .some((element) => element.type === 'graphic' || element.type === 'portrait')
      )
        graphics ??= createGraphics(path ?? '')
      preview = renderForm(
        {
          type: 'form',
          id: 'preview',
          form: draft.id,
          label: definition.label,
          submitLabel: t('forms.submit'),
          cancelLabel: t('forms.cancel'),
          placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 },
        },
        definition,
        profile,
        { document, assets: view.assets, graphics },
        {
          ...(view.rules && { rules: view.rules }),
          ruleTranslation: { messages, fallback: messages },
        },
      )
      previewRoot.append(preview.element)
    } catch (problem) {
      previewRoot.textContent = problem instanceof Error ? problem.message : String(problem)
    }
  }

  function create(preset: boolean) {
    if (!view || dirty) return
    const profile = view.game?.characterProfile
    const base = preset ? 'character' : 'form'
    let id = base
    let n = 2

    while (view.forms?.[id]) id = base + '-' + n++
    original = undefined
    draft =
      preset && profile
        ? characterForm(id, profile)
        : { 'schema-version': '1.0.0', id, label: t('forms.new'), rows: [] }
    dirty = true
    draw()
  }

  function open(id: string) {
    if (!view || dirty || !view.forms?.[id] || id === original) return
    original = id
    draft = structuredClone(view.forms[id])
    draw()
  }

  function newElement(project: ProjectView): FormElement {
    const profile = project.game?.characterProfile
    const visual = visuals(project)[0] ?? ''

    if (kind === 'portrait') return { type: kind }

    if (kind === 'graphic')
      return { type: kind, visual, alt: '', appearance: graphicAppearanceSchema.parse({}) }

    if (kind === 'profile-field') return { type: kind, field: profile?.fields[0]?.id ?? '' }

    const type =
      kind === 'choice' || kind === 'text' ? 'string' : kind === 'number' ? 'number' : 'boolean'

    const field = project.rules?.state.find((entry) => ruleStateType(entry) === type)
    const common = { label: field?.path.at(-1) ?? t('form.label'), path: field?.path.slice() ?? [] }

    if (kind === 'choice')
      return {
        ...common,
        type: kind,
        default: 'option',
        options: [{ id: 'option', label: t('forms.option') }],
      }

    if (kind === 'number') return { ...common, type: kind, default: 0 }

    if (kind === 'checkbox') return { ...common, type: kind, default: false }

    return { ...common, type: 'text', default: '' }
  }

  function visuals(project: ProjectView) {
    return [
      ...Object.keys(project.assets?.images ?? {}),
      ...Object.keys(project.assets?.compositions ?? {}),
      ...Object.keys(project.assets?.parts ?? {}),
    ]
  }

  function wording(entry: { label: string; labelKey?: string | undefined }, project: ProjectView) {
    return [
      c.input(t('form.label'), entry.label, (v) => {
        entry.label = v
      }),
      c.translation(
        t('form.labelTranslation'),
        entry.labelKey ?? '',
        translationChoices(project),
        (v) => {
          entry.labelKey = v || undefined
          edited()
        },
      ),
    ]
  }

  function elementFields(element: FormElement, project: ProjectView) {
    const box = c.group(t(`forms.${element.type}`))

    if (element.type === 'profile-field') {
      box.append(
        c.select(
          t('forms.profile-field'),
          element.field,
          project.game?.characterProfile?.fields.map((f) => [f.id, f.label] as const) ?? [],
          (v) => {
            element.field = v
          },
        ),
      )
    } else if (element.type === 'graphic') {
      box.append(
        c.select(t('forms.graphic'), element.visual, visuals(project), (v) =>
          change(() => {
            element.visual = v
            element.appearance = graphicAppearanceSchema.parse({})
          }),
        ),
        c.input(t('forms.alt'), element.alt, (v) => {
          element.alt = v
        }),
        c.translation(
          t('form.labelTranslation'),
          element.altKey ?? '',
          translationChoices(project),
          (v) => {
            element.altKey = v || undefined
            edited()
          },
        ),
      )

      if (project.assets && element.visual)
        box.append(
          graphicAppearanceForm(
            c,
            project,
            project.assets,
            element.visual,
            element.appearance,
            true,
            change,
            edited,
          ),
        )
    } else if ('path' in element) {
      const states =
        project.rules?.state.filter((field) => ruleStateType(field) === typeof element.default) ??
        []

      box.append(
        ...wording(element, project),
        c.select(
          t('form.stateField'),
          JSON.stringify(element.path),
          states.map((field) => [JSON.stringify(field.path), field.path.join('.')] as const),
          (v) => {
            element.path = JSON.parse(v)
          },
        ),
      )

      if (element.type === 'checkbox')
        box.append(
          c.select(t('forms.default'), String(element.default), ['true', 'false'], (v) => {
            element.default = v === 'true'
          }),
        )

      if (element.type === 'text')
        box.append(
          c.input(t('forms.default'), element.default, (v) => {
            element.default = v
          }),
        )

      if (element.type === 'number')
        box.append(
          c.input(
            t('forms.default'),
            String(element.default),
            (v) => {
              element.default = v.trim() ? Number(v) : NaN
            },
            'number',
          ),
        )

      if (element.type === 'choice') {
        box.append(
          c.input(t('forms.default'), element.default, (v) => {
            element.default = v
          }),
        )
        element.options.forEach((option, i) =>
          box.append(
            c.group(
              t('forms.option'),
              c.input(t('forms.id'), option.id, (v) => {
                option.id = v
              }),
              ...wording(option, project),
              c.button(t('rules.removeField'), () =>
                change(() => {
                  element.options.splice(i, 1)
                }),
              ),
            ),
          ),
        )
        box.append(
          c.button(t('forms.addOption'), () =>
            change(() => {
              element.options.push({ id: '', label: '' })
            }),
          ),
        )
      }
    }

    return box
  }

  function order<T>(items: T[], index: number) {
    const move = (step: number) =>
      change(() => {
        const [item] = items.splice(index, 1)
        items.splice(index + step, 0, item!)
      })

    return [
      c.button(t('rules.moveUp'), () => move(-1), index === 0),
      c.button(t('rules.moveDown'), () => move(1), index === items.length - 1),
      c.button(t('rules.removeField'), () =>
        change(() => {
          items.splice(index, 1)
        }),
      ),
    ]
  }

  function draw() {
    const project = view
    const form = draft
    error.textContent = ''
    root.replaceChildren(error)

    if (!project) return
    const panel = document.createElement('fieldset')
    panel.disabled = busy
    root.append(panel)
    panel.append(
      c.button(t('forms.blank'), () => create(false), dirty),
      c.button(t('forms.preset'), () => create(true), dirty || !project.game?.characterProfile),
    )

    if (!form) return

    const identity = c.input(t('forms.id'), form.id, (v) => {
      form.id = v
    })

    identity.querySelector('input')!.readOnly = Boolean(original)
    panel.append(
      identity,
      ...wording(form, project),
      c.select(
        t('forms.element'),
        kind,
        kinds.map((k) => [k, t(`forms.${k}`)] as const),
        (v) => {
          kind = v
        },
        false,
      ),
    )

    const locations = form.rows.flatMap((row, r) =>
      row.map((column, col) => ({ key: r + '/' + col, label: r + 1 + ' / ' + (col + 1), column })),
    )

    form.rows.forEach((row, r) => {
      const rowBox = c.group(t('forms.row') + ' ' + (r + 1), ...order(form.rows, r))
      row.forEach((column, col) => {
        const colBox = c.group(t('forms.column') + ' ' + (col + 1), ...order(row, col))
        column.forEach((element, index) => {
          const fields = elementFields(element, project)
          fields.append(
            ...order(column, index),
            c.select(
              t('forms.position'),
              r + '/' + col,
              locations.map((loc) => [loc.key, loc.label] as const),
              (key) =>
                change(() => {
                  column.splice(index, 1)
                  locations.find((loc) => loc.key === key)!.column.push(element)
                }),
            ),
          )
          colBox.append(fields)
        })
        colBox.append(
          c.button(t('forms.addElement'), () => change(() => column.push(newElement(project)))),
        )
        rowBox.append(colBox)
      })
      rowBox.append(c.button(t('forms.addColumn'), () => change(() => row.push([]))))
      panel.append(rowBox)
    })
    panel.append(
      c.button(t('forms.addRow'), () => change(() => form.rows.push([[]]))),
      c.button(t('forms.save'), () => {
        const parsed = formSchema.safeParse(form)

        if (!parsed.success) {
          error.textContent = parsed.error.issues
            .map((issue) => issue.path.join('.') + ' ' + issue.message)
            .join('\n')

          return
        }

        if (!original && project.forms?.[form.id]) {
          error.textContent = t('forms.exists')

          return
        }

        saving = true
        save({ type: 'game.upsertForm', form: parsed.data })
      }),
      c.button(t('forms.discard'), () => {
        dirty = false
        draft =
          original && project.forms?.[original]
            ? structuredClone(project.forms[original])
            : undefined
        draw()
      }),
    )
    root.append(c.group(t('forms.preview'), previewRoot))
    showPreview()
  }

  return {
    open,
    setVisible(visible: boolean) {
      if (root.hidden === !visible) return
      root.hidden = !visible
      showPreview()
    },
    canNavigate: (id?: string) => !dirty || !id || original === id,
    hasDrafts: () => dirty,
    render(state: ProjectEditorState, replace: boolean) {
      const switched = path !== state.path
      path = state.path
      view = state.view
      busy = state.busy

      if (switched) {
        dirty = false
        original = undefined
        draft = undefined
        graphics?.dispose()
        graphics = undefined
      }

      if (!busy && saving) {
        if (
          !state.error &&
          state.lastCommand === 'game.upsertForm' &&
          draft &&
          view?.forms?.[draft.id]
        ) {
          original = draft.id
          dirty = false
        }

        saving = false
      }

      if (!dirty && (switched || replace)) {
        original = original && view?.forms?.[original] ? original : view?.game?.forms?.[0]
        draft =
          original && view?.forms?.[original] ? structuredClone(view.forms[original]) : undefined
      }

      draw()
    },
    dispose() {
      preview?.dispose()
      graphics?.dispose()
    },
  }
}
