import type { Translate } from '@ancadeba/utilities'
import type { DraftLocation } from './projectSectionRegistry.js'

export function bindPendingSaves(
  button: HTMLButtonElement,
  panel: HTMLElement,
  t: Translate,
  pathLabel: (key: string) => string | undefined,
  open: (location: DraftLocation) => boolean,
) {
  const list = panel.querySelector('ul')!
  const feedback = panel.querySelector('p')!
  let locations: DraftLocation[] = []

  const select = (event: MouseEvent) => {
    if (!(event.target instanceof HTMLButtonElement)) return
    const location = locations[Number(event.target.dataset.index)]

    if (!location) return

    if (open(location)) panel.hidePopover()
    else feedback.textContent = t('tree.saveFirst')
  }

  const clearFeedback = () => {
    feedback.textContent = ''
  }

  list.addEventListener('click', select)
  panel.addEventListener('toggle', clearFeedback)

  return {
    render(next: DraftLocation[], busy: boolean) {
      locations = next
      button.hidden = !next.length
      const caption = t('drafts.locations', { count: next.length })

      if (button.textContent !== caption) button.textContent = caption

      if (!next.length && panel.matches(':popover-open')) panel.hidePopover()

      // Keep the focused list button in place during background refreshes.
      while (list.children.length > next.length) list.lastElementChild!.remove()
      next.forEach((location, index) => {
        let item = list.children[index]?.querySelector('button')

        if (!item) {
          const row = list.ownerDocument.createElement('li')
          item = list.ownerDocument.createElement('button')
          item.type = 'button'
          item.dataset.index = String(index)
          row.append(item)
          list.append(row)
        }

        const path = location.key && pathLabel(location.key)
        const label = [path ?? location.key, location.detail].filter(Boolean).join(' › ')

        if (item.textContent !== label) item.textContent = label
        item.disabled = busy || Boolean(location.key && !path)
      })
    },
    dispose() {
      list.removeEventListener('click', select)
      panel.removeEventListener('toggle', clearFeedback)
    },
  }
}
