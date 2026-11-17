import { describe, expect, it, vi } from 'vite-plus/test'
import {
  ProjectSectionRegistry,
  projectSelection,
  type ProjectSectionParticipant,
} from '../apps/editor-ui/src/projectSectionRegistry.js'
import type { ProjectEditorState } from '../apps/editor-ui/src/projectController.js'

const state: ProjectEditorState = {
  path: 'game',
  busy: false,
  error: '',
  conflict: false,
  changedElsewhere: false,
  lastCommand: null,
  preserveDrafts: true,
}

const selection = (section: string) =>
  projectSelection({ key: section, section, kind: 'section', label: section })

const definition = (participant: ProjectSectionParticipant) => ({ create: () => participant })

describe('workspace section registry', () => {
  it('selects one primary and matching adjuncts, with a read-only fallback', () => {
    const show = vi.fn()
    const adjunct = vi.fn()
    const fallback = vi.fn()

    const registry = new ProjectSectionRegistry([
      definition({
        id: 'maps',
        role: 'primary',
        matches: ({ node }) => node.section === 'maps',
        activate: show,
      }),
      definition({
        id: 'tools',
        role: 'adjunct',
        matches: ({ node }) => node.section === 'maps',
        activate: adjunct,
      }),
      definition({ id: 'read-only', role: 'fallback', matches: () => true, activate: fallback }),
    ])

    expect(registry.navigate(selection('maps'))).toBe(true)
    expect(show).toHaveBeenCalledOnce()
    expect(adjunct).toHaveBeenCalledOnce()
    expect(fallback).not.toHaveBeenCalled()
    registry.navigate(selection('unknown'))
    expect(registry.primaryId).toBe('read-only')
    expect(fallback).toHaveBeenCalledOnce()
  })

  it('checks all guards before any target, visibility or activation changes', () => {
    const activate = vi.fn()
    const visible = vi.fn()

    const registry = new ProjectSectionRegistry([
      definition({
        id: 'first',
        role: 'primary',
        matches: () => true,
        canNavigate: () => true,
        activate,
        setVisible: visible,
      }),
      definition({ id: 'dirty', role: 'adjunct', matches: () => false, canNavigate: () => false }),
    ])

    expect(registry.navigate(selection('other'))).toBe(false)
    expect(activate).not.toHaveBeenCalled()
    expect(visible).not.toHaveBeenCalled()
    expect(registry.primaryId).toBeUndefined()
  })

  it('renders hidden editors and aggregates drafts with named exclusions', () => {
    const render = vi.fn()

    const registry = new ProjectSectionRegistry([
      definition({
        id: 'hidden',
        role: 'primary',
        matches: () => false,
        render,
        hasDrafts: () => true,
      }),
    ])

    registry.render(state, false)
    expect(render).toHaveBeenCalledWith(state, false)
    expect(registry.hasDrafts()).toBe(true)
    expect(registry.hasDrafts(['hidden'])).toBe(false)
  })

  it('refreshes an unchanged selection and activates it on explicit navigation or a project change', () => {
    const activate = vi.fn()
    const refresh = vi.fn()

    const registry = new ProjectSectionRegistry([
      definition({ id: 'rules', role: 'primary', matches: () => true, activate, refresh }),
    ])

    registry.render(state, true)
    registry.navigate(selection('rules'))
    registry.render({ ...state, busy: true }, false)
    registry.show(selection('rules'))
    expect(activate).toHaveBeenCalledOnce()
    expect(refresh).toHaveBeenCalledOnce()
    registry.navigate(selection('rules'))
    expect(activate).toHaveBeenCalledTimes(2)
    registry.render({ ...state, path: 'other' }, true)
    registry.show(selection('rules'))
    expect(activate).toHaveBeenCalledTimes(3)
    registry.show(selection('another-selection'))
    expect(activate).toHaveBeenCalledTimes(4)
  })

  it('reactivates the selected editor after a full field reset', () => {
    const activate = vi.fn()
    const refresh = vi.fn()

    const registry = new ProjectSectionRegistry([
      definition({ id: 'rules', role: 'primary', matches: () => true, activate, refresh }),
    ])

    registry.render(state, true)
    registry.navigate(selection('rules'))
    registry.render({ ...state, preserveDrafts: false }, true)
    registry.show(selection('rules'))
    expect(activate).toHaveBeenCalledTimes(2)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('dispatches history and shortcuts only to active participants', () => {
    const restore = vi.fn()
    const shortcut = vi.fn(() => true)

    const history = {
      state: () => ({ active: true, blocked: false, canUndo: true, canRedo: false }),
      restore,
    }

    const registry = new ProjectSectionRegistry([
      definition({
        id: 'maps',
        role: 'primary',
        matches: ({ node }) => node.section === 'maps',
        history,
        shortcuts: { run: shortcut },
      }),
    ])

    registry.navigate(selection('maps'))
    registry.history?.restore('undo')
    expect(restore).toHaveBeenCalledWith('undo')
    expect(registry.shortcut('copy')).toBe(true)
    registry.navigate(selection('elsewhere'))
    expect(registry.history).toBeUndefined()
    expect(registry.shortcut('copy')).toBe(false)
    expect(shortcut).toHaveBeenCalledOnce()
  })

  it('accepts custom section definitions and delegates selection reconciliation', () => {
    const custom = { id: 'custom', labelKey: 'custom.title', nodes: () => [] }

    const registry = new ProjectSectionRegistry([
      {
        tree: custom,
        create: () => ({
          id: 'custom',
          role: 'primary',
          matches: ({ node }) => node.section === custom.id,
          reconcile: (node) => ({ ...node, label: 'Reconciled' }),
        }),
      },
    ])

    expect(registry.sections).toEqual([custom])
    expect(registry.navigate(selection('custom'))).toBe(true)
    expect(registry.primaryId).toBe('custom')
    expect(registry.reconcile(selection('custom').node, state, true).label).toBe('Reconciled')
  })

  it('disposes each participant once, including hidden participants when another cleanup throws', () => {
    const dispose = vi.fn()

    const registry = new ProjectSectionRegistry([
      definition({ id: 'hidden', role: 'adjunct', matches: () => false, dispose }),
      definition({
        id: 'broken',
        role: 'adjunct',
        matches: () => false,
        dispose: () => {
          throw new Error('cleanup')
        },
      }),
    ])

    expect(() => registry.dispose()).toThrow(AggregateError)
    registry.dispose()
    expect(dispose).toHaveBeenCalledOnce()
    expect(registry.navigate(selection('custom'))).toBe(false)
  })

  it('rejects ambiguous primary registrations before activating an editor', () => {
    const activate = vi.fn()

    const registry = new ProjectSectionRegistry(
      ['one', 'two'].map((id) =>
        definition({ id, role: 'primary', matches: () => true, activate }),
      ),
    )

    expect(() => registry.navigate(selection('custom'))).toThrow('Multiple primary')
    expect(activate).not.toHaveBeenCalled()
  })
})
