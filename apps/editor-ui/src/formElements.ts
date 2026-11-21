import { graphicAppearanceSchema, ruleStateType, type FormElement } from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import { graphicAppearanceForm } from './graphicAppearanceForm.js'
import { fieldPath } from './specialistEntries.js'
import { translationChoices, type RuleFormControls } from './ruleFormControls.js'

export const formKinds = ['choice', 'text', 'number', 'checkbox', 'graphic', 'portrait'] as const

type Wording = { label: string; labelKey?: string | undefined }

export function formLabel(view: ProjectView, entry: Wording) {
  return (entry.labelKey && view.translations?.[entry.labelKey]) || entry.label
}

export function choicePicker(
  c: RuleFormControls,
  view: ProjectView,
  id: string,
  update: (id: string) => void,
) {
  const choices = Object.values(view.choices ?? {}).map(
    (choice) => [choice.id, formLabel(view, choice)] as const,
  )

  if (!choices.length) choices.push(['', c.t('choices.empty')])

  return c.select(c.t('choices.libraryChoice'), id, choices, update)
}

export function elementName(view: ProjectView, t: Translate, element: FormElement) {
  if ('label' in element) return formLabel(view, element) || t(`forms.${element.type}`)

  if (element.type === 'choice') {
    const field = view.choices?.[element.choice]

    return (field && formLabel(view, field)) || element.choice || t('forms.choice')
  }

  if (element.type === 'graphic')
    return (
      (element.altKey && view.translations?.[element.altKey]) ||
      element.alt ||
      element.visual ||
      t('forms.graphic')
    )

  return t('forms.portrait')
}

function visuals(view: ProjectView) {
  return [
    ...Object.keys(view.assets?.images ?? {}),
    ...Object.keys(view.assets?.compositions ?? {}),
    ...Object.keys(view.assets?.parts ?? {}),
  ]
}

export function newFormElement(
  view: ProjectView,
  kind: FormElement['type'],
  t: Translate,
): FormElement {
  if (kind === 'portrait') return { type: kind }

  if (kind === 'graphic')
    return {
      type: kind,
      visual: visuals(view)[0] ?? '',
      alt: '',
      appearance: graphicAppearanceSchema.parse({}),
    }

  if (kind === 'choice') return { type: kind, choice: Object.keys(view.choices ?? {})[0] ?? '' }
  const type = kind === 'number' ? 'number' : kind === 'checkbox' ? 'boolean' : 'string'
  const field = view.rules?.state.find((entry) => ruleStateType(entry) === type)
  const common = { label: field?.path.at(-1) ?? t('form.label'), path: field?.path.slice() ?? [] }

  if (kind === 'checkbox') return { ...common, type: kind, default: false }

  if (kind === 'number') return { ...common, type: kind, default: 0 }

  return { ...common, type: kind, default: '' }
}

export function formWording(
  c: RuleFormControls,
  view: ProjectView,
  entry: Wording,
  path: PropertyKey[],
  option = false,
) {
  return [
    fieldPath(
      c.input(c.t(option ? 'forms.optionLabel' : 'form.label'), entry.label, (value) => {
        entry.label = value
      }),
      ...path,
      'label',
    ),
    fieldPath(
      c.translation(
        c.t(option ? 'forms.optionKey' : 'form.labelTranslation'),
        entry.labelKey ?? '',
        translationChoices(view),
        (value) => {
          entry.labelKey = value || undefined
          c.markEdited()
        },
      ),
      ...path,
      'labelKey',
    ),
  ]
}

// A text input retains partial decimal/exponent notation when the browser would clear a number input.
export function formNumberValue(text: string) {
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim()) ? Number(text) : NaN
}

export function formElementFields(
  c: RuleFormControls,
  view: ProjectView,
  element: FormElement,
  path: PropertyKey[],
  numberText: WeakMap<FormElement, string>,
  redraw: (focus?: string) => void,
) {
  const { t } = c
  const box = fieldPath(c.group(elementName(view, t, element)), ...path)

  if (element.type === 'choice') {
    box.append(
      fieldPath(
        choicePicker(c, view, element.choice, (value) => {
          element.choice = value
        }),
        ...path,
        'choice',
      ),
    )
  } else if (element.type === 'graphic') {
    box.append(
      fieldPath(
        c.select(t('forms.graphic'), element.visual, visuals(view), (value) => {
          element.visual = value
          element.appearance = graphicAppearanceSchema.parse({})
          redraw('visual')
        }),
        ...path,
        'visual',
      ),
      fieldPath(
        c.input(t('forms.alt'), element.alt, (v) => {
          element.alt = v
        }),
        ...path,
        'alt',
      ),
      fieldPath(
        c.translation(t('forms.altKey'), element.altKey ?? '', translationChoices(view), (v) => {
          element.altKey = v || undefined
          c.markEdited()
        }),
        ...path,
        'altKey',
      ),
    )
    box.children[1]?.setAttribute('data-form-control', 'visual')

    if (view.assets && element.visual)
      box.append(
        fieldPath(
          graphicAppearanceForm(
            c,
            view,
            view.assets,
            element.visual,
            element.appearance,
            true,
            (operation) => {
              operation()
              c.markEdited()
              redraw()
            },
            c.markEdited,
          ),
          ...path,
          'appearance',
        ),
      )
  } else if ('path' in element) {
    const choices = (view.rules?.state ?? [])
      .filter((f) => ruleStateType(f) === typeof element.default)
      .map((f) => [JSON.stringify(f.path), f.path.join('.')] as const)

    box.append(
      ...formWording(c, view, element, path),
      fieldPath(
        c.select(t('form.stateField'), JSON.stringify(element.path), choices, (v) => {
          element.path = JSON.parse(v)
        }),
        ...path,
        'path',
      ),
    )

    if (element.type === 'checkbox')
      box.append(
        fieldPath(
          c.select(
            t('forms.default'),
            String(element.default),
            [
              ['true', t('forms.checked')],
              ['false', t('forms.unchecked')],
            ],
            (v) => {
              element.default = v === 'true'
            },
          ),
          ...path,
          'default',
        ),
      )
    else if (element.type === 'number') {
      const field = c.input(
        t('forms.default'),
        numberText.get(element) ?? String(element.default),
        (value) => {
          numberText.set(element, value)
          element.default = formNumberValue(value)
        },
      )

      field.querySelector('input')!.inputMode = 'decimal'
      box.append(fieldPath(field, ...path, 'default'))
    } else
      box.append(
        fieldPath(
          c.input(t('forms.default'), element.default, (v) => {
            element.default = v
          }),
          ...path,
          'default',
        ),
      )
  }

  return box
}
