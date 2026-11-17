import type { Translate } from '@ancadeba/utilities'

export type ConfirmAction = (message: string, actionKey?: string) => boolean | Promise<boolean>

/** Shares a single in-app confirmation across the editor. */
export function createEditorConfirmation(document: Document, t: Translate) {
  let cancelPending: (() => void) | undefined

  return {
    ask(this: void, message: string, actionKey = 'confirmation.confirm'): Promise<boolean> {
      if (cancelPending) return Promise.resolve(false)

      return new Promise((resolve) => {
        const dialog = document.createElement('dialog')
        dialog.className = 'editor-confirmation'
        dialog.setAttribute('role', 'alertdialog')
        dialog.setAttribute('aria-labelledby', 'editor-confirmation-title')
        dialog.setAttribute('aria-describedby', 'editor-confirmation-message')
        const title = document.createElement('h2')
        title.id = 'editor-confirmation-title'
        title.textContent = t('confirmation.title')
        const text = document.createElement('p')
        text.id = 'editor-confirmation-message'
        text.textContent = message
        const actions = document.createElement('div')
        actions.className = 'editor-confirmation-actions'
        const cancel = document.createElement('button')
        cancel.type = 'button'
        cancel.autofocus = true
        cancel.textContent = t('confirmation.cancel')
        const accept = document.createElement('button')
        accept.type = 'button'
        accept.className = 'primary'
        accept.textContent = t(actionKey)
        let settled = false

        const finish = (value: boolean) => {
          if (settled) return
          settled = true
          cancelPending = undefined

          if (dialog.open) dialog.close()
          dialog.remove()
          resolve(value)
        }

        cancelPending = () => finish(false)
        cancel.addEventListener('click', () => finish(false))
        accept.addEventListener('click', () => finish(true))
        dialog.addEventListener('cancel', (event) => {
          event.preventDefault()
          finish(false)
        })
        dialog.addEventListener('close', () => finish(false))
        actions.append(cancel, accept)
        dialog.append(title, text, actions)
        document.body.append(dialog)
        dialog.showModal()
        cancel.focus()
      })
    },
    cancel: () => cancelPending?.(),
  }
}
