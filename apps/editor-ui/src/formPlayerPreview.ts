import type { ProjectView } from '@ancadeba/editor-core'
import {
  formField,
  localizeChoice,
  localizeForm,
  validFormValue,
  type FormDefinition,
  type SceneComponentDefinition,
} from '@ancadeba/schemas'
import { renderForm } from '@ancadeba/ui-components'
import type { Translate } from '@ancadeba/utilities'
import type { ProjectPanelDependencies } from './projectPanelDependencies.js'

export type FormPlacement = Extract<SceneComponentDefinition, { type: 'form' }>

export function formPlayerPreview(
  root: HTMLElement,
  t: Translate,
  createGraphics: ProjectPanelDependencies['createGraphics'],
) {
  const answers: NonNullable<Parameters<typeof renderForm>[3]['formDrafts']> = new Map()
  let rendered: ReturnType<typeof renderForm> | undefined
  let graphics: ReturnType<typeof createGraphics> | undefined

  function hide() {
    rendered?.dispose()
    rendered = undefined
    root.replaceChildren()
  }

  return {
    hide,
    reset() {
      answers.clear()
      hide()
    },
    dispose() {
      hide()
      answers.clear()
      graphics?.dispose()
      graphics = undefined
    },
    show(view: ProjectView, form: FormDefinition, path: string, placement?: FormPlacement) {
      hide()

      try {
        const messages = view.translations ?? {}
        const translations = { messages, fallback: messages }
        const definition = localizeForm(form, translations)

        const profile = view.game?.characterProfile

        const choices = new Map(
          Object.values(view.choices ?? {}).map((choice) => [
            choice.id,
            localizeChoice(choice, translations),
          ]),
        )

        const fields = definition.rows.flat(2)

        const allowed = new Map(
          fields.flatMap((element) => {
            const field = formField(element, choices)

            return field ? [[JSON.stringify(field.path), field] as const] : []
          }),
        )

        const values = answers.get('preview')?.values

        for (const [key, value] of values ?? []) {
          const field = allowed.get(key)

          if (!field || !validFormValue(field, value)) values?.delete(key)
        }

        if (fields.some((e) => e.type === 'graphic' || e.type === 'portrait'))
          graphics ??= createGraphics(path)
        const text = (key: string | undefined, literal: string) => (key && messages[key]) || literal
        rendered = renderForm(
          {
            type: 'form',
            id: 'preview',
            form: form.id,
            label: placement ? text(placement.labelKey, placement.label) : definition.label,
            submitLabel: placement
              ? text(placement.submitLabelKey, placement.submitLabel)
              : t('forms.submit'),
            cancelLabel: placement
              ? text(placement.cancelLabelKey, placement.cancelLabel)
              : t('forms.cancel'),
            ...(placement?.backScene && { backScene: placement.backScene }),
            placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 },
          },
          definition,
          profile,
          { document: root.ownerDocument, assets: view.assets, graphics, formDrafts: answers },
          { choices, ...(view.rules && { rules: view.rules }), ruleTranslation: translations },
        )
        root.append(rendered.element)
      } catch (problem) {
        root.textContent = problem instanceof Error ? problem.message : String(problem)
      }
    },
  }
}
