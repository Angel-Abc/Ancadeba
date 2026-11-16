import type { Translate } from '@ancadeba/utilities'

export const mapEditorTabIds = ['paint', 'terrain', 'objects', 'settings'] as const

export type MapEditorTab = (typeof mapEditorTabIds)[number]

export function mapEditorTabs(
  document: Document,
  t: Translate,
  selected: MapEditorTab,
  select: (tab: MapEditorTab) => void,
) {
  const element = document.createElement('div')
  element.className = 'map-editor-tabs'
  element.setAttribute('role', 'tablist')
  element.setAttribute('aria-label', t('maps.tabs'))

  const pages: Record<MapEditorTab, HTMLElement> = {
    paint: document.createElement('section'),
    terrain: document.createElement('section'),
    objects: document.createElement('section'),
    settings: document.createElement('section'),
  }

  const buttons = new Map<MapEditorTab, HTMLButtonElement>()

  for (const [index, id] of mapEditorTabIds.entries()) {
    const button = document.createElement('button')
    button.type = 'button'
    button.id = `map-tab-${id}`
    button.textContent = t(`maps.tabs.${id}`)
    button.setAttribute('role', 'tab')
    button.setAttribute('aria-selected', String(id === selected))
    button.setAttribute('aria-controls', `map-page-${id}`)
    button.tabIndex = id === selected ? 0 : -1
    button.addEventListener('click', () => select(id))
    button.addEventListener('keydown', (event) => {
      const next =
        event.key === 'ArrowRight'
          ? (index + 1) % mapEditorTabIds.length
          : event.key === 'ArrowLeft'
            ? (index + mapEditorTabIds.length - 1) % mapEditorTabIds.length
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? mapEditorTabIds.length - 1
                : undefined

      if (next === undefined || event.altKey || event.ctrlKey || event.metaKey) return
      event.preventDefault()
      select(mapEditorTabIds[next]!)
    })
    buttons.set(id, button)
    element.append(button)

    const page = pages[id]
    page.id = `map-page-${id}`
    page.className = `map-editor-page map-editor-page-${id}`
    page.setAttribute('role', 'tabpanel')
    page.setAttribute('aria-labelledby', button.id)
    page.hidden = id !== selected
  }

  return { element, pages, focus: () => buttons.get(selected)?.focus() }
}
