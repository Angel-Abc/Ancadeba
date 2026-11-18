import { stylesheetPathSchema } from '@ancadeba/schemas'
import type { WorkspaceService } from './workspace.js'
import { inspectProjectDirectory } from './projectBoundary.js'
import { workspaceError } from './workspace.js'

const ignoredDirectories = new Set(['node_modules', 'dist', 'coverage'])

/** Find reusable project CSS without traversing dependency/build folders or nested games. */
export async function projectStylesheets(
  workspace: Pick<WorkspaceService, 'list' | 'read'>,
  folder: string,
  excludedDirectory?: string,
) {
  const pending: { directory: string; owner: unknown }[] = [{ directory: '', owner: undefined }]

  const path = (directory: string) =>
    folder ? (directory ? `${folder}/${directory}` : folder) : directory

  const files: string[] = []

  for (const { directory, owner } of pending) {
    let listing

    try {
      listing = await inspectProjectDirectory(workspace, path(directory), owner)
    } catch (error) {
      if ([400, 403, 404, 409].includes(workspaceError(error).status)) continue
      throw error
    }

    if (directory && listing.kind !== 'directory') continue

    for (const entry of listing.entries) {
      const file = directory ? `${directory}/${entry.name}` : entry.name

      if (entry.type === 'file' && stylesheetPathSchema.safeParse(file).success) files.push(file)

      if (
        entry.type === 'directory' &&
        !entry.name.toLowerCase().startsWith('.ancadeba-') &&
        file !== excludedDirectory &&
        !ignoredDirectories.has(entry.name.toLowerCase()) &&
        stylesheetPathSchema.safeParse(`${file}/style.css`).success
      )
        pending.push({ directory: file, owner: listing.childOwner ?? null })
    }
  }

  return files.sort()
}
