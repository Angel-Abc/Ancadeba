import {
  characterProfileSchema,
  graphicAppearanceSchema,
  type CharacterProfileDefinition,
} from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import {
  entryEditor,
  fieldPath,
  focusIssue,
  rememberEntryFocus,
  type EntrySelections,
} from './specialistEntries.js'
import { inspectorTranslations } from './inspectorTranslations.js'
import { graphicAppearanceForm } from './graphicAppearanceForm.js'
import { choicePicker, formLabel } from './formElements.js'
import { ruleFormControls } from './ruleFormControls.js'

export function bindCharacterProfileForm(
  root: HTMLElement,
  document: Document,
  t: Translate,
  edited: () => void,
  openKey?: (key: string) => void,
) {
  const localized = inspectorTranslations(ruleFormControls(document, edited, t), openKey)
  const controls = localized.controls
  let entries: EntrySelections = {}
  const appearanceEntry = { graphicSlot: '', graphicColor: '' }
  const { button, group, select } = controls
  let view: ProjectView | undefined
  let draft: CharacterProfileDefinition | null = null

  const change = (operation: () => void) => {
    operation()
    edited()
    render()
  }

  function render() {
    const restoreFocus = rememberEntryFocus(root)
    const profile = draft
    root.replaceChildren(
      select(
        t('character.profile'),
        profile ? 'enabled' : '',
        [
          ['', t('form.none')],
          ['enabled', t('character.enabled')],
        ],
        (next) =>
          change(() => {
            draft = next
              ? {
                  fields: [],
                  portrait: { visual: '', appearance: graphicAppearanceSchema.parse({}) },
                }
              : null
          }),
      ),
    )

    if (!profile || !view) return
    const current = view
    const catalog = view.assets

    const visuals = catalog
      ? [
          ...Object.keys(catalog.images),
          ...Object.keys(catalog.parts),
          ...Object.keys(catalog.compositions),
        ]
      : []

    const available = Object.keys(view.choices ?? {}).find((id) => !profile.fields.includes(id))

    const addField = () =>
      fieldPath(
        button(
          t('rules.addField'),
          () =>
            change(() => {
              if (available) {
                entries.fields = profile.fields.length
                profile.fields.push(available)
              }
            }),
          !available,
        ),
        'fields',
      )

    const fields = entryEditor(
      controls,
      entries,
      'fields',
      t('character.fieldPicker'),
      profile.fields,
      (id) => (current.choices?.[id] ? formLabel(current, current.choices[id]!) : id),
      (id, index) =>
        fieldPath(
          choicePicker(controls, current, id, (value) =>
            change(() => {
              profile.fields[index] = value
            }),
          ),
          'fields',
          index,
        ),
      {
        path: ['fields'],
        actions: (_, index) => {
          const move = (offset: number) =>
            change(() => {
              const [id] = profile.fields.splice(index, 1)
              profile.fields.splice(index + offset, 0, id!)
              entries.fields = index + offset
            })

          return group(
            t('forms.selectedElement'),
            addField(),
            button(t('rules.moveUp'), () => move(-1), index === 0),
            button(t('rules.moveDown'), () => move(1), index === profile.fields.length - 1),
            button(t('rules.removeField'), () =>
              change(() => {
                profile.fields.splice(index, 1)
              }),
            ),
          )
        },
      },
    )

    if (!Object.keys(view.choices ?? {}).length) {
      const message = controls.create('p')
      message.textContent = t('choices.empty')
      root.append(message)
    }

    root.append(profile.fields.length ? fields : addField())

    const portrait = fieldPath(
      controls.fold(
        'portrait',
        t('form.portrait'),
        false,
        fieldPath(
          select(t('form.portrait'), profile.portrait.visual, ['', ...visuals], (next) =>
            change(() => {
              profile.portrait.visual = next
              profile.portrait.appearance = graphicAppearanceSchema.parse({})
            }),
          ),
          'portrait',
          'visual',
        ),
      ),
      'portrait',
    )

    if (catalog && visuals.includes(profile.portrait.visual))
      portrait.append(
        fieldPath(
          graphicAppearanceForm(
            controls,
            current,
            catalog,
            profile.portrait.visual,
            profile.portrait.appearance,
            true,
            change,
            edited,
            appearanceEntry,
            render,
          ),
          'portrait',
          'appearance',
        ),
      )
    root.append(portrait)
    restoreFocus?.()
  }

  return {
    render(next: ProjectView, replace: boolean) {
      view = next

      if (replace) draft = structuredClone(next.game?.characterProfile ?? null)
      render()
    },
    snapshot: () => JSON.stringify(draft),
    entries: () => entries,
    appearanceEntry,
    clearSelection: () => {
      entries = {}
      appearanceEntry.graphicSlot = ''
      appearanceEntry.graphicColor = ''
    },
    focusIssue: (path: PropertyKey[]) => focusIssue(root, path),
    restore(saved: string, selection?: EntrySelections) {
      entries = selection ?? {}
      draft = JSON.parse(saved)
      render()
    },
    read: () => characterProfileSchema.nullable().safeParse(draft),
  }
}
