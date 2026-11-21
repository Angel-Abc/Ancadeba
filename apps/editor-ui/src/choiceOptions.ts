import type { ChoiceDefinition } from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import { formLabel, formWording } from './formElements.js'
import { fieldPath } from './specialistEntries.js'
import type { RuleFormControls } from './ruleFormControls.js'

export function choiceOptions(
  c: RuleFormControls,
  view: ProjectView,
  element: ChoiceDefinition,
  selection: { option: number },
  redraw: () => void,
) {
  const { t } = c
  const box = c.group(t('choices.options'))
  box.setAttribute('data-entry-key', 'choice-options')
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
  const defaultField = fieldPath(c.create('label'), 'default')
  defaultField.append(t('forms.default'), defaultControl)

  const optionPicker = c.select(
    t('forms.option'),
    String(selection.option),
    options.map((o, i) => [String(i), formLabel(view, o) || o.id || t('forms.option')] as const),
    (v) => {
      selection.option = Number(v)
      redraw()
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
    redraw()
  })

  optionPicker.hidden = !options.length
  box.append(defaultField, optionPicker, fieldPath(add, 'options'))

  if (selected) {
    const optionPath = ['options', selection.option]

    const optionFields = c.group(
      t('forms.option'),
      c.button(t('forms.removeOption'), () => {
        options.splice(selection.option, 1)
        selection.option = Math.max(0, Math.min(selection.option, options.length - 1))

        if (element.default === selected.id) element.default = options[selection.option]?.id ?? ''
        c.markEdited()
        redraw()
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

  return box
}
