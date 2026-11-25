export interface PaneSizeRange {
  minimum: number
  maximum: number
  initial: number
  step: number
}

export function clampPaneSize(size: number, range: PaneSizeRange): number {
  return Math.min(range.maximum, Math.max(range.minimum, size))
}

interface PaneSplitterOptions {
  pane: HTMLElement
  range: PaneSizeRange
  size: number
  side: 'left' | 'right'
  property: string
  unit: 'rem' | '%'
  pixelsPerUnit: () => number
  save: (size: number) => void
}

export function bindPaneSplitter(
  splitter: HTMLElement,
  { pane, range, size, side, property, unit, pixelsPerUnit, save }: PaneSplitterOptions,
  signal: AbortSignal,
) {
  const direction = side === 'left' ? 1 : -1
  let drag: { pointerId: number; startX: number; width: number; scale: number } | undefined

  const apply = (next: number) => {
    size = Number(clampPaneSize(next, range).toFixed(2))
    pane.style.setProperty(property, `${size}${unit}`)
    splitter.setAttribute('aria-valuenow', String(size))
    splitter.setAttribute('aria-valuetext', `${size}${unit}`)
  }

  splitter.setAttribute('aria-valuemin', String(range.minimum))
  splitter.setAttribute('aria-valuemax', String(range.maximum))
  apply(size)

  splitter.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || drag) return
      const scale = pixelsPerUnit()

      if (!(scale > 0)) return
      event.preventDefault()
      splitter.focus({ preventScroll: true })
      splitter.setPointerCapture(event.pointerId)
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        width: pane.getBoundingClientRect().width,
        scale,
      }
      splitter.dataset.dragging = ''
    },
    { signal },
  )
  splitter.addEventListener(
    'pointermove',
    (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return
      const delta = (event.clientX - drag.startX) * direction

      apply((drag.width + delta) / drag.scale)
    },
    { signal },
  )

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    splitter.addEventListener(
      type,
      (event) => {
        if (drag?.pointerId !== event.pointerId) return
        drag = undefined
        delete splitter.dataset.dragging
        save(size)
      },
      { signal },
    )
  }

  splitter.addEventListener(
    'keydown',
    (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          apply(size - direction * range.step)
          break
        case 'ArrowRight':
          apply(size + direction * range.step)
          break
        case 'Home':
          apply(range.minimum)
          break
        case 'End':
          apply(range.maximum)
          break
        default:
          return
      }

      event.preventDefault()
      save(size)
    },
    { signal },
  )
}
