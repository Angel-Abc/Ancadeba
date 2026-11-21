import { inventoryComponentSchema, sceneComponentSchema } from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import { z } from 'zod'
import { registerEditorDraft } from './editorDraftState.js'

const recoveredSchema = z.object({
  sceneId: z.string(),
  component: sceneComponentSchema,
  existingId: z.string().optional(),
  panels: z.array(inventoryComponentSchema).optional(),
  hiddenPreviews: inventoryComponentSchema.shape.characterPreviews.optional(),
  slot: z.string().optional(),
  nearby: z
    .object({ selected: z.string(), newAction: z.string(), newTarget: z.string() })
    .optional(),
})

export type RecoveredComponent = z.infer<typeof recoveredSchema>

export function recoveredComponent(
  view: ProjectView | undefined,
  sceneId: string,
  component: RecoveredComponent['component'],
): RecoveredComponent {
  const saved = view?.scenes
    .find((scene) => scene.id === sceneId)
    ?.components.find((entry) => entry.id === component.id)

  return { sceneId, component, ...(saved ? { existingId: saved.id } : {}) }
}

/** Older specialist drafts can contain several independently saved components. */
export function bindRecoveredComponents(
  root: HTMLElement,
  t: Translate,
  resume: (draft: RecoveredComponent) => boolean,
) {
  let pending: RecoveredComponent[] = []

  function render() {
    root.hidden = !pending.length
    root.replaceChildren()

    if (!pending.length) return
    const title = root.ownerDocument.createElement('h4')
    title.textContent = t('inspector.recoveredComponents')
    root.append(title)

    for (const draft of pending) {
      const button = root.ownerDocument.createElement('button')
      button.type = 'button'
      button.textContent = [
        draft.sceneId,
        t(`tree.${draft.component.type}`),
        draft.component.id,
      ].join(' · ')
      button.addEventListener('click', () => {
        if (!resume(draft)) return
        pending = pending.filter((entry) => entry !== draft)
        render()
      })
      root.append(button)
    }
  }

  registerEditorDraft(
    root,
    'recovered-components',
    z.array(recoveredSchema),
    () => (pending.length ? pending : undefined),
    (saved) => {
      pending = saved
      render()
    },
  )

  return {
    add(drafts: RecoveredComponent[]) {
      pending.push(...drafts)
      render()
    },
    clear() {
      pending = []
      render()
    },
    hasDrafts: () => pending.length > 0,
  }
}
