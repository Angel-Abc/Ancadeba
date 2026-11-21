import type { Translate } from '@ancadeba/utilities'
import type { ProjectTreeNode } from './projectTree.js'

export function bindInspectorActions(root: HTMLElement, t: Translate) {
  const toggle = root.querySelector<HTMLButtonElement>('button')!
  const fields = root.querySelector<HTMLElement>('#inspector-action-fields')!
  let selectionKey: string | undefined

  const setExpanded = (expanded: boolean) => {
    fields.hidden = !expanded
    toggle.setAttribute('aria-expanded', String(expanded))
  }

  const onToggle = () => setExpanded(Boolean(fields.hidden))
  toggle.addEventListener('click', onToggle)

  return {
    render(node: ProjectTreeNode) {
      root.hidden = node.kind !== 'component' && node.kind !== 'scene'
      toggle.textContent = t(node.kind === 'component' ? 'component.actions' : 'scene.actions')

      if (selectionKey !== node.key) setExpanded(false)
      selectionKey = node.key
    },
    setExpanded,
    dispose: () => toggle.removeEventListener('click', onToggle),
  }
}

export function renderSceneNavigation(
  list: HTMLElement,
  actions: HTMLElement,
  node: ProjectTreeNode,
  select: (key: string) => void,
  t: Translate,
  busy: boolean,
  readOnly: boolean,
) {
  const document = list.ownerDocument
  const overview = node.section === 'scenes' && node.kind === 'section'
  list.hidden = !overview
  actions.hidden = !overview && node.kind !== 'scene'
  list.replaceChildren()
  actions.replaceChildren()

  if (actions.hidden) return

  for (const child of node.children ?? []) {
    if (child.kind === 'component') continue
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = child.kind === 'new-scene' ? t('scene.new') : child.label
    button.disabled = busy || (readOnly && child.kind !== 'scene')
    button.addEventListener('click', () => select(child.key))

    if (child.kind === 'scene') {
      const row = document.createElement('li')
      const detail = document.createElement('small')
      detail.textContent = child.detail ?? ''
      row.append(button, detail)
      list.append(row)
    } else actions.append(button)
  }
}
