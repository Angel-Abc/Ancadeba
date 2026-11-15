import type { SceneComponentData } from '@ancadeba/game-runtime'
import type { ComponentRenderContext, IComponentRenderer } from './componentRendering.js'
import { componentRuntimeText } from './runtimeText.js'

export class SaveSlotsComponentRenderer implements IComponentRenderer<
  Extract<SceneComponentData, { type: 'save-slots' }>
> {
  render(
    component: Extract<SceneComponentData, { type: 'save-slots' }>,
    context: ComponentRenderContext,
  ) {
    const { document, saves } = context
    const element = document.createElement('div')
    element.className = 'ancadeba-save-slots'
    element.setAttribute('aria-label', component.label)
    const slotLabel = document.createElement('label')
    const slot = document.createElement('select')
    const nameLabel = document.createElement('label')
    const name = document.createElement('input')
    name.type = 'text'
    name.maxLength = 80
    const t = componentRuntimeText(context)
    slot.setAttribute('aria-label', t('save.slot'))
    name.setAttribute('aria-label', t('save.name'))
    const slotCaption = document.createElement('span')
    slotCaption.textContent = t('save.slot')
    const nameCaption = document.createElement('span')
    nameCaption.textContent = t('save.name')
    slotLabel.append(slotCaption, slot)
    nameLabel.append(nameCaption, name)
    element.append(slotLabel)

    if (component.showName) element.append(nameLabel)

    const update = () => {
      slot.replaceChildren(
        ...(saves?.slots ?? []).map((saved) => {
          const option = document.createElement('option')
          option.value = saved.id
          option.textContent = t('save.slotLabel', {
            slot: saved.id,
            name: !saved.available
              ? t('save.slotUnavailable')
              : saved.occupied
                ? saved.name || t('save.unnamed')
                : t('save.empty'),
          })

          return option
        }),
      )
      slot.value = saves?.selectedSlot ?? ''
      name.value =
        saves?.draftName ?? saves?.slots.find(({ id }) => id === saves.selectedSlot)?.name ?? ''
      slot.disabled = name.disabled = !saves || !saves.canImport
    }

    const onSlot = () => {
      saves?.selectSlot(slot.value)
    }

    const onName = () => {
      saves?.setName?.(name.value)
    }

    slot.addEventListener('change', onSlot)
    name.addEventListener('input', onName)
    const unsubscribe = saves?.subscribe(update)
    update()

    return {
      element,
      dispose() {
        unsubscribe?.()
        slot.removeEventListener('change', onSlot)
        name.removeEventListener('input', onName)
        element.remove()
      },
    }
  }
}
