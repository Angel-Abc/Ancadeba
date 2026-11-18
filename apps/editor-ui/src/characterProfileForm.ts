import {
  characterProfileSchema,
  graphicAppearanceSchema,
  ruleStateType,
  type CharacterProfileDefinition,
} from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import { graphicAppearanceForm } from './graphicAppearanceForm.js'
import { ruleFormControls, statePath, translationChoices } from './ruleFormControls.js'

export function bindCharacterProfileForm(
  root: HTMLElement,
  document: Document,
  t: Translate,
  edited: () => void,
) {
  const controls = ruleFormControls(document, edited, t)
  const { button, group, input, select, translation } = controls
  let view: ProjectView | undefined
  let draft: CharacterProfileDefinition | null = null

  const change = (operation: () => void) => {
    operation()
    edited()
    render()
  }

  function render() {
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

    root.append(
      select(t('form.portrait'), profile.portrait.visual, ['', ...visuals], (next) =>
        change(() => {
          profile.portrait.visual = next
          profile.portrait.appearance = graphicAppearanceSchema.parse({})
        }),
      ),
    )

    if (catalog && visuals.includes(profile.portrait.visual))
      root.append(
        graphicAppearanceForm(
          controls,
          view,
          catalog,
          profile.portrait.visual,
          profile.portrait.appearance,
          true,
          change,
          edited,
        ),
      )

    for (const [index, field] of profile.fields.entries()) {
      const move = (offset: number) =>
        change(() => {
          profile.fields.splice(index, 1)
          profile.fields.splice(index + offset, 0, field)
        })

      const section = group(
        t('rules.field', { number: index + 1 }),
        input(t('component.id'), field.id, (value) => {
          field.id = value.trim()
        }),
        input(t('form.label'), field.label, (value) => {
          field.label = value
        }),
        translation(t('status.titleTranslation'), field.labelKey ?? '', keys, (value) => {
          field.labelKey = value || undefined
        }),
        select(
          t('form.stateField'),
          statePath(field.path),
          ['', ...paths.map(({ path }) => statePath(path))],
          (value) => {
            field.path = paths.find(({ path }) => statePath(path) === value)?.path.slice() ?? []
          },
        ),
      )

      for (const [optionIndex, option] of field.options.entries()) {
        section.append(
          group(
            t('character.option', { number: optionIndex + 1 }),
            input(t('component.id'), option.id, (value) => {
              if (field.default === option.id) field.default = value.trim()
              option.id = value.trim()
            }),
            input(t('form.label'), option.label, (value) => {
              option.label = value
            }),
            translation(t('status.titleTranslation'), option.labelKey ?? '', keys, (value) => {
              option.labelKey = value || undefined
            }),
            button(
              t(field.default === option.id ? 'character.defaultOption' : 'character.makeDefault'),
              () =>
                change(() => {
                  field.default = option.id
                }),
              field.default === option.id,
            ),
            button(t('character.removeOption'), () =>
              change(() => {
                field.options.splice(optionIndex, 1)

                if (field.default === option.id) field.default = field.options[0]?.id ?? ''
              }),
            ),
          ),
        )
      }

      section.append(
        button(t('character.addOption'), () =>
          change(() => {
            field.options.push({ id: '', label: '' })
          }),
        ),
        button(t('rules.moveUp'), () => move(-1), index === 0),
        button(t('rules.moveDown'), () => move(1), index === profile.fields.length - 1),
        button(t('rules.removeField'), () =>
          change(() => {
            profile.fields.splice(index, 1)
          }),
        ),
      )
      root.append(section)
    }

    root.append(
      button(t('rules.addField'), () =>
        change(() => {
          profile.fields.push({
            id: '',
            label: '',
            path: [],
            options: [{ id: '', label: '' }],
            default: '',
          })
        }),
      ),
    )
  }

  return {
    render(next: ProjectView, replace: boolean) {
      view = next

      if (replace) draft = structuredClone(next.game?.characterProfile ?? null)
      render()
    },
    snapshot: () => JSON.stringify(draft),
    restore(saved: string) {
      draft = JSON.parse(saved)
      render()
    },
    read: () => characterProfileSchema.nullable().safeParse(draft),
  }
}
