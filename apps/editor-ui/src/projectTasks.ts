/**
 * The task forms own validation and submission. This dialog only presents the active form
 * and restores focus to the control that opened it.
 */
export function bindProjectTasks(root: HTMLElement, source: () => string) {
  const find = <T extends HTMLElement>(id: string) => root.querySelector<T>('#' + id)
  const dialog = find<HTMLDialogElement>('project-task-dialog')

  if (!dialog?.showModal) return
  const menu = find<HTMLDetailsElement>('project-actions')!
  const notices = find('project-notices')!
  const modalNotices = find('project-task-notices')!
  const extraClose = find('project-task-close')!
  const abort = new AbortController()
  const options = { signal: abort.signal }
  let active: HTMLElement | undefined
  let opener: HTMLElement | undefined

  const close = () => {
    if (!dialog.open) return

    if (active) active.hidden = true
    opener?.setAttribute('aria-expanded', 'false')
    const openFeedback = find('project-open-feedback')!

    if (modalNotices.contains(openFeedback)) find('project-open-controls')!.append(openFeedback)
    notices.append(...modalNotices.childNodes)
    dialog.close()
    const target = opener?.checkVisibility() ? opener : find('project-open-toggle')
    target?.focus()
    active = undefined
  }

  dialog.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault()
      close()
    },
    options,
  )
  extraClose.addEventListener('click', close, options)

  const observer = new MutationObserver(() => {
    if (active?.hidden) close()
  })

  observer.observe(dialog, { attributes: true, attributeFilter: ['hidden'], subtree: true })

  for (const [trigger, task] of [
    ['new', 'create'],
    ['duplicate', 'duplicate'],
    ['rename', 'rename'],
    ['recover', 'recover'],
    ['import', 'import'],
    ['trash', 'trash'],
  ]) {
    const button = find<HTMLButtonElement>('project-' + trigger + '-toggle')!
    const form = find('project-' + task + '-controls')!
    button.addEventListener(
      'click',
      () => {
        if (form.hidden) return
        active = form
        opener = button
        button.setAttribute('aria-expanded', 'true')
        find('project-task-title')!.textContent = button.textContent
        const context = find('project-task-source')!
        context.textContent = task === 'duplicate' || task === 'rename' ? source() : ''
        context.hidden = !context.textContent
        extraClose.hidden = task !== 'trash'
        modalNotices.append(...notices.childNodes)

        if (task === 'recover') modalNotices.append(find('project-open-feedback')!)
        dialog.showModal()
        form.querySelector<HTMLElement>('input,select')?.focus()
      },
      options,
    )
  }

  root.ownerDocument.addEventListener(
    'click',
    (event) => {
      if (
        event.target instanceof Node &&
        menu.open &&
        !dialog.open &&
        !menu.contains(event.target) &&
        !dialog.contains(event.target)
      )
        menu.open = false
    },
    options,
  )
  menu.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        menu.open = false
        menu.querySelector('summary')?.focus()
      }
    },
    options,
  )

  return () => {
    observer.disconnect()
    abort.abort()
    close()
  }
}
