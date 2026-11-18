import { describe, expect, it, vi } from 'vite-plus/test'
import {
  bindWorkspaceLayout,
  previewSizeAfterKey,
  previewSizeRange,
  readLayoutPreferences,
  type LayoutStorage,
} from '../apps/editor-ui/src/workspaceLayout.js'

function storage(values: Record<string, string>): () => LayoutStorage {
  return () => ({
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value
    },
  })
}

describe('workspace layout preferences', () => {
  it.each(['edit', 'split', 'preview'])(
    'returns to %s and the same scroll position after compact playback',
    (layout) => {
      const compact = { matches: true }

      const shell = {
        dataset: { layout },
        ownerDocument: { defaultView: { matchMedia: () => compact } },
      }

      const modes = Object.assign(new EventTarget(), { querySelectorAll: () => [] })
      const splitter = Object.assign(new EventTarget(), { setAttribute: vi.fn() })
      const workbench = { scrollTop: 840 }
      const preview = { focus: vi.fn(), scrollIntoView: vi.fn(), style: { setProperty: vi.fn() } }
      const values = { 'ancadeba.editor.layout': layout }

      const binding = bindWorkspaceLayout(
        // @ts-expect-error -- Only the elements' layout, focus and event APIs are needed here.
        { shell, modes, workbench, workspace: {}, splitter, preview },
        storage(values),
      )

      try {
        binding.revealPreview()
        expect(shell.dataset.layout).toBe('preview')
        expect(values['ancadeba.editor.layout']).toBe(layout)
        expect(preview.scrollIntoView).toHaveBeenCalledOnce()
        expect(preview.focus).toHaveBeenCalledOnce()
        workbench.scrollTop = 70
        binding.restoreAfterPlayback()
        expect(shell.dataset.layout).toBe(layout)
        expect(workbench.scrollTop).toBe(840)

        compact.matches = false
        binding.revealPreview()
        expect(shell.dataset.layout).toBe(layout === 'edit' ? 'split' : layout)
        expect(preview.scrollIntoView).toHaveBeenCalledOnce()
        expect(binding.restoreAfterPlayback()).toBe(false)
      } finally {
        binding.dispose()
      }
    },
  )

  it('restores a stored layout and clamps the stored preview size', () => {
    expect(
      readLayoutPreferences(
        storage({ 'ancadeba.editor.layout': 'preview', 'ancadeba.editor.previewSize': '95' }),
      ),
    ).toEqual({ layout: 'preview', previewSize: previewSizeRange.maximum })
  })

  it('falls back to the split layout when storage is empty, invalid, or unavailable', () => {
    const defaults = { layout: 'split', previewSize: previewSizeRange.initial }

    expect(readLayoutPreferences(storage({}))).toEqual(defaults)
    expect(
      readLayoutPreferences(
        storage({ 'ancadeba.editor.layout': 'wide', 'ancadeba.editor.previewSize': 'large' }),
      ),
    ).toEqual(defaults)
    expect(
      readLayoutPreferences(() => {
        throw new Error('Storage is blocked')
      }),
    ).toEqual(defaults)
  })

  it('resizes the preview from the splitter keyboard keys within the allowed range', () => {
    expect(previewSizeAfterKey(50, 'ArrowLeft')).toBe(55)
    expect(previewSizeAfterKey(50, 'ArrowRight')).toBe(45)
    expect(previewSizeAfterKey(previewSizeRange.maximum, 'ArrowLeft')).toBe(
      previewSizeRange.maximum,
    )
    expect(previewSizeAfterKey(55, 'Home')).toBe(previewSizeRange.minimum)
    expect(previewSizeAfterKey(55, 'End')).toBe(previewSizeRange.maximum)
    expect(previewSizeAfterKey(55, 'Enter')).toBeUndefined()
  })
})
