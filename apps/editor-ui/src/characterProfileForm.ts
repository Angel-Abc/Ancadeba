import {
  characterProfileSchema,
  graphicAppearanceSchema,
  ruleStateType,
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
import { ruleFormControls, statePath, translationChoices } from './ruleFormControls.js'

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
  const { button, group, input, select, translation } = controls
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

    const keys = translationChoices(view, t('metadata.literalText'))
    const paths = (view.rules?.state ?? []).filter((field) => ruleStateType(field) === 'string')

    const name = (
      entry: { id: string; label: string; labelKey?: string | undefined },
      fallback: string,
    ) =>
      (entry.labelKey && current.translations?.[entry.labelKey]) ||
      entry.label ||
      entry.id ||
      fallback

    const wording = (
      entry: (typeof profile.fields)[number]['options'][number],
      kind: 'field' | 'option',
      path: (string | number)[],
    ) => {
      const box = controls.create('div')
      box.append(
        fieldPath(
          input(
            t(kind === 'field' ? 'character.fieldLabel' : 'character.optionLabel'),
            entry.label,
            (value) => {
              entry.label = value
            },
          ),
          ...path,
          'label',
        ),
        fieldPath(
          translation(
            t(kind === 'field' ? 'character.fieldTranslation' : 'character.optionTranslation'),
            entry.labelKey ?? '',
            keys,
            (value) => {
              entry.labelKey = value || undefined
            },
          ),
          ...path,
          'labelKey',
        ),
      )
      localized.arrange(box)

      return box
    }

    const addField = () =>
      fieldPath(
        button(t('rules.addField'), () =>
          change(() => {
            entries.fields = profile.fields.length
            profile.fields.push({
              id: '',
              label: '',
              path: [],
              options: [{ id: '', label: '' }],
              default: '',
            })
          }),
        ),
        'fields',
      )

    const fields = entryEditor(
      controls,
      entries,
      'fields',
      t('character.fieldPicker'),
      profile.fields,
      (field, index) => name(field, t('rules.field', { number: index + 1 })),
      (field, index) => {
        const path = ['fields', index]
        const optionsKey = 'options-' + index

        const addOption = () =>
          fieldPath(
            button(t('character.addOption'), () =>
              change(() => {
                entries[optionsKey] = field.options.length
                field.options.push({ id: '', label: '' })
              }),
            ),
            ...path,
            'options',
          )

        const options = entryEditor(
          controls,
          entries,
          optionsKey,
          t('character.optionPicker'),
          field.options,
          (option, i) => name(option, t('character.option', { number: i + 1 })),
          (option, i) => {
            const optionPath = [...path, 'options', i]

            return group(
              name(option, t('character.option', { number: i + 1 })),
              wording(option, 'option', optionPath),
              fieldPath(
                input(t('character.optionId'), option.id, (value) => {
                  if (field.default === option.id) field.default = value.trim()
                  option.id = value.trim()
                }),
                ...optionPath,
                'id',
              ),
            )
          },
          {
            path: [...path, 'options'],
            actions: (option, i) => {
              const group = controls.create('div')
              group.append(
                addOption(),
                fieldPath(
                  button(
                    t(
                      field.default === option.id
                        ? 'character.defaultOption'
                        : 'character.makeDefault',
                    ),
                    () =>
                      change(() => {
                        field.default = option.id
                      }),
                    field.default === option.id,
                  ),
                  ...path,
                  'default',
                ),
                button(t('character.removeOption'), () =>
                  change(() => {
                    field.options.splice(i, 1)

                    if (field.default === option.id) field.default = field.options[0]?.id ?? ''
                  }),
                ),
              )

              return group
            },
          },
        )

        return group(
          name(field, t('rules.field', { number: index + 1 })),
          wording(field, 'field', path),
          fieldPath(
            input(t('character.fieldId'), field.id, (value) => {
              field.id = value.trim()
            }),
            ...path,
            'id',
          ),
          fieldPath(
            select(
              t('form.stateField'),
              statePath(field.path),
              ['', ...paths.map(({ path }) => statePath(path))],
              (value) => {
                field.path = paths.find(({ path }) => statePath(path) === value)?.path.slice() ?? []
              },
            ),
            ...path,
            'path',
          ),
          field.options.length ? options : addOption(),
        )
      },
      {
        path: ['fields'],
        actions: (field, index) => {
          const optionsKey = 'options-' + index

          const move = (offset: number) =>
            change(() => {
              const next = index + offset
              const option = entries[optionsKey] ?? 0
              entries[optionsKey] = entries['options-' + next] ?? 0
              entries['options-' + next] = option
              profile.fields.splice(index, 1)
              profile.fields.splice(next, 0, field)
              entries.fields = next
            })

          const actions = controls.create('div')
          actions.append(
            addField(),
            button(t('rules.moveUp'), () => move(-1), index === 0),
            button(t('rules.moveDown'), () => move(1), index === profile.fields.length - 1),
            button(t('rules.removeField'), () =>
              change(() => {
                profile.fields.splice(index, 1)

                for (let i = index; i < profile.fields.length; i++)
                  entries['options-' + i] = entries['options-' + (i + 1)] ?? 0
                delete entries['options-' + profile.fields.length]
              }),
            ),
          )

          return actions
        },
      },
    )

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
