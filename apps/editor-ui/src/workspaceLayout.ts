import { bindPaneSplitter, clampPaneSize, type PaneSizeRange } from './paneSplitter.js'

export const workspaceLayouts = ['edit', 'split', 'preview'] as const
export const compactWorkspaceQuery = '(max-width: 960px)'

export type WorkspaceLayout = (typeof workspaceLayouts)[number]

export type LayoutStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface WorkspaceLayoutElements {
  shell: HTMLElement
  modes: HTMLElement
  workbench: HTMLElement
  workspace: HTMLElement
  explorer: HTMLElement
  explorerSplitter: HTMLElement
  previewSplitter: HTMLElement
  preview: HTMLElement
}

export interface WorkspaceLayoutPreferences {
  layout: WorkspaceLayout
  explorerSize: number
  previewSize: number
}

const layoutKey = 'ancadeba.editor.layout'
const explorerSizeKey = 'ancadeba.editor.explorerSize'
const previewSizeKey = 'ancadeba.editor.previewSize'

/** Project explorer width in rem. */
export const explorerSizeRange = { minimum: 12, maximum: 28, initial: 15, step: 1 }

/** Preview width as a percentage of the editor workspace; forms get the larger share by default. */
export const previewSizeRange = { minimum: 25, maximum: 80, initial: 40, step: 5 }

/** Stored values are per-viewer conveniences; anything unreadable falls back to defaults. */
export function readLayoutPreferences(storage: () => LayoutStorage): WorkspaceLayoutPreferences {
  const read = (key: string) => {
    try {
      return storage().getItem(key)
    } catch {
      return null
    }
  }

  const storedLayout = read(layoutKey)

  const readSize = (key: string, range: PaneSizeRange) => {
    const stored = Number(read(key))

    return Number.isFinite(stored) && stored > 0 ? clampPaneSize(stored, range) : range.initial
  }

  return {
    layout: workspaceLayouts.find((layout) => layout === storedLayout) ?? 'split',
    explorerSize: readSize(explorerSizeKey, explorerSizeRange),
    previewSize: readSize(previewSizeKey, previewSizeRange),
  }
}

export function bindWorkspaceLayout(
  {
    shell,
    modes,
    workbench,
    workspace,
    explorer,
    explorerSplitter,
    previewSplitter,
    preview,
  }: WorkspaceLayoutElements,
  storage: () => LayoutStorage,
) {
  const abort = new AbortController()
  const signal = abort.signal
  const preferences = readLayoutPreferences(storage)
  let layout = preferences.layout
  const compact = shell.ownerDocument.defaultView?.matchMedia(compactWorkspaceQuery)
  let beforePlayback: { layout: WorkspaceLayout; scrollTop: number } | undefined

  const write = (key: string, value: string) => {
    try {
      storage().setItem(key, value)
    } catch {
      // Without storage the layout still works for this session.
    }
  }

  const apply = () => {
    shell.dataset.layout = layout

    for (const button of modes.querySelectorAll<HTMLElement>('[data-layout-mode]'))
      button.setAttribute('aria-pressed', String(button.dataset.layoutMode === layout))
  }

  const setLayout = (next: WorkspaceLayout) => {
    beforePlayback = undefined
    layout = next
    write(layoutKey, next)
    apply()
  }

  bindPaneSplitter(
    explorerSplitter,
    {
      pane: explorer,
      range: explorerSizeRange,
      size: preferences.explorerSize,
      side: 'left',
      property: '--explorer-size',
      unit: 'rem',
      pixelsPerUnit: () =>
        Number.parseFloat(getComputedStyle(explorer.ownerDocument.documentElement).fontSize),
      save: (size) => write(explorerSizeKey, String(size)),
    },
    signal,
  )
  bindPaneSplitter(
    previewSplitter,
    {
      pane: preview,
      range: previewSizeRange,
      size: preferences.previewSize,
      side: 'right',
      property: '--preview-size',
      unit: '%',
      pixelsPerUnit: () => workspace.getBoundingClientRect().width / 100,
      save: (size) => write(previewSizeKey, String(size)),
    },
    signal,
  )

  modes.addEventListener(
    'click',
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-layout-mode]')
          : null

      const next = workspaceLayouts.find((layout) => layout === button?.dataset.layoutMode)

      if (next) setLayout(next)
    },
    { signal },
  )

  apply()

  const restoreAfterPlayback = () => {
    if (!beforePlayback) return false
    layout = beforePlayback.layout
    apply()
    workbench.scrollTop = beforePlayback.scrollTop
    beforePlayback = undefined

    return true
  }

  return {
    revealEditor(previewActive: boolean) {
      restoreAfterPlayback()

      if (layout === 'preview') setLayout(previewActive ? 'split' : 'edit')
    },
    revealPreview(this: void) {
      if (compact?.matches) {
        beforePlayback ??= { layout, scrollTop: workbench.scrollTop }
        layout = 'preview'
        apply()
        preview.scrollIntoView({ block: 'start' })
        preview.focus({ preventScroll: true })
      } else if (layout === 'edit') setLayout('split')
    },
    restoreAfterPlayback,
    dispose() {
      abort.abort()
    },
  }
}
