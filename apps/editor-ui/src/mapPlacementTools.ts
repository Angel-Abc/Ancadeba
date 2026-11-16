import type { Translate } from '@ancadeba/utilities'
import type { TilePoint } from './mapDraft.js'
import type { MapGridSelectionInteraction } from './mapTileGrid.js'
import type { RuleFormControls } from './ruleFormControls.js'

export type MapPlacementTool = 'object' | 'trigger'

export function mapPlacementTools(
  document: Document,
  controls: RuleFormControls,
  t: Translate,
  tool: MapPlacementTool,
  options: {
    disabled(): boolean
    select(tool: MapPlacementTool): void
    activate(point: TilePoint): void
    selected(point: TilePoint): boolean
    paint(): void
    historyActive(): boolean
    restore(direction: 'undo' | 'redo'): void
  },
) {
  const element = document.createElement('div')
  element.className = 'map-placement-tools'
  const help = document.createElement('p')
  help.className = 'help'
  help.textContent = t(tool === 'object' ? 'maps.objectHelp' : 'maps.entryGridHelp')
  element.append(
    controls.button(t('maps.editObjects'), () => options.select('object')),
    controls.button(t('maps.editEntryTriggers'), () => options.select('trigger')),
    help,
  )

  for (const [index, button] of element.querySelectorAll('button').entries())
    button.setAttribute('aria-pressed', String(tool === (index === 0 ? 'object' : 'trigger')))

  const interaction: MapGridSelectionInteraction = {
    tool: () => tool,
    start() {},
    drag() {},
    hover: () => false,
    move() {},
    activate(point) {
      if (!options.disabled()) options.activate(point)
    },
    keydown(event) {
      if (event.defaultPrevented || event.isComposing || event.repeat || options.disabled())
        return false
      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey

      if (event.altKey) return false

      const direction =
        modifier && ((key === 'z' && event.shiftKey) || (key === 'y' && !event.shiftKey))
          ? 'redo'
          : modifier && key === 'z' && !event.shiftKey
            ? 'undo'
            : undefined

      if (direction && options.historyActive()) {
        event.preventDefault()
        event.stopPropagation()
        options.restore(direction)

        return true
      }

      if (modifier && !event.shiftKey && ['c', 'x', 'v'].includes(key)) {
        event.preventDefault()
        event.stopPropagation()

        return true
      }

      if (!modifier && !event.shiftKey && key === 'escape') {
        event.preventDefault()
        event.stopPropagation()
        options.paint()

        return true
      }

      return false
    },
    decorate(cell, point) {
      const selected = options.selected(point)
      cell.classList.toggle('map-tile-trigger-selected', selected)
      cell.classList.toggle('map-tile-selected', selected)
      cell.setAttribute('aria-selected', String(selected))
    },
  }

  return { element, interaction }
}
