import type { MessageHistoryComponentDefinition, MessageHistoryEntry } from '@ancadeba/schemas'
import type {
  ComponentRenderContext,
  IComponentRenderer,
  RenderedComponent,
} from './componentRendering.js'

export class MessageHistoryComponentRenderer implements IComponentRenderer<MessageHistoryComponentDefinition> {
  render(
    component: MessageHistoryComponentDefinition,
    context: ComponentRenderContext,
  ): RenderedComponent {
    const { document, scene } = context
    const game = scene?.type === 'game' ? scene.game : context.suspendedGame
    const root = document.createElement('section')
    root.className = 'ancadeba-message-history'
    const heading = document.createElement('h2')
    heading.textContent = component.label
    const log = document.createElement('div')
    log.setAttribute('role', 'log')
    log.setAttribute('aria-label', component.label)
    log.tabIndex = 0
    const content = document.createElement('div')
    log.append(content)
    root.append(heading, log)

    let previous: readonly MessageHistoryEntry[] | undefined
    let scrollRemainder = 0
    const rows = new Map<MessageHistoryEntry, HTMLElement>()

    const update = () => {
      const entries = game?.messageHistory

      if (!entries || entries === previous) return

      // The reversed scroll container starts at the newest row, including on remount.
      // The rows themselves stay in reading order for selection and screen readers.
      const last = previous?.at(-1)
      const anchor = log.scrollTop < -1 && last ? rows.get(last) : undefined
      const top = anchor?.getBoundingClientRect().top
      const retained = new Set(entries)

      for (const [entry, row] of rows) {
        if (retained.has(entry)) continue
        row.remove()
        rows.delete(entry)
      }

      for (const entry of entries) {
        if (rows.has(entry)) continue
        const row = document.createElement('p')
        row.className = `ancadeba-message-history-${entry.kind}`
        row.textContent = entry.text
        content.append(row)
        rows.set(entry, row)
      }

      if (anchor && top !== undefined && content.contains(anchor)) {
        const target = log.scrollTop + anchor.getBoundingClientRect().top - top + scrollRemainder
        log.scrollTop = target
        // Wrapped lines and margins can be fractional even when the browser rounds scrollTop.
        const remainder = target - log.scrollTop
        scrollRemainder = Math.abs(remainder) < 1 ? remainder : 0
      } else {
        log.scrollTop = anchor ? -log.scrollHeight : 0
        scrollRemainder = 0
      }

      previous = entries
    }

    update()
    const releaseBindings = game?.bindings?.subscribeChanges(update)
    const releaseDialogue = game?.dialogue?.subscribeChanges(update)

    return {
      element: root,
      dispose() {
        releaseBindings?.()
        releaseDialogue?.()
        root.remove()
      },
    }
  }
}
