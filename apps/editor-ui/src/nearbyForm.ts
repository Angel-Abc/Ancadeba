import { nearbyFields } from './nearbyFields.js'
import { saveBar } from './ruleFormControls.js'
import { saveStatus } from './formSaveStatus.js'
import { registerEditorDraft } from './editorDraftState.js'
import { z } from 'zod'
import { nearbyComponentSchema } from '@ancadeba/schemas'
import type { EditorCommand, ProjectView } from '@ancadeba/editor-core'
import type { NearbyComponentDefinition } from '@ancadeba/schemas'
import { placementFields, type RuleFormControls, ruleFormControls } from './ruleFormControls.js'
import { sceneChoices } from './choiceLabels.js'

/** Edits scene targets separately from the action-bar slots that display their commands. */
export function nearbyForm(
  controls: RuleFormControls,
  view: ProjectView,
  save: (command: EditorCommand) => void,
  initialScene?: string,
  {
    componentId,
    onDiscard,
  }: {
    componentId?: string
    onDiscard?: () => void
  } = {},
): HTMLElement {
  const { t } = controls
  const root = controls.group(t('nearby.heading'))
  const scenes = view.scenes.filter((scene) => scene.type === 'game')

  if (!scenes.length) {
    root.append(t('nearby.sceneFirst'))

    return root
  }

  let sceneId = scenes.find((scene) => scene.id === initialScene)?.id ?? scenes[0]!.id
  let draft: NearbyComponentDefinition
  let dirty = false
  const area = controls.create('div')
  const error = controls.create('p')
  error.className = 'error'
  error.setAttribute('role', 'alert')

  const fields = ruleFormControls(
    root.ownerDocument,
    () => {
      dirty = true
      controls.markEdited()
    },
    t,
  )

  const state = { selected: '', newTarget: '', newAction: '' }

  function render() {
    const scene = scenes.find((scene) => scene.id === sceneId)!
    const form = fields.create('form')

    if (!scene.components.some((component) => component.id === draft.id))
      form.append(
        fields.input(t('nearby.componentId'), draft.id, (value) => {
          draft.id = value.trim()
        }),
      )
    const submit = fields.create('button')
    submit.type = 'submit'
    submit.textContent = t('nearby.save')
    form.append(
      saveBar(
        form.ownerDocument,
        submit,
        saveStatus(form.ownerDocument, t, () => dirty),
        fields.button(t('nearby.discard'), () => {
          reset()
          onDiscard?.()
        }),
      ),
      nearbyFields(fields, view, scene, draft, state, render, error),
      fields.fold(
        'layout',
        t('nearby.placement'),
        false,
        ...placementFields(t).map(([key, label]) =>
          fields.input(
            t('nearby.placementField', { field: label.toLowerCase() }),
            String(draft.placement[key]),
            (value) => {
              draft.placement[key] = Number(value)
            },
            'number',
          ),
        ),
      ),
    )
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      error.textContent = ''
      save({ type: 'scene.upsertNearby', sceneId, component: draft })
    })
    area.replaceChildren(form)
  }

  function reset() {
    const scene = scenes.find((scene) => scene.id === sceneId)!

    const previous = scene.components.find(
      (component): component is NearbyComponentDefinition =>
        component.type === 'nearby' && (componentId === undefined || component.id === componentId),
    )

    draft = previous
      ? structuredClone(previous)
      : {
          id: 'nearby',
          type: 'nearby',
          label: 'Nearby',
          placement: { row: 1, column: scene.screen.grid.columns, rowSpan: 1, columnSpan: 1 },
          descriptionTarget:
            scene.components.find(
              (component) => component.id === 'narrative' && component.type === 'text',
            )?.id ??
            scene.components.find((component) => component.type === 'text')?.id ??
            '',
          entries: {},
        }
    state.selected = Object.keys(draft.entries)[0] ?? ''
    dirty = false
    state.newTarget = ''
    state.newAction = ''
    error.textContent = ''
    render()
  }

  const picker = controls.select(
    t('nearby.gameScene'),
    sceneId,
    sceneChoices(view, 'game'),
    (value) => {
      if (dirty) {
        picker.querySelector('select')!.value = sceneId
        error.textContent = t('nearby.saveFirst')

        return
      }

      sceneId = value
      reset()
    },
    false,
  )

  // Opened from a scene in the explorer, the scene is already chosen.
  picker.hidden = Boolean(initialScene)
  root.append(picker, error, area)
  reset()

  registerEditorDraft(
    root,
    `nearby:${initialScene ?? 'rules'}:${componentId ?? ''}`,
    z.object({
      sceneId: z.string(),
      draft: nearbyComponentSchema,
      selected: z.string(),
      newTarget: z.string(),
      newAction: z.string(),
    }),
    () => (dirty ? { sceneId, draft, ...state } : undefined),
    (saved) => {
      sceneId = saved.sceneId
      draft = saved.draft
      state.selected = saved.selected
      state.newTarget = saved.newTarget
      state.newAction = saved.newAction
      dirty = true
      controls.markEdited()
      render()
    },
  )

  return root
}
