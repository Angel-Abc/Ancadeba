import type { RuntimeTranslator } from '@ancadeba/schemas'

export type GameConfirmation = (message: () => string, accept: () => void) => () => void

interface PendingConfirmation {
  dialog: HTMLDialogElement
  refresh(): void
  finish(accepted: boolean): void
}

/** Owns one modal within the game surface, including keyboard input and focus restoration. */
export class GameConfirmationDialog {
  private pending: PendingConfirmation | undefined
  private disposed = false

  get isOpen(): boolean {
    return this.pending !== undefined
  }

  constructor(
    private readonly surface: HTMLElement,
    private readonly target: HTMLElement,
    private readonly t: RuntimeTranslator,
    private readonly resetInput: () => void,
  ) {
    surface.addEventListener('keydown', this.onKeyDown, true)
  }

  readonly request: GameConfirmation = (message, accept) => {
    if (this.disposed || this.pending) return () => {}

    const document = this.surface.ownerDocument
    const previousFocus = document.activeElement
    const dialog = document.createElement('dialog')
    dialog.className = 'ancadeba-confirmation'
    dialog.setAttribute('role', 'alertdialog')
    dialog.setAttribute('aria-modal', 'true')
    const title = document.createElement('h2')
    const text = document.createElement('p')
    const actions = document.createElement('div')
    actions.className = 'ancadeba-confirmation-actions'
    const cancel = document.createElement('button')
    cancel.type = 'button'
    const confirm = document.createElement('button')
    confirm.type = 'button'
    actions.append(cancel, confirm)
    dialog.append(title, text, actions)

    const refresh = () => {
      title.textContent = this.t('confirmation.title')
      text.textContent = message()
      dialog.setAttribute('aria-label', title.textContent)
      dialog.setAttribute('aria-description', text.textContent)
      cancel.textContent = this.t('confirmation.cancel')
      confirm.textContent = this.t('confirmation.confirm')
    }

    const finish = (accepted: boolean) => {
      if (this.pending?.dialog !== dialog) return

      this.pending = undefined
      cancel.removeEventListener('click', onCancel)
      confirm.removeEventListener('click', onConfirm)
      dialog.removeEventListener('cancel', onCancelEvent)
      dialog.removeEventListener('close', onCancel)
      dialog.close()
      dialog.remove()
      this.resetInput()

      if (!this.disposed) {
        if (
          previousFocus &&
          this.surface.contains(previousFocus) &&
          'focus' in previousFocus &&
          typeof previousFocus.focus === 'function'
        )
          previousFocus.focus()
        else this.surface.focus()
      }

      if (accepted && !this.disposed) accept()
    }

    const onCancel = () => finish(false)
    const onConfirm = () => finish(true)

    const onCancelEvent = (event: Event) => {
      event.preventDefault()
      finish(false)
    }

    this.pending = { dialog, refresh, finish }
    cancel.addEventListener('click', onCancel)
    confirm.addEventListener('click', onConfirm)
    dialog.addEventListener('cancel', onCancelEvent)
    dialog.addEventListener('close', onCancel)
    refresh()
    this.target.append(dialog)
    this.resetInput()
    dialog.showModal()
    cancel.focus()

    return onCancel
  }

  refresh(): void {
    this.pending?.refresh()
  }

  cancel(): void {
    this.pending?.finish(false)
  }

  dispose(): void {
    this.disposed = true
    this.cancel()
    this.surface.removeEventListener('keydown', this.onKeyDown, true)
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    const pending = this.pending

    if (!pending) return

    event.stopImmediatePropagation()

    if (event.code === 'Escape') {
      event.preventDefault()
      pending.finish(false)
    } else if (event.code === 'Tab') {
      event.preventDefault()
      const buttons = pending.dialog.querySelectorAll('button')
      const next = this.surface.ownerDocument.activeElement === buttons[0] ? buttons[1] : buttons[0]
      next?.focus()
    }
  }
}
