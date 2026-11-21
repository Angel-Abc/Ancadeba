export interface EditorShortcutActions {
  active(): boolean
  blocked(action: 'save' | 'selection'): boolean
  save(): void
  copy(): boolean
  paste(): boolean
  duplicate(): boolean
  delete(): boolean
  undo(): boolean
  redo(): boolean
}

/** Actions return whether the current editor selection can handle a shortcut. */
export function bindEditorShortcuts(window: Window, actions: EditorShortcutActions): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.altKey || !actions.active()) return
    const target = event.target

    const isWithin = (selector: string) =>
      target &&
      'closest' in target &&
      typeof target.closest === 'function' &&
      target.closest(selector)

    if (
      isWithin(
        'dialog[open], [role="dialog"], #preview-pane, #preview-form, #project-open-controls, #project-create-controls',
      )
    )
      return
    const key = event.key.toLowerCase()
    const modified = event.ctrlKey || event.metaKey

    if (modified && !event.shiftKey && key === 's') {
      event.preventDefault()

      if (!event.repeat && !actions.blocked('save')) actions.save()

      return
    }

    if (
      event.repeat ||
      actions.blocked('selection') ||
      isWithin(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]',
      )
    )
      return
    let action: keyof Omit<EditorShortcutActions, 'active' | 'blocked' | 'save'> | undefined

    if (modified && !event.shiftKey) {
      if (key === 'c') action = 'copy'
      else if (key === 'v') action = 'paste'
      else if (key === 'd') action = 'duplicate'
      else if (key === 'z') action = 'undo'
      else if (key === 'y') action = 'redo'
    } else if (modified && event.shiftKey && key === 'z') action = 'redo'
    else if (!modified && !event.shiftKey && (key === 'delete' || key === 'backspace'))
      action = 'delete'

    if (
      !action ||
      ((action === 'copy' || action === 'delete') && window.getSelection?.()?.toString())
    )
      return

    if (actions[action]()) event.preventDefault()
  }

  window.addEventListener('keydown', onKeyDown)

  return () => window.removeEventListener('keydown', onKeyDown)
}
