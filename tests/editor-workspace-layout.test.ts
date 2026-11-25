import { describe, expect, it, vi } from 'vite-plus/test'
import {
  bindWorkspaceLayout,
  explorerSizeRange,
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

function setup(values: Record<string, string>) {
  const compact = { matches: true }

  const shell = {
    dataset: { layout: '' },
    ownerDocument: { defaultView: { matchMedia: () => compact } },
  }

  const modes = Object.assign(new EventTarget(), { querySelectorAll: () => [] })

  const makeSplitter = () =>
    Object.assign(new EventTarget(), {
      dataset: {},
      setAttribute: vi.fn(),
      focus: vi.fn(),
      setPointerCapture: vi.fn(),
    })

  const explorerSplitter = makeSplitter()
  const previewSplitter = makeSplitter()
  const workbench = { scrollTop: 840 }
  const preview = { focus: vi.fn(), scrollIntoView: vi.fn(), style: { setProperty: vi.fn() } }

  const explorer = {
    style: { setProperty: vi.fn() },
    ownerDocument: { documentElement: {} },
    getBoundingClientRect: () => ({ width: 240 }),
  }

  const elements = {
    shell,
    modes,
    workbench,
    workspace: {},
    explorer,
    explorerSplitter,
    previewSplitter,
    preview,
  }

  // @ts-expect-error -- The layout uses only these DOM APIs.
  const binding = bindWorkspaceLayout(elements, storage(values))

  return { ...elements, compact, binding }
}

describe('workspace layout preferences', () => {
  it.each(['edit', 'split', 'preview'])(
    'returns to %s and the same scroll position after compact playback',
    (layout) => {
      const values = { 'ancadeba.editor.layout': layout }
      const { binding, shell, compact, workbench, preview } = setup(values)

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

  it('restores a stored layout and clamps the stored pane sizes', () => {
    expect(
      readLayoutPreferences(
        storage({
          'ancadeba.editor.layout': 'preview',
          'ancadeba.editor.previewSize': '95',
          'ancadeba.editor.explorerSize': '8',
        }),
      ),
    ).toEqual({
      layout: 'preview',
      previewSize: previewSizeRange.maximum,
      explorerSize: explorerSizeRange.minimum,
    })
  })

  it('falls back to the split layout when storage is empty, invalid, or unavailable', () => {
    const defaults = {
      layout: 'split',
      previewSize: previewSizeRange.initial,
      explorerSize: explorerSizeRange.initial,
    }

    expect(readLayoutPreferences(storage({}))).toEqual(defaults)
    expect(
      readLayoutPreferences(
        storage({
          'ancadeba.editor.layout': 'wide',
          'ancadeba.editor.previewSize': 'large',
          'ancadeba.editor.explorerSize': 'invalid',
        }),
      ),
    ).toEqual(defaults)
    expect(
      readLayoutPreferences(() => {
        throw new Error('Storage is blocked')
      }),
    ).toEqual(defaults)
  })

  it.each([
    ['explorerSplitter', 'ancadeba.editor.explorerSize', 15, 14, 12, 28],
    ['previewSplitter', 'ancadeba.editor.previewSize', 50, 55, 25, 80],
  ] as const)(
    'resizes and saves the pane using the %s keyboard controls',
    (handle, preference, initial, left, minimum, maximum) => {
      const values = { [preference]: String(initial) }
      const layout = setup(values)
      const splitter = layout[handle]

      const press = (key: string) =>
        splitter.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key }))

      try {
        expect(press('ArrowLeft')).toBe(false)
        expect(values[preference]).toBe(String(left))
        press('ArrowRight')
        expect(values[preference]).toBe(String(initial))
        press('Home')
        expect(values[preference]).toBe(String(minimum))
        press('End')
        press(handle === 'explorerSplitter' ? 'ArrowRight' : 'ArrowLeft')
        expect(values[preference]).toBe(String(maximum))
        expect(splitter.setAttribute).toHaveBeenCalledWith('aria-valuenow', String(maximum))
        expect(press('Enter')).toBe(true)
      } finally {
        layout.binding.dispose()
      }
    },
  )

  it('drags the explorer from its edge and restores its width independently of the preview', () => {
    const values = { 'ancadeba.editor.previewSize': '55' }
    const { explorerSplitter, explorer, binding } = setup(values)

    const pointer = (type: string, clientX: number) =>
      explorerSplitter.dispatchEvent(
        Object.assign(new Event(type), { pointerId: 1, button: 0, clientX }),
      )

    vi.stubGlobal('getComputedStyle', () => ({ fontSize: '16px' }))

    try {
      pointer('pointerdown', 320)
      pointer('pointermove', 384)
      expect(explorer.style.setProperty).toHaveBeenLastCalledWith('--explorer-size', '19rem')
      expect(Object.keys(values)).toEqual(['ancadeba.editor.previewSize'])
      pointer('pointerup', 384)
      expect(readLayoutPreferences(storage(values))).toEqual({
        layout: 'split',
        explorerSize: 19,
        previewSize: 55,
      })
      pointer('pointermove', 450)
      expect(explorer.style.setProperty).toHaveBeenLastCalledWith('--explorer-size', '19rem')
    } finally {
      binding.dispose()
      vi.unstubAllGlobals()
    }
  })
})
