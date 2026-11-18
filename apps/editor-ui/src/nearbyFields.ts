import type { ProjectView } from '@ancadeba/editor-core'
import { gameBindingSchema, gameIdSchema, type NearbyComponentDefinition } from '@ancadeba/schemas'
import { statePath, translationChoices, type RuleFormControls } from './ruleFormControls.js'

export interface NearbySelection {
  selected: string
  newTarget: string
  action?: string
  newAction: string
}

export function nearbyFields(
  fields: RuleFormControls,
  view: ProjectView,
  scene: ProjectView['scenes'][number],
  draft: NearbyComponentDefinition,
  state: NearbySelection,
  render: () => void,
  error: HTMLElement,
) {
  const { t } = fields
  const controls = fields
  const { create, input, select, button, group, translation } = fields

  const conditions = (view.rules?.state ?? [])
    .filter((field) => typeof field.value === 'boolean')
    .map(
      (field) =>
        [
          JSON.stringify({ source: 'game.state', path: field.path }),
          statePath(field.path),
        ] as const,
    )

  const keys = translationChoices(view, t('metadata.literalText'))
  const actionIds = Object.keys(view.rules?.actions ?? {})

  const condition = (
    label: string,
    current: unknown,
    update: (value: ReturnType<typeof gameBindingSchema.parse> | undefined) => void,
  ) =>
    select(
      label,
      current ? JSON.stringify(current) : '',
      [['', t('form.always')], ...conditions],
      (value) => update(value ? gameBindingSchema.parse(JSON.parse(value)) : undefined),
    )

  const form = create('div')
  form.className = 'inspector-fields'
  form.append(
    select(
      t('nearby.target'),
      state.selected,
      Object.entries(draft.entries).map(
        ([id, entry]) =>
          [
            id,
            (entry.labelKey && view.translations?.[entry.labelKey]) || entry.label || id,
          ] as const,
      ),
      (value) => {
        state.selected = value
        render()
      },
      false,
    ),
  )

  const entry = Object.hasOwn(draft.entries, state.selected)
    ? draft.entries[state.selected]
    : undefined

  if (entry) {
    const label = create('label')
    const description = create('textarea')
    description.value = entry.description
    description.addEventListener('input', () => {
      entry.description = description.value
      controls.markEdited()
    })
    label.append(t('nearby.targetDescription'), description)
    form.append(
      select(t('nearby.targetKind'), entry.kind, ['character', 'object'], (value) => {
        entry.kind = value
      }),
      input(t('nearby.targetLabel'), entry.label, (value) => {
        entry.label = value
      }),
      translation(t('nearby.targetLabelTranslation'), entry.labelKey ?? '', keys, (value) => {
        entry.labelKey = value || undefined
      }),
      label,
      translation(
        t('nearby.targetDescriptionTranslation'),
        entry.descriptionKey ?? '',
        keys,
        (value) => {
          entry.descriptionKey = value || undefined
        },
      ),
    )
    const behavior = fields.fold('nearby-behavior', t('inspector.behavior'), false)
    form.append(behavior)
    behavior.append(
      select(
        t('nearby.dialogue'),
        entry.dialogue ?? '',
        ['', ...Object.keys(view.dialogues ?? {})],
        (value) => {
          entry.dialogue = value || undefined

          if (!value) entry.conversationId = undefined
        },
      ),
      input(t('nearby.conversationId'), entry.conversationId ?? '', (value) => {
        entry.conversationId = value || undefined
      }),
      condition(t('nearby.visibleWhen'), entry.visibleWhen, (value) => {
        entry.visibleWhen = value
      }),
    )

    const ids = Object.keys(entry.actions)

    if (!ids.includes(state.action ?? '')) state.action = ids[0] ?? ''

    if (ids.length)
      behavior.append(
        select(
          t('inspector.action'),
          state.action ?? '',
          ids,
          (id) => {
            state.action = id
            render()
          },
          false,
        ),
      )

    for (const [id, action] of Object.entries(entry.actions).filter(([id]) => id === state.action))
      behavior.append(
        group(
          t('nearby.action', { id }),
          select(t('nearby.requestedAction', { id }), action.action, actionIds, (value) => {
            action.action = value
          }),
          condition(t('nearby.enableWhen', { id }), action.enabledWhen, (value) => {
            action.enabledWhen = value
          }),
          button(t('nearby.removeAction', { id }), () => {
            delete entry.actions[id]
            controls.markEdited()
            render()
          }),
        ),
      )
    behavior.append(
      input(t('nearby.newActionId'), state.newAction, (value) => {
        state.newAction = value.trim()
      }),
      button(t('nearby.addAction'), () => {
        if (
          !gameIdSchema.safeParse(state.newAction).success ||
          Object.hasOwn(entry.actions, state.newAction)
        ) {
          error.textContent = t('nearby.uniqueActionId')

          return
        }

        entry.actions = { ...entry.actions, [state.newAction]: { action: actionIds[0] ?? '' } }
        state.action = state.newAction
        state.newAction = ''
        controls.markEdited()
        render()
      }),
    )
  }

  const manage = fields.fold(
    'nearby-targets',
    t('inspector.manageTargets'),
    false,
    input(t('nearby.newTargetId'), state.newTarget, (value) => {
      state.newTarget = value.trim()
    }),
    button(t('nearby.addTarget'), () => {
      if (
        !gameIdSchema.safeParse(state.newTarget).success ||
        Object.hasOwn(draft.entries, state.newTarget)
      ) {
        error.textContent = t('nearby.uniqueTargetId')

        return
      }

      draft.entries = {
        ...draft.entries,
        [state.newTarget]: {
          kind: 'object',
          label: state.newTarget,
          description: '',
          actions: {},
        },
      }
      state.selected = state.newTarget
      state.newTarget = ''
      controls.markEdited()
      render()
    }),
  )

  if (entry)
    manage.append(
      button(t('nearby.removeTarget'), () => {
        delete draft.entries[state.selected]
        state.selected = Object.keys(draft.entries)[0] ?? ''
        controls.markEdited()
        render()
      }),
    )
  form.append(manage)
  form.append(
    fields.fold(
      'nearby-panel',
      t('nearby.heading'),
      false,
      input(t('nearby.title'), draft.label, (value) => {
        draft.label = value
      }),
      translation(t('nearby.titleTranslation'), draft.labelKey ?? '', keys, (value) => {
        draft.labelKey = value || undefined
      }),
      select(
        t('nearby.descriptionComponent'),
        draft.descriptionTarget,
        scene.components
          .filter(
            (component) =>
              component.type === 'text' &&
              !scene.components.some(
                (other) =>
                  other.type === 'nearby' &&
                  other.id !== draft.id &&
                  other.descriptionTarget === component.id,
              ),
          )
          .map(({ id }) => id),
        (value) => {
          draft.descriptionTarget = value
        },
      ),
    ),
  )

  return form
}
