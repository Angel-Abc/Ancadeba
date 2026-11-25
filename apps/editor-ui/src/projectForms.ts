import type { DraftLocation, ProjectSelection } from './projectSectionRegistry.js'
import { z } from 'zod'
import { appearanceLibrarySchema, savingPolicySchema } from '@ancadeba/schemas'
import type { EditorCommand, ProjectView } from '@ancadeba/editor-core'
import type { Translate } from '@ancadeba/utilities'
import type { ProjectEditorState } from './projectController.js'
import { registerEditorDraft } from './editorDraftState.js'
import { bindMetadataTranslations } from './metadataTranslations.js'
import { bindFormSaveBar } from './formSaveStatus.js'
import { sceneTitle } from './projectTree.js'
import { languageWatcher } from './ruleFormControls.js'
import { bindCharacterProfileForm } from './characterProfileForm.js'

import { bindAppearanceLibrary } from './appearanceLibraryForm.js'
import type { ProjectPanelDependencies } from './projectPanelDependencies.js'

export function bindProjectForms(
  root: HTMLElement,
  t: Translate,
  save: (command: EditorCommand) => void,
  openKey?: (key: string) => void,
  cancelCreation?: () => void,
  createGraphics?: ProjectPanelDependencies['createGraphics'],
) {
  const find = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!
  const metadata = find<HTMLFormElement>('editor-metadata')
  const sceneMetadata = find<HTMLFormElement>('scene-metadata')
  const layout = find<HTMLFormElement>('scene-layout')
  const create = find<HTMLFormElement>('scene-create')
  const scenes = find<HTMLSelectElement>('editor-scenes')
  const status = find<HTMLElement>('editor-status')
  const error = find<HTMLElement>('editor-error')
  const dirtyForms = new Set<string>()
  const profileRoot = root.querySelector<HTMLElement>('#editor-character-profile')

  const languageChanged = languageWatcher(t)

  const profile =
    profileRoot &&
    bindCharacterProfileForm(
      profileRoot,
      root.ownerDocument,
      t,
      () => dirtyForms.add(metadata.id),
      openKey,
    )

  const appearanceRoot = root.querySelector<HTMLElement>('#editor-appearances')

  const appearances =
    appearanceRoot &&
    bindAppearanceLibrary(appearanceRoot, t, () => dirtyForms.add(metadata.id), createGraphics)

  let projectPath = ''
  let projectTab = 'general'
  const general = root.querySelector<HTMLElement>('#project-general')
  const viewButtons = metadata.querySelectorAll?.<HTMLElement>('[data-project-view]') ?? []

  const showTab = (tab: string) => {
    projectTab = tab

    if (!general || !profileRoot) return
    general.hidden = tab !== 'general'
    profileRoot.hidden = tab !== 'profile'

    if (appearanceRoot) appearanceRoot.hidden = tab !== 'appearances'
    appearances?.draw()

    if (view && tab === 'profile') showProfileFields(false)

    for (const control of viewButtons)
      control.setAttribute('aria-pressed', String(control.dataset.projectView === tab))
  }

  if (general) {
    for (const control of viewButtons)
      control.addEventListener('click', () => showTab(control.dataset.projectView ?? 'general'))
    metadata.addEventListener(
      'invalid',
      (event) => {
        if (!(event.target instanceof Node)) return
        showTab(
          appearanceRoot?.contains(event.target)
            ? 'appearances'
            : general.contains(event.target)
              ? 'general'
              : 'profile',
        )
      },
      true,
    )
  }

  let view: ProjectView | undefined
  let busy = false
  const value = (id: string) => find<HTMLInputElement>(id).value

  const set = (id: string, value: string | number) => {
    find<HTMLInputElement>(id).value = String(value)
  }

  const listeners: (() => void)[] = []

  const on = (element: EventTarget, event: string, listener: EventListener) => {
    element.addEventListener(event, listener)
    listeners.push(() => element.removeEventListener(event, listener))
  }

  const sceneViews = root.querySelector<HTMLElement>('#scene-views')
  const sceneButtons = sceneViews?.querySelectorAll?.<HTMLButtonElement>('[data-scene-view]') ?? []
  let gridVisible = false
  let sceneVisible = false
  let sceneViewId = ''
  let submittedScene: string | undefined

  function showSceneView() {
    if (sceneViews) sceneViews.hidden = !sceneVisible
    sceneMetadata.hidden = !sceneVisible || gridVisible
    layout.hidden = !sceneVisible || (Boolean(sceneViews) && !gridVisible)

    for (const button of sceneButtons)
      button.setAttribute(
        'aria-pressed',
        String((button.dataset.sceneView === 'grid') === gridVisible),
      )
  }

  for (const button of sceneButtons)
    on(button, 'click', () => {
      gridVisible = button.dataset.sceneView === 'grid'
      showSceneView()
    })
  const cancel = root.querySelector<HTMLElement>('#scene-cancel')

  if (cancel)
    on(cancel, 'click', () => {
      if (busy) return
      dirtyForms.delete(create.id)
      create.reset()
      error.hidden = true
      cancelCreation?.()
    })

  const projectTranslations = bindMetadataTranslations(root, 'editor', t, () => {
    dirtyForms.add(metadata.id)
  })

  const sceneTranslations = bindMetadataTranslations(root, 'scene', t, () => {
    dirtyForms.add(sceneMetadata.id)
    scenes.disabled = true
  })

  const fillScene = () => {
    const scene = view?.scenes.find((scene) => scene.id === scenes.value)

    if (!sceneViews) sceneVisible = Boolean(scene)
    showSceneView()

    if (!scene) return

    sceneTranslations.render(view, scene, !dirtyForms.has(sceneMetadata.id))

    if (!dirtyForms.has(sceneMetadata.id)) {
      set('scene-title', scene.title)
      set('scene-description', scene.description)
    }

    if (!dirtyForms.has(layout.id)) {
      set('scene-rows', scene.screen.grid.rows)
      set('scene-columns', scene.screen.grid.columns)
    }
  }

  function showProfileFields(replace: boolean) {
    if (!view?.game) return
    profile?.render(
      appearances ? { ...view, game: { ...view.game, appearances: appearances.read() } } : view,
      replace,
    )
  }

  const fillProject = () => {
    if (!view?.game) return
    appearances?.render(view, projectPath, !dirtyForms.has(metadata.id))
    showProfileFields(!dirtyForms.has(metadata.id))

    if (!dirtyForms.has(metadata.id)) {
      set('editor-title', view.game.title)
      set('editor-description', view.game.description)
      set('editor-version', view.game.version)

      if (root.querySelector('#editor-manual-saving')) {
        set('editor-manual-saving', view.game.saving?.manual ?? 'anywhere')
        set('editor-autosave', view.game.saving?.autosave ?? 'automatic')
      }

      const menu = root.querySelector<HTMLSelectElement>('#editor-menu-scene')

      if (menu) {
        menu.replaceChildren(
          ...[
            ['', t('saving.disabled')],
            ...view.scenes
              .filter((scene) => scene.type === 'stand-alone')
              .map((scene) => [scene.id, scene.title || scene.id]),
          ].map(([id, title]) => {
            const option = root.ownerDocument.createElement('option')
            option.value = id!
            option.textContent = title!

            return option
          }),
        )
        menu.value = view.game['menu-scene'] ?? ''
      }

      projectTranslations.render(view, view.game, true)
    }
  }

  const formFields = [
    'editor-title',
    'editor-description',
    'editor-version',
    ...['editor-manual-saving', 'editor-autosave', 'editor-menu-scene'].filter((id) =>
      root.querySelector('#' + id),
    ),
    'editor-title-key',
    'editor-description-key',
    'scene-title',
    'scene-description',
    'scene-title-key',
    'scene-description-key',
    'scene-rows',
    'scene-columns',
    'new-scene-id',
    'new-scene-title',
    'new-scene-type',
    'new-scene-rows',
    'new-scene-columns',
  ]

  registerEditorDraft(
    metadata,
    'project-forms',
    z.object({
      fields: z.record(z.string(), z.string()),
      dirty: z.array(z.string()),
      scene: z.string(),
      gridVisible: z.boolean(),
      profile: z.string().optional(),
      projectTab: z.string(),
      appearances: appearanceLibrarySchema.optional(),
      profileEntries: z.record(z.string(), z.number()).optional(),
    }),
    () =>
      dirtyForms.size
        ? {
            fields: Object.fromEntries(formFields.map((id) => [id, value(id)])),
            dirty: [...dirtyForms],
            scene: scenes.value,
            gridVisible,
            profile: profile?.snapshot(),
            projectTab,
            appearances: appearances?.read(),
            profileEntries: profile?.entries(),
          }
        : undefined,
    (saved) => {
      dirtyForms.clear()

      for (const id of saved.dirty)
        if ([metadata.id, sceneMetadata.id, layout.id, create.id].includes(id)) dirtyForms.add(id)
      scenes.value = saved.scene
      sceneViewId = saved.scene
      gridVisible = saved.gridVisible
      showSceneView()

      if (saved.profile) profile?.restore(saved.profile, saved.profileEntries)

      if (saved.appearances) appearances?.restore(saved.appearances)
      showTab(saved.projectTab)

      for (const id of formFields) if (Object.hasOwn(saved.fields, id)) set(id, saved.fields[id]!)
      scenes.disabled = dirtyForms.has(sceneMetadata.id) || dirtyForms.has(layout.id)
    },
    'profile-entries',
  )

  for (const form of [metadata, sceneMetadata, layout, create]) {
    bindFormSaveBar(form, t, () => dirtyForms.has(form.id))
    const discard = form.querySelector?.('[data-discard]')

    if (discard)
      on(discard, 'click', () => {
        dirtyForms.delete(form.id)

        if (form === metadata) fillProject()
        else fillScene()
        scenes.disabled = dirtyForms.has(sceneMetadata.id) || dirtyForms.has(layout.id)
        error.hidden = true
      })
    on(form, 'input', (event) => {
      if (
        typeof Element !== 'undefined' &&
        event.target instanceof Element &&
        event.target.closest('.entry-picker, [data-draft-navigation]')
      )
        return
      dirtyForms.add(form.id)
      scenes.disabled = dirtyForms.has(sceneMetadata.id) || dirtyForms.has(layout.id)
    })
  }

  on(scenes, 'change', () => {
    fillScene()
  })

  const submit = (form: HTMLFormElement, action: () => void) =>
    on(form, 'submit', (event) => {
      event.preventDefault()
      action()
    })

  submit(metadata, () => {
    if (busy) return

    const issue = projectTranslations.validate()

    if (issue) {
      showTab('general')
      metadata.querySelector?.<HTMLElement>('[aria-invalid="true"]')?.focus()
      error.textContent = issue
      error.hidden = false

      return
    }

    const library = appearances?.read()
    const parsedLibrary = appearanceLibrarySchema.optional().safeParse(library)

    if (!parsedLibrary.success) {
      showTab('appearances')
      error.textContent = parsedLibrary.error.issues
        .map((issue) => issue.path.join('.') + ': ' + issue.message)
        .join('\n')
      error.hidden = false

      return
    }

    const characterProfile = profile?.read()

    if (characterProfile && !characterProfile.success) {
      showTab('profile')
      profile?.focusIssue(characterProfile.error.issues[0]!.path)
      error.textContent = characterProfile.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')
      error.hidden = false

      return
    }

    save({
      type: 'game.updateMetadata',
      ...(library &&
        (view?.game?.appearances || Object.keys(library.presets).length) && {
          appearances: library,
        }),
      ...(characterProfile &&
        (characterProfile.data || view?.game?.characterProfile) && {
          characterProfile: characterProfile.data,
        }),
      title: value('editor-title'),
      description: value('editor-description'),
      version: value('editor-version'),
      ...(root.querySelector('#editor-manual-saving')
        ? {
            saving: savingPolicySchema.parse({
              manual: value('editor-manual-saving'),
              autosave: value('editor-autosave'),
            }),
            menuScene: value('editor-menu-scene') || null,
          }
        : {}),
      ...projectTranslations.read(),
    })
  })
  submit(sceneMetadata, () => {
    if (busy) return

    const issue = sceneTranslations.validate()

    if (issue) {
      error.textContent = issue
      error.hidden = false

      return
    }

    save({
      type: 'scene.updateMetadata',
      sceneId: scenes.value,
      title: value('scene-title'),
      description: value('scene-description'),
      ...sceneTranslations.read(),
    })
  })
  submit(layout, () => {
    save({
      type: 'scene.updateLayout',
      sceneId: scenes.value,
      rows: Number(value('scene-rows')),
      columns: Number(value('scene-columns')),
    })
  })
  submit(create, () => {
    submittedScene = value('new-scene-id')
    save({
      type: 'scene.create',
      scene: {
        'schema-version': '1.0.0',
        id: value('new-scene-id'),
        title: value('new-scene-title'),
        description: '',
        type: find<HTMLSelectElement>('new-scene-type').value === 'game' ? 'game' : 'stand-alone',
        screen: {
          type: 'grid',
          grid: {
            rows: Number(value('new-scene-rows')),
            columns: Number(value('new-scene-columns')),
          },
        },
        components: [],
      },
    })
  })

  return {
    openProfile() {
      showTab('profile')
      profileRoot?.querySelector<HTMLElement>('.entry-picker select,select')?.focus()
    },
    setVisible(visible: boolean) {
      if (!visible) find('editor-fields').hidden = true
    },
    activate({ node, scene }: ProjectSelection) {
      metadata.hidden = node.section !== 'game'
      sceneVisible = node.kind === 'scene' && Boolean(scene)
      showSceneView()
      create.hidden = node.kind !== 'new-scene'
      find('editor-fields').hidden = metadata.hidden && !sceneVisible && create.hidden
    },
    takeCreatedScene() {
      const id = submittedScene
      submittedScene = undefined

      return id
    },
    selectedScene: () => scenes.value,
    hasDrafts: () => dirtyForms.size > 0,
    draftLocations(): DraftLocation[] {
      return [...dirtyForms].map((id) => {
        if (id === metadata.id) return { key: 'game' }

        if (id === create.id) return { key: 'scene-new' }
        const grid = id === layout.id

        return {
          key: 'scene:' + scenes.value,
          detail: t(grid ? 'scene.gridView' : 'scene.propertiesView'),
          reveal() {
            gridVisible = grid
            showSceneView()
            find(id).querySelector<HTMLButtonElement>('button[type="submit"]')?.focus()
          },
        }
      })
    },
    hasSceneDrafts: () => dirtyForms.has(sceneMetadata.id) || dirtyForms.has(layout.id),
    clear: () => dirtyForms.clear(),
    selectScene(id: string) {
      if (sceneViewId !== id) gridVisible = false
      sceneViewId = id
      scenes.value = id
      fillScene()
    },
    refreshTranslations() {
      if (languageChanged() && view) {
        showProfileFields(false)
        appearances?.draw()
      }

      projectTranslations.render(view, view?.game ?? undefined, false)
      const scene = view?.scenes.find((scene) => scene.id === scenes.value)

      if (scene) sceneTranslations.render(view, scene, false)
    },
    refresh(state: ProjectEditorState) {
      if (view && !state.view) {
        dirtyForms.clear()
        showTab('general')
        profile?.clearSelection()
        gridVisible = false
        sceneViewId = ''
        submittedScene = undefined
      }

      projectPath = state.path
      view = state.view
      busy = state.busy
      this.refreshTranslations()
    },
    render(state: ProjectEditorState, replaceFields: boolean, preferredScene?: string) {
      this.refresh(state)

      if (!replaceFields || !view?.game) return

      const formCommands: Partial<Record<EditorCommand['type'], string>> = {
        'game.updateMetadata': metadata.id,
        'scene.updateMetadata': sceneMetadata.id,
        'scene.updateLayout': layout.id,
        'scene.create': create.id,
      }

      const savedForm = state.lastCommand ? formCommands[state.lastCommand] : undefined

      if (savedForm) dirtyForms.delete(savedForm)
      else if (!state.preserveDrafts) dirtyForms.clear()

      if (!dirtyForms.has(create.id)) create.reset()
      scenes.disabled = dirtyForms.has(sceneMetadata.id) || dirtyForms.has(layout.id)
      fillProject()

      const selected = preferredScene ?? scenes.value
      const currentView = view
      scenes.replaceChildren(
        ...view.scenes.map((scene) => {
          const option = root.ownerDocument.createElement('option')
          option.value = scene.id
          option.textContent = `${sceneTitle(currentView, scene)} (${scene.id})`

          return option
        }),
      )

      if (
        selected &&
        !view.scenes.some((scene) => scene.id === selected) &&
        (dirtyForms.has(sceneMetadata.id) || dirtyForms.has(layout.id))
      ) {
        // A reload must never attach a removed scene's draft to another scene.
        const missing = root.ownerDocument.createElement('option')
        missing.value = selected
        missing.textContent = t('project.unavailableScene', { id: selected })
        scenes.append(missing)
        scenes.value = selected
        status.textContent = t('project.missingScene')
      }

      if (view.scenes.some((scene) => scene.id === selected)) scenes.value = selected
      fillScene()
    },
    dispose() {
      appearances?.dispose()
      projectTranslations.dispose()
      sceneTranslations.dispose()

      for (const remove of listeners) remove()
    },
  }
}
