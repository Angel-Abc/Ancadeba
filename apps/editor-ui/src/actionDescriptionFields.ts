import type { ProjectView } from '@ancadeba/editor-core'
import { translationChoices, yesNoChoices, type RuleFormControls } from './ruleFormControls.js'

interface ActionPresentation {
  showOnlyWhenActive?: boolean | undefined
  description?: string | undefined
  descriptionKey?: string | undefined
  unavailableText?: string | undefined
  unavailableTextKey?: string | undefined
}

export function actionVisibilityField(controls: RuleFormControls, draft: ActionPresentation) {
  return controls.select(
    controls.t('controls.showOnlyWhenActive'),
    String(draft.showOnlyWhenActive ?? false),
    yesNoChoices(controls.t),
    (value) => {
      draft.showOnlyWhenActive = value === 'true'
    },
  )
}

/** Shared authoring fields for ordinary buttons and action-bar slots. */
export function actionDescriptionFields(
  controls: RuleFormControls,
  view: ProjectView,
  draft: ActionPresentation,
): HTMLElement[] {
  const { create, input, translation, t } = controls
  const description = create('textarea')
  description.rows = 3
  description.value = draft.description ?? ''
  description.addEventListener('input', () => {
    draft.description = description.value || undefined
    controls.markEdited()
  })
  const label = create('label')
  label.append(t('metadata.description'), description)

  return [
    actionVisibilityField(controls, draft),
    label,
    translation(
      t('form.descriptionTranslation'),
      draft.descriptionKey ?? '',
      translationChoices(view, t('form.literalText')),
      (value) => {
        draft.descriptionKey = value || undefined
      },
    ),
    input(t('actionInfo.unavailableText'), draft.unavailableText ?? '', (value) => {
      draft.unavailableText = value || undefined
    }),
    translation(
      t('actionInfo.unavailableTranslation'),
      draft.unavailableTextKey ?? '',
      translationChoices(view, t('form.literalText')),
      (value) => {
        draft.unavailableTextKey = value || undefined
      },
    ),
  ]
}
