import { combatTextSchema, type CombatSource } from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import { fieldPath } from './specialistEntries.js'
import { inspectorTranslations } from './inspectorTranslations.js'
import { translationChoices, type RuleFormControls } from './ruleFormControls.js'

export interface WordingSelection {
  query: string
  code: keyof CombatSource['messages']
  open: boolean
  shown?: boolean | undefined
}

export function combatWordingForm(
  controls: RuleFormControls,
  view: ProjectView,
  draft: CombatSource,
  selection: WordingSelection,
  openKey?: (key: string) => void,
) {
  const { create, t } = controls

  function label(title: string, control: HTMLElement) {
    const field = create('label')
    field.append(title, control)

    return field
  }

  const search = create('input')
  search.type = 'search'
  search.value = selection.query
  search.setAttribute('data-draft-navigation', '')
  const picker = create('select')
  picker.setAttribute('data-draft-navigation', '')
  const entry = create('div')
  const keys = translationChoices(view)
  const codes = combatTextSchema.keyof().options
  const names = (code: WordingSelection['code']) => t(`combat.wording.${code}`)
  const localized = inspectorTranslations(controls, openKey)

  function showEntry() {
    const code = selection.code
    const name = names(code)
    const wording = create('textarea')
    wording.className = 'combat-message-wording'
    wording.rows = 2
    wording.value = draft.messages[code]
    wording.addEventListener('input', () => {
      draft.messages[code] = wording.value
      controls.markEdited()
    })
    entry.replaceChildren(
      fieldPath(label(t('combat.codeText', { code: name }), wording), 'messages', code),
      fieldPath(
        localized.controls.translation(
          t('combat.codeTranslation', { code: name }),
          draft.messageKeys[code] ?? '',
          keys,
          (value) => {
            if (value) draft.messageKeys[code] = value
            else delete draft.messageKeys[code]
          },
        ),
        'messageKeys',
        code,
      ),
    )
    localized.arrange(entry)
  }

  function filter(preserve = false) {
    const query = selection.query.trim().toLocaleLowerCase()

    const matches = codes.filter((code) => {
      const key = draft.messageKeys[code]
      const wording = (key && view.translations?.[key]) || draft.messages[code]

      return [names(code), wording].some((text) => text.toLocaleLowerCase().includes(query))
    })

    if (preserve && selection.shown && !matches.includes(selection.code))
      matches.unshift(selection.code)
    selection.shown = matches.length > 0
    picker.replaceChildren(
      ...matches.map((code) => {
        const option = create('option')
        option.value = code
        option.textContent = names(code)

        return option
      }),
    )
    picker.disabled = !matches.length

    if (!matches.length) {
      entry.textContent = t('tree.noResults')

      return
    }

    if (!matches.includes(selection.code)) selection.code = matches[0]!
    picker.value = selection.code
    showEntry()
  }

  search.addEventListener('input', () => {
    selection.query = search.value
    filter()
  })
  picker.addEventListener('change', () => {
    const code = codes.find((id) => id === picker.value)

    if (code) {
      selection.code = code
      showEntry()
    }
  })
  filter(true)

  const fold = controls.fold(
    'texts',
    t('combat.texts'),
    selection.open,
    label(t('combat.searchWording'), search),
    label(t('combat.message'), picker),
    entry,
  )

  fold.open = selection.open
  fold.addEventListener('toggle', () => {
    selection.open = fold.open
  })

  return fold
}
