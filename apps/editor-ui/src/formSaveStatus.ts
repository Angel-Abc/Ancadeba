import type { Translate } from '@ancadeba/utilities'

// Read each form's own draft flag, including forms with independent drafts in the same pane.
const readers = new WeakMap<HTMLElement, () => void>()

export function saveStatus(document: Document, t: Translate, isDirty: () => boolean) {
  const status = document.createElement('span')
  status.className = 'form-save-status'
  status.setAttribute('role', 'status')

  const update = () => {
    const dirty = isDirty()
    const text = t(dirty ? 'drafts.unsaved' : 'drafts.clean')

    if (status.textContent !== text) {
      status.textContent = text
      status.setAttribute('data-dirty', String(dirty))
    }
  }

  readers.set(status, update)
  update()

  return status
}

export function refreshSaveStatuses(root: HTMLElement) {
  for (const status of root.querySelectorAll<HTMLElement>('.form-save-status'))
    readers.get(status)?.()
}
