import type { EditorFeatures, ProjectChoice } from '@ancadeba/editor-core'
import { BrowserGraphicResources, createGraphicPlatform } from '@ancadeba/ui-components'
import type { IGraphicResources } from '@ancadeba/ui-components'
import { HttpEditorClient, type IEditorClient } from './editorClient.js'
import { EditorDraftStore, type EditorDraftStorage } from './editorDraftStore.js'
import { EditorWorkspaceResources } from './workspaceResources.js'

export interface ProjectDiscoveryClient {
  listProjects(signal: AbortSignal): Promise<ProjectChoice[]>
  capabilities(signal?: AbortSignal): Promise<EditorFeatures>
}

export interface ProjectPanelDependencies {
  client: IEditorClient & ProjectDiscoveryClient
  fetcher: typeof fetch
  createGraphics: (path: string) => IGraphicResources & { dispose(): void }
  createDraftStore: (storage: () => EditorDraftStorage | undefined) => EditorDraftStore
  now: () => number
}

/** Browser composition; bindings receive instances and factories, never build transports. */
export function createProjectPanelDependencies(
  fetcher: typeof fetch,
  document: Document,
): ProjectPanelDependencies {
  return {
    client: new HttpEditorClient(fetcher),
    fetcher,
    createGraphics: (path) =>
      new BrowserGraphicResources(
        new EditorWorkspaceResources(path, fetcher),
        createGraphicPlatform(document),
      ),
    createDraftStore: (storage) => new EditorDraftStore(storage, crypto.randomUUID()),
    now: () => Date.now(),
  }
}
