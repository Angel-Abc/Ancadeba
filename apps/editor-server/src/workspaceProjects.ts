import { isPrivateProjectEntry, object, type ProjectChoice } from '@ancadeba/editor-core'
import { workspaceError, type WorkspaceService } from './workspace.js'
import { inspectProjectDirectory } from './projectBoundary.js'

function unavailable(error: unknown): boolean {
  return [400, 403, 404, 409].includes(workspaceError(error).status)
}

export async function listWorkspaceProjects(
  workspace: Pick<WorkspaceService, 'list' | 'read'>,
): Promise<ProjectChoice[]> {
  const pending: { path: string; parentManifest?: unknown }[] = [{ path: '' }]
  const projects: ProjectChoice[] = []

  for (const { path, parentManifest } of pending) {
    try {
      const { directories, manifest, kind, childOwner } = await inspectProjectDirectory(
        workspace,
        path,
        parentManifest,
      )

      if (kind === 'recoverable') projects.push({ path, title: '', missingManifest: true })

      if (kind === 'project') {
        const title = object(manifest).title
        projects.push({ path, title: typeof title === 'string' ? title.trim() : '' })
      }

      for (const directory of directories) {
        if (!isPrivateProjectEntry(directory))
          pending.push({
            path: path ? `${path}/${directory}` : directory,
            parentManifest: childOwner,
          })
      }
    } catch (error) {
      if (!path || !unavailable(error)) throw error
    }
  }

  return projects.sort((a, b) => a.path.localeCompare(b.path))
}
