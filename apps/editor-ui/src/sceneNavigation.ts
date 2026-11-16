import type { Translate } from '@ancadeba/utilities'
import type { ProjectTreeNode } from './projectTree.js'

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
