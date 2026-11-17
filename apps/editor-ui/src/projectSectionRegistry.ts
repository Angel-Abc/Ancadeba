import type { ProjectView } from '@ancadeba/editor-core'
import type { ProjectEditorState } from './projectController.js'
import { dataFileContent, type ProjectTreeNode, type ProjectTreeSection } from './projectTree.js'

export function projectSelection(node: ProjectTreeNode, view?: ProjectView) {
  const sceneId =
    node.section === 'scenes' ? (node.kind === 'scene' ? node.id : node.parentId) : undefined

  const scene = view?.scenes.find((entry) => entry.id === sceneId)

  const component =
    node.kind === 'component' ? scene?.components.find((entry) => entry.id === node.id) : undefined

  return {
    node,
    view,
    sceneId,
    scene,
    component,
    resource: view ? dataFileContent(view, node) : undefined,
  }
}

export type ProjectSelection = ReturnType<typeof projectSelection>

export interface SectionHistory {
  state(): { active: boolean; blocked: boolean; canUndo: boolean; canRedo: boolean }
  restore(direction: 'undo' | 'redo'): void
}

export interface SectionShortcuts {
  run(action: 'copy' | 'paste' | 'duplicate' | 'delete'): boolean
}

export interface ProjectSectionParticipant {
  readonly id: string
  readonly role: 'primary' | 'adjunct' | 'fallback'
  label?(): string | undefined
  matches(selection: ProjectSelection): boolean
  canNavigate?(selection: ProjectSelection): boolean
  activate?(selection: ProjectSelection): void
  /** Refresh an unchanged selection without replaying navigation; defaults to activate. */
  refresh?(selection: ProjectSelection): void
  selectionChanged?(selection: ProjectSelection): void
  afterRestore?(): void
  setVisible?(visible: boolean): void
  render?(state: ProjectEditorState, replaceFields: boolean): void
  hasDrafts?(): boolean
  reconcile?(
    selection: ProjectTreeNode,
    state: ProjectEditorState,
    replaceFields: boolean,
  ): ProjectTreeNode
  dispose?(): void
  readonly history?: SectionHistory
  readonly shortcuts?: SectionShortcuts
}

export interface ProjectSectionDefinition {
  readonly tree?: ProjectTreeSection
  create(): ProjectSectionParticipant
}

/** Owns registrations for one panel, including hidden editors with retained drafts. */
export class ProjectSectionRegistry {
  private readonly participants: ProjectSectionParticipant[]
  private active: ProjectSectionParticipant[] = []
  private selectedKey: string | undefined
  private path: string | undefined
  private disposed = false
  readonly sections: ProjectTreeSection[]

  constructor(definitions: readonly ProjectSectionDefinition[]) {
    this.participants = []
    this.sections = []

    try {
      for (const definition of definitions) {
        const participant = definition.create()

        if (this.participants.some((entry) => entry.id === participant.id)) {
          participant.dispose?.()
          throw new Error(`Duplicate workspace participant: ${participant.id}`)
        }

        this.participants.push(participant)

        if (definition.tree) this.sections.push(definition.tree)
      }
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  private resolve(selection: ProjectSelection) {
    const matches = this.participants.filter((entry) => entry.matches(selection))
    const primary = matches.filter((entry) => entry.role === 'primary')

    if (primary.length > 1) throw new Error('Multiple primary workspace editors matched')
    const owner = primary[0] ?? matches.find((entry) => entry.role === 'fallback')

    return [...(owner ? [owner] : []), ...matches.filter((entry) => entry.role === 'adjunct')]
  }

  navigate(selection: ProjectSelection): boolean {
    if (this.disposed) return false
    const next = this.resolve(selection)

    if (this.participants.some((entry) => entry.canNavigate?.(selection) === false)) return false
    this.activate(selection, next, true)

    return true
  }

  show(selection: ProjectSelection) {
    if (!this.disposed) this.activate(selection, this.resolve(selection))
  }

  private activate(
    selection: ProjectSelection,
    next: ProjectSectionParticipant[],
    explicitNavigation = false,
  ) {
    const previous = this.active
    const changed = this.selectedKey !== selection.node.key
    this.selectedKey = selection.node.key
    this.active = next

    for (const participant of this.participants)
      participant.setVisible?.(next.includes(participant))

    for (const participant of next) {
      if (!explicitNavigation && !changed && previous.includes(participant) && participant.refresh)
        participant.refresh(selection)
      else participant.activate?.(selection)
    }

    for (const participant of this.participants) participant.selectionChanged?.(selection)
  }

  render(state: ProjectEditorState, replaceFields: boolean) {
    if (this.disposed) return

    if (this.path !== state.path || (replaceFields && !state.preserveDrafts))
      this.selectedKey = undefined
    this.path = state.path

    for (const participant of this.participants) participant.render?.(state, replaceFields)
  }

  afterRestore() {
    for (const participant of this.participants) participant.afterRestore?.()
  }

  hasDrafts(exclude: readonly string[] = []) {
    return this.participants.some((entry) => !exclude.includes(entry.id) && entry.hasDrafts?.())
  }

  reconcile(node: ProjectTreeNode, state: ProjectEditorState, replaceFields: boolean) {
    return this.participants.reduce(
      (current, entry) => entry.reconcile?.(current, state, replaceFields) ?? current,
      node,
    )
  }

  get activeLabel() {
    return this.active.find((entry) => entry.role === 'primary')?.label?.()
  }

  get primaryId() {
    return this.active.find((entry) => entry.role !== 'adjunct')?.id
  }

  get history() {
    return this.active.find((entry) => entry.history)?.history
  }

  shortcut(action: Parameters<SectionShortcuts['run']>[0]) {
    return this.active.some((entry) => entry.shortcuts?.run(action))
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    const errors: unknown[] = []

    for (const entry of [...this.participants].reverse()) {
      try {
        entry.dispose?.()
      } catch (error) {
        errors.push(error)
      }
    }

    this.active = []

    if (errors.length) throw new AggregateError(errors, 'Workspace section cleanup failed')
  }
}
