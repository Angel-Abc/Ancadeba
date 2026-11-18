import { createProjectSections } from './projectSectionComposition.js'
import {
  ProjectSectionRegistry,
  projectSelection,
  type ProjectSectionDefinition,
} from './projectSectionRegistry.js'
import type { ProjectPanelDependencies } from './projectPanelDependencies.js'
import { renderSceneNavigation } from './sceneNavigation.js'
import { compactWorkspaceQuery } from './workspaceLayout.js'
import { refreshSaveStatuses } from './formSaveStatus.js'
import { captureEditorDrafts, restoreEditorDrafts } from './editorDraftState.js'
import { type EditorDraftStorage } from './editorDraftStore.js'
import { bindEditorDraftRecovery } from './editorDraftRecovery.js'
import { normalizeGameFolder } from './workspaceResources.js'
import type { ProjectView, ProjectChoice, EditorFeatures } from '@ancadeba/editor-core'
import { createProjectRequestSchema, duplicateProjectRequestSchema } from '@ancadeba/editor-core'
import { ProjectEditorController, type ProjectEditorListener } from './projectController.js'
import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { bindProjectTree } from './projectTreeView.js'
import { bindSectionRail } from './sectionRail.js'
import { bindEditorShortcuts } from './editorShortcuts.js'
import { bindProjectManagementPanel } from './projectManagementPanel.js'
import { bindProjectArchivePanel } from './projectArchivePanel.js'
import { createEditorConfirmation, type ConfirmAction } from './editorConfirmation.js'
import {
  buildProjectTree,
  flattenProjectTree,
  sceneTitle,
  gameTitle,
  type ProjectTreeNode,
} from './projectTree.js'

export interface ProjectPanelBinding {
  hasDrafts(): boolean
  confirm: ReturnType<typeof createEditorConfirmation>['ask']
  dispose(): void
}

export function bindProjectPanel(
  root: HTMLElement,
  dependencies: ProjectPanelDependencies,
  t: Translate = editorLocalization().t,
  subscribeLanguageChanges?: (listener: () => void) => () => void,
  {
    sectionDefinitions = [],
    onProjectChange,
    onProjectClose,
    onSceneSelect,
    onNavigate,
    confirmDiscardDrafts,
    confirmDelete: confirmDeletion,
    draftStorage = () => root.ownerDocument.defaultView?.localStorage,
  }: {
    sectionDefinitions?: readonly ProjectSectionDefinition[]
    onProjectChange?: (path: string, storageKey?: string) => void
    onProjectClose?: () => void
    /** Reports the scene of the explorer selection, or undefined outside the scenes section. */
    onSceneSelect?: (scene: { id: string; title: string } | undefined) => void
    onNavigate?: () => void
    confirmDiscardDrafts?: () => boolean | Promise<boolean>
    confirmDelete?: ConfirmAction
    draftStorage?: () => EditorDraftStorage | undefined
  } = {},
): ProjectPanelBinding {
  const confirmation = createEditorConfirmation(root.ownerDocument, t)
  const confirmDelete = confirmDeletion ?? confirmation.ask

  const find = <T extends HTMLElement>(id: string): T => {
    const element = root.querySelector<T>(`#${id}`)

    if (!element) throw new Error(`Missing editor element: ${id}`)

    return element
  }

  const folder = find<HTMLSelectElement>('editor-folder')
  const load = find<HTMLButtonElement>('editor-load')
  const reload = find<HTMLButtonElement>('editor-reload')
  const undo = find<HTMLButtonElement>('editor-undo')
  const redo = find<HTMLButtonElement>('editor-redo')
  const fields = find<HTMLFieldSetElement>('editor-fields')
  const status = find<HTMLElement>('editor-status')
  const error = find<HTMLElement>('editor-error')
  const header = find<HTMLElement>('editor-header')
  const workspace = find<HTMLElement>('editor-workspace')
  const openControls = find<HTMLFormElement>('project-open-controls')
  const openToggle = find<HTMLButtonElement>('project-open-toggle')
  const openFeedback = find<HTMLElement>('project-open-feedback')
  const newToggle = find<HTMLButtonElement>('project-new-toggle')
  const newForm = find<HTMLFormElement>('project-create-controls')
  const newFields = find<HTMLFieldSetElement>('project-create-fields')
  const newSubmit = find<HTMLButtonElement>('project-create-submit')
  const newCancel = find<HTMLButtonElement>('project-create-cancel')
  const newError = find<HTMLElement>('project-create-error')
  const duplicateToggle = find<HTMLButtonElement>('project-duplicate-toggle')
  const duplicateForm = find<HTMLFormElement>('project-duplicate-controls')
  const duplicateFields = find<HTMLFieldSetElement>('project-duplicate-fields')
  const duplicateSubmit = find<HTMLButtonElement>('project-duplicate-submit')
  const duplicateCancel = find<HTMLButtonElement>('project-duplicate-cancel')
  const duplicateError = find<HTMLElement>('project-duplicate-error')
  const recoverToggle = root.querySelector<HTMLButtonElement>('#project-recover-toggle')
  const recoverForm = root.querySelector<HTMLFormElement>('#project-recover-controls')
  const recoverFields = root.querySelector<HTMLFieldSetElement>('#project-recover-fields')
  const recoverFolder = root.querySelector<HTMLInputElement>('#project-recover-folder')
  const recoverCancel = root.querySelector<HTMLButtonElement>('#project-recover-cancel')
  const explorerToggle = root.querySelector<HTMLButtonElement>('#explorer-toggle')
  const compact = root.ownerDocument.defaultView?.matchMedia?.(compactWorkspaceQuery)

  const setExplorerExpanded = (expanded: boolean) =>
    explorerToggle?.setAttribute('aria-expanded', String(expanded))

  const value = (id: string) => find<HTMLInputElement>(id).value

  const showOpenControls = (show: boolean) => {
    if (show) setExplorerExpanded(true)
    openControls.hidden = !show
    openToggle.setAttribute('aria-expanded', String(show))

    if (!show) {
      newForm.hidden = true
      newToggle.setAttribute('aria-expanded', 'false')
      duplicateForm.hidden = true
      duplicateToggle.setAttribute('aria-expanded', 'false')

      if (recoverForm) recoverForm.hidden = true
      recoverToggle?.setAttribute('aria-expanded', 'false')
    }
  }

  const set = (id: string, text: string | number) => {
    find<HTMLInputElement>(id).value = String(text)
  }

  let view: ProjectView | undefined

  let loadedPath = ''
  let preferredScene: string | undefined
  let busy = false
  let historyBlocked = false
  let openingProject = false
  let creatingProject = false
  let duplicatingProject = false

  let openError = ''
  let discoveryError: string | undefined
  let discovery: AbortController | undefined
  let projectChoices: ProjectChoice[] = []
  let features: EditorFeatures | undefined
  const { client } = dependencies
  let tree: ReturnType<typeof bindProjectTree> | undefined

  const renderOpenControls = () => {
    const disabled = busy || Boolean(discovery) || !projectChoices.length
    folder.disabled = disabled
    load.disabled = disabled
    newToggle.disabled = busy || !features?.projectCreation
    duplicateToggle.disabled =
      !features?.projectDuplication || busy || !view?.game || Boolean(view.diagnostics.length)
    duplicateFields.disabled = busy
    duplicateSubmit.disabled = duplicateToggle.disabled
    duplicateSubmit.textContent = t(
      duplicatingProject ? 'project.duplicating' : 'project.duplicate',
    )

    if (recoverToggle) recoverToggle.disabled = busy

    if (recoverFields) recoverFields.disabled = busy
    newFields.disabled = busy || !features?.projectCreation
    newSubmit.disabled = busy || !features?.projectCreation || Boolean(discovery)
    newSubmit.textContent = t(creatingProject ? 'project.creating' : 'project.create')

    let message = openError

    if (discovery) message = t('project.discovering')
    else if (openingProject) message = t('project.working')
    else if (discoveryError) message = t('project.listError', { message: discoveryError })
    else if (!projectChoices.length && !message) message = t('project.emptyList')

    openFeedback.textContent = message
    openFeedback.hidden = !message
  }

  const renderProjectChoices = (preferredPath: string) => {
    folder.replaceChildren(
      ...projectChoices.map(({ path, title, missingManifest }) => {
        const option = root.ownerDocument.createElement('option')
        const location = path || t('workspace.root')
        option.value = path
        option.textContent = title && title !== location ? `${title} (${location})` : location

        if (missingManifest) option.textContent = t('recovery.choice', { path: location })

        return option
      }),
    )
    folder.value = projectChoices.some(({ path }) => path === preferredPath)
      ? preferredPath
      : (projectChoices[0]?.path ?? '')
  }

  const refreshProjects = async (focus = false) => {
    discovery?.abort()
    const request = new AbortController()
    discovery = request
    discoveryError = undefined
    openError = ''
    renderOpenControls()

    try {
      const [choices, advertised] = await Promise.all([
        client.listProjects(request.signal),
        client.capabilities(request.signal),
      ])

      if (!request.signal.aborted) {
        projectChoices = choices
        features = advertised
        management?.setFeatures(advertised)
        archivePanel?.setFeatures(advertised)
      }
    } catch (error) {
      if (!request.signal.aborted) {
        discoveryError = error instanceof Error ? error.message : String(error)
      }
    }

    if (request.signal.aborted) return

    discovery = undefined
    renderProjectChoices(loadedPath)
    renderOpenControls()

    if (focus && !openControls.hidden && root.ownerDocument.activeElement === openToggle) {
      folder.focus()
    }
  }

  let selection: ProjectTreeNode = {
    key: 'game',
    section: 'game',
    kind: 'section',
    label: t('project.properties'),
  }

  const treeElement = root.querySelector<HTMLElement>('#project-tree')
  const mapHistory = () => registry.history?.state()

  const renderHistoryControls = () => {
    const local = mapHistory()
    undo.textContent = t('history.undo')
    redo.textContent = t('history.redo')

    if (local?.active) {
      undo.disabled = local.blocked || !local.canUndo
      redo.disabled = local.blocked || !local.canRedo
      undo.title = t('maps.undoDraft')
      redo.title = t('maps.redoDraft')
    } else {
      undo.disabled = busy || historyBlocked || !view?.history?.canUndo
      redo.disabled = busy || historyBlocked || !view?.history?.canRedo
      undo.title = view?.history?.undoLabel
        ? t('history.undoLabel', { change: view.history.undoLabel })
        : t('history.undo')
      redo.title = view?.history?.redoLabel
        ? t('history.redoLabel', { change: view.history.redoLabel })
        : t('history.redo')
    }
  }

  const railElement = treeElement && root.querySelector<HTMLElement>('#section-rail')
  const sceneList = treeElement && root.querySelector<HTMLElement>('#scene-list')
  const sceneActions = treeElement && root.querySelector<HTMLElement>('#scene-header-actions')
  let rail: ReturnType<typeof bindSectionRail> | undefined

  const showSelection = (activate = true) => {
    if (!treeElement) return

    const node = selection

    const context = projectSelection(node, view)
    const { component, resource: dataFile } = context

    if (activate) registry.show(context)

    if (sceneList && sceneActions)
      renderSceneNavigation(
        sceneList,
        sceneActions,
        node,
        (key) => tree?.select(key),
        t,
        busy,
        fields.disabled,
      )
    const details = registry.primaryId === 'read-only'
    find('component-details').hidden = !details
    const dataGroup = node.kind === 'data-group'
    const dataRoot = node.section === 'data' && node.kind === 'section'
    const editSection = sections.find((section) => section.id === dataFile?.editSection)
    find('component-help').textContent = dataRoot
      ? t('tree.dataRoot')
      : dataGroup
        ? t('tree.dataGroup')
        : editSection
          ? t('tree.editFileIn', { section: t(editSection.labelKey) })
          : t(dataFile ? 'tree.readOnlyFile' : 'tree.readOnly')
    find('component-json').textContent = dataFile
      ? JSON.stringify(dataFile.content, null, 2)
      : component
        ? JSON.stringify(component, null, 2)
        : ''

    const sectionLabel = t(
      sections.find((section) => section.id === node.section)?.labelKey ?? node.label,
    )

    // The eyebrow names where the selection lives; top-level sections belong to the project.
    const parentScene =
      node.section === 'scenes'
        ? view?.scenes.find((scene) => scene.id === node.parentId)
        : undefined

    const parentLabel =
      parentScene && view
        ? sceneTitle(view, parentScene)
        : node.kind === 'data-file'
          ? t(`tree.files.${node.parentId}`)
          : node.parentId

    find('editor-heading').textContent =
      node.kind === 'section'
        ? t('project.heading')
        : [sectionLabel, parentLabel].filter(Boolean).join(' › ')
    find('workspace-heading').textContent = node.kind === 'section' ? sectionLabel : node.label

    if (explorerToggle) {
      explorerToggle.hidden = !view
      find('explorer-selection').textContent =
        node.section === 'maps' && node.kind === 'section'
          ? registry.activeLabel || t('maps.new')
          : [parentLabel, find('workspace-heading').textContent].filter(Boolean).join(' › ')
    }

    rail?.render(view ? node.section : undefined)
    renderHistoryControls()

    const selectedScene = view?.scenes.find(
      (scene) => scene.id === (node.kind === 'scene' ? node.id : node.parentId),
    )

    onSceneSelect?.(
      selectedScene && view
        ? { id: selectedScene.id, title: sceneTitle(view, selectedScene) }
        : undefined,
    )
  }

  const navigate = (node: ProjectTreeNode) => {
    if (!registry.navigate(projectSelection(node, view))) {
      find('tree-message').textContent = t('tree.saveFirst')

      return false
    }

    find('tree-message').textContent = ''

    const moved = selection.key !== node.key
    selection = node
    showSelection(false)
    const body = root.querySelector<HTMLElement>('.editor-pane-body')

    if (moved && body) body.scrollTop = 0

    return true
  }

  let refreshLanguage = () => {}

  const render: ProjectEditorListener = (state, replaceFields) => {
    refreshLanguage = () => render(state, false)
    management?.render(state, replaceFields)
    archivePanel?.render(state, replaceFields)
    const projectChanged = state.view && (!view || state.path !== loadedPath)
    const previousRevision = view?.revision
    const previousStorageKey = view?.storageKey
    const projectClosed = Boolean(view && !state.view)
    view = state.view
    loadedPath = state.path

    if (projectChanged) {
      duplicateForm.reset()
      duplicateForm.hidden = true
      duplicateToggle.setAttribute('aria-expanded', 'false')
    }

    // Revisions cover every authored resource, including changes made by other clients.
    const projectUpdated =
      replaceFields &&
      view &&
      (view.revision !== previousRevision || view.storageKey !== previousStorageKey)

    if (projectChanged || projectUpdated) {
      if (view?.storageKey !== undefined) onProjectChange?.(loadedPath, view.storageKey)
      else onProjectChange?.(loadedPath)
    }

    if (projectClosed) {
      onProjectClose?.()
      showOpenControls(true)
    }

    if (replaceFields && state.projectChange) {
      const change = state.projectChange

      const removedPaths =
        change.kind === 'renamed'
          ? [change.previousPath, loadedPath]
          : change.kind === 'deleted'
            ? [change.previousPath]
            : [loadedPath]

      projectChoices = projectChoices.filter(({ path }) => !removedPaths.includes(path))

      if (view) projectChoices.push({ path: loadedPath, title: view.game?.title ?? loadedPath })
      projectChoices.sort((a, b) => a.path.localeCompare(b.path))
      renderProjectChoices(loadedPath)

      if (view) showOpenControls(false)
    }

    busy = state.busy
    historyBlocked = state.conflict || state.changedElsewhere
    renderHistoryControls()
    reload.disabled = state.busy || !view
    reload.hidden = !view

    fields.disabled = state.busy || !view?.game || Boolean(view.diagnostics.length)
    status.textContent = state.busy
      ? t('project.working')
      : state.conflict
        ? t('project.conflict')
        : state.changedElsewhere
          ? t('project.changed')
          : view
            ? t('project.loaded', {
                title: view.game
                  ? gameTitle(view) || state.path || t('workspace.root')
                  : t('project.withErrors'),
                path: state.path || t('workspace.root'),
              })
            : ''
    error.textContent =
      state.error ||
      view?.diagnostics
        .map(
          (diagnostic) => `${diagnostic.file} ${diagnostic.path.join('.')}: ${diagnostic.message}`,
        )
        .join('\n') ||
      ''
    error.hidden = !error.textContent
    header.hidden = !view
    workspace.hidden = !view
    find('project-title').textContent = view
      ? gameTitle(view) || state.path || t('workspace.root')
      : ''

    if (openingProject && !state.busy) {
      openingProject = false

      if (replaceFields) {
        if (creatingProject || duplicatingProject) {
          projectChoices = [
            ...projectChoices.filter(({ path }) => path !== loadedPath),
            { path: loadedPath, title: view?.game?.title ?? loadedPath },
          ].sort((a, b) => a.path.localeCompare(b.path))
          renderProjectChoices(loadedPath)
          newForm.reset()
          duplicateForm.reset()
        }

        showOpenControls(false)
        openToggle.focus()
      } else {
        if (duplicatingProject) {
          duplicateError.textContent = state.error
          duplicateError.hidden = !state.error
        } else if (creatingProject) {
          newError.textContent = state.error
          newError.hidden = !state.error
        } else openError = state.error
      }

      creatingProject = false
      duplicatingProject = false
    }

    renderOpenControls()
    registry.render(state, replaceFields)

    const updateTree = () => {
      if (!tree) return

      selection = registry.reconcile(selection, state, replaceFields)

      const updated =
        view &&
        flattenProjectTree(buildProjectTree(view, t, sections)).find(
          (node) => node.key === selection.key,
        )

      if (updated) selection = updated
      showSelection()
      tree.render(view, state.busy, selection.key)
    }

    updateTree()
  }

  let draftRecovery: ReturnType<typeof bindEditorDraftRecovery> | undefined
  let management: ReturnType<typeof bindProjectManagementPanel> | undefined
  let archivePanel: ReturnType<typeof bindProjectArchivePanel> | undefined

  const controller = new ProjectEditorController(client, (state, replaceFields) => {
    if (
      state.busy ||
      state.path !== loadedPath ||
      state.view?.revision !== view?.revision ||
      state.view?.storageKey !== view?.storageKey
    )
      confirmation.cancel()

    draftRecovery?.beforeRender()
    render(state, replaceFields)

    if (treeElement) refreshSaveStatuses(workspace)
    draftRecovery?.afterRender(state)
  })

  const registry = new ProjectSectionRegistry([
    ...createProjectSections({
      root,
      dependencies,
      t,
      controller,
      confirmDelete,
      confirmMapChange: confirmation.ask,
      hasDrafts: (exclude) => hasDrafts(exclude),
      renderHistoryControls,
      showSelection,
      selectKey: (key) => {
        tree?.select(key)
      },
      renderTree: (key) => tree?.render(view, busy, key),
      state: {
        get selection() {
          return selection
        },
        set selection(value) {
          selection = value
        },
        get preferredScene() {
          return preferredScene
        },
        set preferredScene(value) {
          preferredScene = value
        },
      },
    }),
    ...sectionDefinitions,
  ])

  const sections = registry.sections

  if (treeElement) {
    tree = bindProjectTree(
      treeElement,
      find<HTMLInputElement>('project-search'),
      (node, interactive) => {
        const fromPane = interactive && workspace.contains(root.ownerDocument.activeElement)
        const selected = navigate(node)

        if (interactive && !selected && compact?.matches) setExplorerExpanded(true)

        if (interactive && selected) {
          onNavigate?.()

          if (compact?.matches) {
            setExplorerExpanded(false)
            find('workspace-heading').focus({ preventScroll: true })
            const workbench = workspace.parentElement

            if (workbench) workbench.scrollTop = 0
          } else if (fromPane) find('workspace-heading').focus()
        }

        return selected
      },
      t,
      sections,
    )

    if (railElement)
      rail = bindSectionRail(railElement, sections, t, (sectionId) =>
        tree?.select(sectionId, { expand: true }),
      )
    tree.render(undefined, false)
    showSelection()
  }

  const unsubscribeLanguage = subscribeLanguageChanges?.(() => {
    refreshLanguage()

    if (treeElement) refreshSaveStatuses(workspace)
    renderProjectChoices(folder.value)
    renderOpenControls()
    draftRecovery?.languageChanged()
  })

  const listeners: (() => void)[] = []

  const on = (element: EventTarget, event: string, listener: EventListener) => {
    element.addEventListener(event, listener)
    listeners.push(() => element.removeEventListener(event, listener))
  }

  if (treeElement) {
    const refresh = () => queueMicrotask(() => refreshSaveStatuses(workspace))

    for (const event of ['input', 'change', 'click', 'keyup']) on(workspace, event, refresh)
  }

  if (explorerToggle)
    on(explorerToggle, 'click', () => {
      const expanded = explorerToggle.getAttribute('aria-expanded') !== 'true'
      setExplorerExpanded(expanded)

      if (expanded && openControls.hidden) tree?.focusSelection()
    })

  on(openToggle, 'click', () => {
    const show = Boolean(openControls.hidden)
    showOpenControls(show)

    if (show) void refreshProjects(true)
  })
  on(newToggle, 'click', () => {
    duplicateForm.hidden = true
    duplicateToggle.setAttribute('aria-expanded', 'false')

    if (recoverForm) recoverForm.hidden = true
    recoverToggle?.setAttribute('aria-expanded', 'false')
    newForm.hidden = !newForm.hidden
    newToggle.setAttribute('aria-expanded', String(!newForm.hidden))

    if (!newForm.hidden) find('project-new-title').focus()
  })
  on(newCancel, 'click', () => {
    newForm.hidden = true
    newToggle.setAttribute('aria-expanded', 'false')
    newError.hidden = true
    newToggle.focus()
  })
  on(newForm, 'submit', (event) => {
    event.preventDefault()

    if (busy || newSubmit.disabled) return

    const request = createProjectRequestSchema.safeParse({
      path: value('project-new-folder').trim(),
      title: value('project-new-title'),
      description: value('project-new-description'),
    })

    if (!request.success) {
      newError.textContent = t('project.invalidCreation')
      newError.hidden = false

      return
    }

    void afterDiscard(() => {
      openingProject = true
      creatingProject = true
      openError = ''
      newError.hidden = true
      void controller.create(request.data)
    })
  })

  on(duplicateToggle, 'click', () => {
    if (duplicateToggle.disabled) return
    duplicateForm.hidden = !duplicateForm.hidden
    duplicateToggle.setAttribute('aria-expanded', String(!duplicateForm.hidden))
    newForm.hidden = true
    newToggle.setAttribute('aria-expanded', 'false')

    if (recoverForm) recoverForm.hidden = true
    recoverToggle?.setAttribute('aria-expanded', 'false')

    if (!duplicateForm.hidden) {
      if (!value('project-copy-title'))
        set(
          'project-copy-title',
          t('project.copyTitle', { title: view ? gameTitle(view) : '' }).slice(0, 200),
        )

      if (!value('project-copy-folder'))
        set('project-copy-folder', `${(view?.game?.id ?? 'game').slice(0, 59)}-copy`)
      find('project-copy-title').focus()
    }
  })
  on(duplicateCancel, 'click', () => {
    duplicateForm.hidden = true
    duplicateToggle.setAttribute('aria-expanded', 'false')
    duplicateError.hidden = true
    duplicateToggle.focus()
  })
  on(duplicateForm, 'submit', (event) => {
    event.preventDefault()

    if (busy || duplicateToggle.disabled || !view) return

    const request = duplicateProjectRequestSchema.safeParse({
      path: loadedPath,
      expectedRevision: view.revision,
      destination: value('project-copy-folder').trim(),
      title: value('project-copy-title'),
    })

    if (!request.success) {
      duplicateError.textContent = t('project.invalidCreation')
      duplicateError.hidden = false

      return
    }

    void afterDiscard(() => {
      if (request.data.path !== loadedPath || request.data.expectedRevision !== view?.revision)
        return
      openingProject = true
      duplicatingProject = true
      openError = ''
      duplicateError.hidden = true
      void controller.duplicate(request.data)
    })
  })

  if (recoverToggle && recoverForm && recoverFolder && recoverCancel) {
    on(recoverToggle, 'click', () => {
      duplicateForm.hidden = true
      duplicateToggle.setAttribute('aria-expanded', 'false')
      recoverForm.hidden = !recoverForm.hidden
      recoverToggle.setAttribute('aria-expanded', String(!recoverForm.hidden))
      newForm.hidden = true
      newToggle.setAttribute('aria-expanded', 'false')

      if (!recoverForm.hidden) recoverFolder.focus()
    })
    on(recoverCancel, 'click', () => {
      recoverForm.hidden = true
      recoverToggle.setAttribute('aria-expanded', 'false')
      recoverToggle.focus()
    })
    on(recoverForm, 'submit', (event) => {
      event.preventDefault()

      if (busy) return
      let path: string

      try {
        path = normalizeGameFolder(recoverFolder.value)
      } catch (error) {
        openError = error instanceof Error ? error.message : String(error)
        renderOpenControls()

        return
      }

      void afterDiscard(() => {
        openingProject = true
        openError = ''
        void controller.load(path)
      })
    })
  }

  on(folder, 'keydown', (event) => {
    if (!('key' in event) || event.key !== 'Enter') return

    event.preventDefault()
    openControls.requestSubmit()
  })
  on(openControls, 'submit', (event) => {
    event.preventDefault()

    const path = folder.value

    if (load.disabled || !projectChoices.some((choice) => choice.path === path)) return

    void afterDiscard(() => {
      if (load.disabled) return

      openingProject = true
      openError = ''
      void controller.load(path)
    })
  })

  const hasDrafts = (exclude: readonly string[] = []) => registry.hasDrafts(exclude)

  const allowDiscard = () =>
    !hasDrafts() || (confirmDiscardDrafts?.() ?? confirmation.ask(t('project.discardDrafts')))

  async function afterDiscard(proceed: () => void): Promise<void> {
    const allowed = allowDiscard()

    if (allowed !== true && !(await allowed)) return

    if (!busy) proceed()
  }

  draftRecovery = bindEditorDraftRecovery(
    root,
    dependencies.createDraftStore(draftStorage),
    t,
    () =>
      view
        ? {
            version: 1,
            path: loadedPath,
            savedAt: dependencies.now(),
            base: view,
            selection: selection.key,
            drafts: captureEditorDrafts(root),
          }
        : undefined,
    hasDrafts,
    confirmation.ask,
    (draft) => {
      controller.recoverDrafts(draft.base)
      selection = flattenProjectTree(buildProjectTree(draft.base, t, sections)).find(
        (node) => node.key === draft.selection,
      ) ?? { key: 'game', section: 'game', kind: 'section', label: t('project.properties') }
      showSelection()
      tree?.render(view, busy, selection.key)
      const failed = restoreEditorDrafts(root, draft.drafts)
      registry.afterRestore()
      renderHistoryControls()

      if (treeElement) refreshSaveStatuses(workspace)

      return failed
    },
  )

  const restoreHistory = (direction: 'undo' | 'redo') => {
    if (mapHistory()?.active) {
      registry.history?.restore(direction)
      renderHistoryControls()

      return
    }

    if (busy || historyBlocked || !view?.history?.[direction === 'undo' ? 'canUndo' : 'canRedo'])
      return

    if (hasDrafts()) {
      error.textContent = t('history.saveDraftsFirst')
      error.hidden = false

      return
    }

    void controller.restore(direction)
  }

  on(undo, 'click', () => restoreHistory('undo'))
  on(redo, 'click', () => restoreHistory('redo'))

  if (root.ownerDocument.defaultView)
    listeners.push(
      bindEditorShortcuts(root.ownerDocument.defaultView, {
        blocked: () => busy || (historyBlocked && !mapHistory()?.active) || !view,
        copy: () => registry.shortcut('copy'),
        paste: () => registry.shortcut('paste'),
        duplicate: () => registry.shortcut('duplicate'),
        delete: () => registry.shortcut('delete'),
        undo: () => {
          if (!mapHistory()?.active && !view?.history?.canUndo) return false
          restoreHistory('undo')

          return true
        },
        redo: () => {
          if (!mapHistory()?.active && !view?.history?.canRedo) return false
          restoreHistory('redo')

          return true
        },
      }),
    )

  on(reload, 'click', () => {
    void controller.load(loadedPath, hasDrafts())
  })

  on(root.ownerDocument.defaultView!, 'focus', () => {
    void controller.refresh(hasDrafts)
  })

  management = bindProjectManagementPanel(root, client, controller, t, allowDiscard, confirmDelete)
  archivePanel = bindProjectArchivePanel(root, controller, t, allowDiscard)
  void refreshProjects()

  return {
    hasDrafts,
    confirm: confirmation.ask,
    dispose() {
      confirmation.cancel()
      management?.dispose()
      archivePanel?.dispose()
      draftRecovery?.dispose()
      registry.dispose()
      discovery?.abort()
      controller.dispose()

      tree?.dispose()
      rail?.dispose()
      unsubscribeLanguage?.()

      for (const remove of listeners) remove()
    },
  }
}
