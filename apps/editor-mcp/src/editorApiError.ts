import type { Diagnostic, EditorWriteOutcome } from '@ancadeba/editor-core'

export class EditorApiError extends Error {
  static projectNotSelected() {
    return new EditorApiError('project_not_selected', 'No project is selected for this connection.')
  }

  constructor(
    readonly code: string,
    message: string,
    readonly diagnostics: Diagnostic[] = [],
    readonly outcome: EditorWriteOutcome = 'not_applied',
    readonly status?: number,
  ) {
    super(message)
  }
}
