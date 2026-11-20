import { graphicAppearanceSchema, ruleStateType, type FormElement } from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import { graphicAppearanceForm } from './graphicAppearanceForm.js'
import { fieldPath } from './specialistEntries.js'
import { translationChoices, type RuleFormControls } from './ruleFormControls.js'

export const formKinds = [
  'choice',
  'text',
  'number',
  'checkbox',
  'graphic',
  'profile-field',
  'portrait',
] as const

type Wording = { label: string; labelKey?: string | undefined }

export function formLabel(view: ProjectView, entry: Wording) {
  return (entry.labelKey && view.translations?.[entry.labelKey]) || entry.label
}

export function elementName(view: ProjectView, t: Translate, element: FormElement) {
  if ('label' in element) return formLabel(view, element) || t(`forms.${element.type}`)

  if (element.type === 'profile-field') {
    const field = view.game?.characterProfile?.fields.find(({ id }) => id === element.field)

    return (field && formLabel(view, field)) || element.field || t('forms.profile-field')
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

  if (kind === 'profile-field')
    return { type: kind, field: view.game?.characterProfile?.fields[0]?.id ?? '' }
  const type = kind === 'number' ? 'number' : kind === 'checkbox' ? 'boolean' : 'string'
  const field = view.rules?.state.find((entry) => ruleStateType(entry) === type)
  const common = { label: field?.path.at(-1) ?? t('form.label'), path: field?.path.slice() ?? [] }

  if (kind === 'choice')
    return {
      ...common,
      type: kind,
      default: 'option',
      options: [{ id: 'option', label: t('forms.option') }],
    }

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
  selection: { option: number },
  numberText: WeakMap<FormElement, string>,
  redraw: (focus?: string) => void,
) {
  const { t } = c
  const box = fieldPath(c.group(elementName(view, t, element)), ...path)

  if (element.type === 'profile-field') {
    box.append(
      fieldPath(
        c.select(
          t('forms.profile-field'),
          element.field,
          view.game?.characterProfile?.fields.map((f) => [f.id, formLabel(view, f)] as const) ?? [],
          (value) => {
            element.field = value
          },
        ),
        ...path,
        'field',
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

    if (element.type === 'choice') {
      const options = element.options
      selection.option = Math.max(0, Math.min(selection.option, options.length - 1))
      const selected = options[selection.option]
      const defaultControl = c.create('select')

      for (const option of options) {
        const item = c.create('option')
        item.value = option.id
        item.textContent = formLabel(view, option) || option.id
        defaultControl.append(item)
      }

      defaultControl.value = element.default
      defaultControl.addEventListener('change', () => {
        if (!options.some((option) => option.id === defaultControl.value)) return
        element.default = defaultControl.value
        c.markEdited()
      })
      const defaultField = fieldPath(c.create('label'), ...path, 'default')
      defaultField.append(t('forms.default'), defaultControl)

      const optionPicker = c.select(
        t('forms.option'),
        String(selection.option),
        options.map(
          (o, i) => [String(i), formLabel(view, o) || o.id || t('forms.option')] as const,
        ),
        (v) => {
          selection.option = Number(v)
          redraw('option')
        },
        false,
      )

      optionPicker.setAttribute('data-form-control', 'option')

      const add = c.button(t('forms.addOption'), () => {
        let id = 'option'
        let suffix = 2

        while (options.some((o) => o.id === id)) id = 'option-' + suffix++
        options.push({ id, label: t('forms.option') })

        if (options.length === 1) element.default = id
        selection.option = options.length - 1
        c.markEdited()
        redraw('option')
      })

      optionPicker.hidden = !options.length
      box.append(defaultField, optionPicker, fieldPath(add, ...path, 'options'))

      if (selected) {
        const optionPath = [...path, 'options', selection.option]

        const optionFields = c.group(
          t('forms.option'),
          c.button(t('forms.removeOption'), () => {
            options.splice(selection.option, 1)
            selection.option = Math.max(0, Math.min(selection.option, options.length - 1))

            if (element.default === selected.id)
              element.default = options[selection.option]?.id ?? ''
            c.markEdited()
            redraw('option')
          }),
          fieldPath(
            c.input(t('forms.optionId'), selected.id, (v) => {
              if (element.default === selected.id) element.default = v
              selected.id = v
            }),
            ...optionPath,
            'id',
          ),
          ...formWording(c, view, selected, optionPath, true),
        )

        box.append(optionFields)

        const sync = () => {
          const picker = optionPicker.querySelector('select')!
          const defaults = defaultField.querySelector('select')!
          const option = picker.options?.[selection.option]
          const initial = defaults.options?.[selection.option]
          const name = formLabel(view, selected) || selected.id || t('forms.option')

          if (option) option.textContent = name

          if (initial) {
            initial.textContent = name
            initial.value = selected.id
          }

          defaults.value = element.default
        }

        optionFields.addEventListener('input', sync)
      }
    } else if (element.type === 'checkbox')
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
