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

export function refreshSaveStatuses(root: ParentNode) {
  for (const status of root.querySelectorAll<HTMLElement>('.form-save-status'))
    readers.get(status)?.()
}

export function markSaveButton(button: HTMLButtonElement) {
  button.setAttribute('aria-keyshortcuts', 'Control+s Meta+s')
  button.title = 'Ctrl+S / ⌘S'

  return button
}

export function bindFormSaveBar(form: HTMLElement, t: Translate, isDirty: () => boolean) {
  const bar = form.querySelector?.('[data-save-actions]')
  const submit = bar?.querySelector<HTMLButtonElement>('button[type="submit"]')

  if (submit) markSaveButton(submit)
  bar?.append(saveStatus(form.ownerDocument, t, isDirty))
}

/** Outside a form, save only when exactly one visible draft in scope has pending changes. */
export function saveActiveDraft(workspace: HTMLElement) {
  const focused = workspace.ownerDocument.activeElement

  const scope =
    focused && workspace.contains(focused)
      ? (focused.closest('form') ?? focused.closest('section') ?? workspace)
      : workspace

  refreshSaveStatuses(scope)

  const buttons = Array.from(
    scope.querySelectorAll<HTMLButtonElement>('button[aria-keyshortcuts~="Control+s"]'),
  ).filter(
    (button) =>
      button.checkVisibility() && button.parentElement?.querySelector('[data-dirty="true"]'),
  )

  if (buttons.length === 1 && !buttons[0]!.matches(':disabled')) buttons[0]!.click()
}
