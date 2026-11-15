import type { ComponentRenderContext } from './componentRendering.js'
import type { ActionInformation } from './actionInfo.js'

export function isActionDisabled(button: HTMLButtonElement): boolean {
  return button.disabled || button.getAttribute('aria-disabled') === 'true'
}

/** Keep unavailable actions inspectable with a keyboard, while activation stays guarded. */
export function bindActionInfo(button: HTMLButtonElement, context: ComponentRenderContext) {
  const information = context.actionInfo
  const source = Symbol('action')
  const enter = () => information?.hover(source, true)
  const leave = () => information?.hover(source, false)
  const focus = () => information?.focus(source, true)
  const blur = () => information?.focus(source, false)

  const listeners = [
    ['mouseenter', enter],
    ['mouseleave', leave],
    ['focus', focus],
    ['blur', blur],
  ] as const

  if (information)
    for (const [event, listener] of listeners) button.addEventListener(event, listener)

  return {
    update(value: ActionInformation) {
      // The renderer sets native disabled on every update before publishing presentation.
      const disabled = button.disabled
      button.setAttribute(
        'aria-description',
        [value.description, value.reason].filter(Boolean).join('\n'),
      )

      if (!information) return
      button.setAttribute('aria-disabled', String(disabled))
      button.disabled = false
      information.update(source, button.hidden ? undefined : value)
    },
    dispose() {
      information?.update(source, undefined)

      if (information)
        for (const [event, listener] of listeners) button.removeEventListener(event, listener)
    },
  }
}
