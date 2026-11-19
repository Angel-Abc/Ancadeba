import { componentGroups } from './componentRegistry.js'
import type { Translate } from '@ancadeba/utilities'
import type { bindProjectForms } from './projectForms.js'
import type { bindAssetsPanel } from './assetsPanel.js'
import type { bindRulesPanel } from './rulesPanel.js'
import type { bindActionBarPanel } from './actionBarPanel.js'
import type { bindStatusPanelEditor } from './statusPanelEditor.js'
import type { bindItemEditor } from './itemEditor.js'
import type { bindShopEditor } from './shopEditor.js'
import type { bindCombatEditor } from './combatEditor.js'
import type { bindLevelingEditor } from './levelingEditor.js'
import type { bindLocalizationEditor } from './localizationEditor.js'
import type { bindStylesheetEditor } from './stylesheetEditor.js'
import type { bindComponentEditor } from './componentEditor.js'
import type { bindStoryEditor } from './storyEditor.js'
import type { bindMapEditor } from './mapEditor.js'
import type { bindProjectRepair } from './projectRepair.js'
import type { bindSceneControls } from './sceneControls.js'
import type { bindComponentClipboard } from './componentClipboard.js'
import type { ProjectTreeSection } from './projectTree.js'
import type {
  ProjectSelection,
  ProjectSectionDefinition,
  ProjectSectionParticipant,
} from './projectSectionRegistry.js'

interface BuiltinEditors {
  root: HTMLElement
  t: Translate
  sections: ProjectTreeSection[]
  forms: ReturnType<typeof bindProjectForms>
  takePreferredScene: () => string | undefined
  assetsPanel: ReturnType<typeof bindAssetsPanel>
  rulesPanel: ReturnType<typeof bindRulesPanel> | undefined
  actionBarPanel: ReturnType<typeof bindActionBarPanel> | undefined
  statusPanel: ReturnType<typeof bindStatusPanelEditor> | undefined
  itemEditor: ReturnType<typeof bindItemEditor> | undefined
  shopEditor: ReturnType<typeof bindShopEditor> | undefined
  combatEditor: ReturnType<typeof bindCombatEditor> | undefined
  levelingEditor: ReturnType<typeof bindLevelingEditor> | undefined
  localizationEditor: ReturnType<typeof bindLocalizationEditor> | undefined
  stylesheetEditor: ReturnType<typeof bindStylesheetEditor> | undefined
  componentEditor: ReturnType<typeof bindComponentEditor> | undefined
  storyEditor: ReturnType<typeof bindStoryEditor> | undefined
  mapEditor: ReturnType<typeof bindMapEditor> | undefined
  repairEditor: ReturnType<typeof bindProjectRepair> | undefined
  sceneControls: ReturnType<typeof bindSceneControls> | undefined
  componentClipboard: ReturnType<typeof bindComponentClipboard> | undefined
}

function target({ node, component, resource }: ProjectSelection): string {
  if (node.section === 'scenes') {
    if (node.kind === 'new-graphic') return 'assets'

    if (node.kind === 'new-component') return 'component'

    if (component) return Object.hasOwn(componentGroups, component.type) ? 'component' : 'read-only'

    if (['section', 'scene', 'new-scene'].includes(node.kind)) return 'forms'

    return 'read-only'
  }

  if (node.section === 'game') return 'forms'

  if (node.kind === 'data-file' && resource?.editSection) return resource.editSection

  return node.section
}

/** Each built-in declares its routing and lifecycle in one registration. */
export function builtinSectionDefinitions(editors: BuiltinEditors): ProjectSectionDefinition[] {
  const { root, t, forms } = editors
  const definitions: ProjectSectionDefinition[] = []

  const add = (
    id: string,
    elementId: string | undefined,
    binding: Pick<ProjectSectionParticipant, 'render' | 'hasDrafts' | 'dispose'> | undefined,
    options: Partial<ProjectSectionParticipant> = {},
  ) => {
    if (!binding) return
    const element = elementId ? root.querySelector<HTMLElement>(`#${elementId}`) : undefined
    definitions.push({
      ...(editors.sections.find((section) => section.id === id)
        ? { tree: editors.sections.find((section) => section.id === id)! }
        : {}),
      create: () => ({
        id,
        role: 'primary',
        matches: (selection) => target(selection) === id,
        ...binding,
        ...(element
          ? {
              setVisible: (visible: boolean) => {
                element.hidden = !visible
              },
            }
          : {}),
        ...options,
        activate(selection) {
          element?.setAttribute(
            'data-scope',
            selection.node.kind === 'data-file'
              ? 'file'
              : selection.node.kind === 'component'
                ? 'component'
                : 'section',
          )
          options.activate?.(selection)
          const identity = element?.querySelector<HTMLInputElement>('[data-file-identity]')

          if (identity) identity.readOnly = selection.node.kind === 'data-file'
        },
      }),
    })
  }

  add(
    'forms',
    undefined,
    { hasDrafts: () => forms.hasDrafts(), dispose: () => forms.dispose() },
    {
      setVisible: (visible) => forms.setVisible(visible),
      activate: (selection) => forms.activate(selection),
      render: (state, replaceFields) =>
        forms.render(state, replaceFields, editors.takePreferredScene()),
      selectionChanged: ({ sceneId }) => {
        if (sceneId) forms.selectScene(sceneId)
      },
      afterRestore: () => forms.refreshTranslations(),
      canNavigate: ({ sceneId }) =>
        !sceneId || sceneId === forms.selectedScene() || !forms.hasSceneDrafts(),
      reconcile(node, state) {
        if (node.section !== 'scenes' || !state.view) return node
        const scene = state.view.scenes.find(({ id }) => id === (node.parentId ?? node.id))

        if (node.kind === 'section' || node.kind.startsWith('new-')) return node

        if (
          scene &&
          (node.kind !== 'component' || scene.components.some(({ id }) => id === node.id))
        )
          return node

        if (!state.historyChange && state.preserveDrafts) return node
        const fallback = scene ?? state.view.scenes[0]

        return fallback
          ? {
              key: `scene:${fallback.id}`,
              section: 'scenes',
              kind: 'scene',
              id: fallback.id,
              label: fallback.title || fallback.id,
            }
          : { key: 'game', section: 'game', kind: 'section', label: t('project.properties') }
      },
    },
  )

  const componentScope = ({ node }: ProjectSelection) =>
    node.section === 'scenes' && ['scene', 'component'].includes(node.kind)

  const structureTarget = (selection: ProjectSelection) =>
    [
      componentScope(selection) ? selection.sceneId : undefined,
      selection.node.kind === 'component' ? selection.node.id : undefined,
    ] as const

  add('scene-controls', 'scene-controls', editors.sceneControls, {
    role: 'adjunct',
    matches: componentScope,
    canNavigate: (selection) => editors.sceneControls!.canNavigate(...structureTarget(selection)),
    activate: (selection) => {
      editors.sceneControls!.navigate(...structureTarget(selection))
    },
    shortcuts: {
      run: (action) =>
        action === 'duplicate' || action === 'delete'
          ? editors.sceneControls!.shortcut(action)
          : false,
    },
  })
  add('clipboard', 'component-clipboard', editors.componentClipboard, {
    role: 'adjunct',
    matches: componentScope,
    canNavigate: (selection) =>
      editors.componentClipboard!.canNavigate(...structureTarget(selection)),
    activate: (selection) => {
      editors.componentClipboard!.navigate(...structureTarget(selection))
    },
    shortcuts: {
      run: (action) =>
        action === 'copy' || action === 'paste'
          ? editors.componentClipboard!.shortcut(action)
          : false,
    },
  })
  let assetTarget = ''
  add('assets', 'assets-panel', editors.assetsPanel, {
    canNavigate: (selection) =>
      target(selection) !== 'assets' ||
      assetTarget === selection.node.key ||
      !editors.assetsPanel.hasDrafts(),
    activate: ({ node, sceneId }) => {
      assetTarget = node.key
      editors.assetsPanel.navigate(node.kind, node.id, sceneId)
    },
  })
  const map = editors.mapEditor
  add('maps', 'map-editor', map, {
    label: () => map?.currentMap(),
    canNavigate: (selection) =>
      target(selection) === 'maps'
        ? map!.canNavigate(selection.node.id, selection.node.kind === 'new-map')
        : !map?.hasDrafts(),
    activate: ({ node }) => {
      map!.navigate(node.id, node.kind === 'new-map')
    },
    ...(map ? { history: { state: map.draftHistory, restore: map.restoreDraft } } : {}),
    reconcile(node, state) {
      if (
        node.section !== 'maps' ||
        node.kind !== 'map' ||
        state.view?.game?.maps?.includes(node.id ?? '') ||
        map?.hasDrafts()
      )
        return node
      const id = state.view?.game?.maps?.[0]

      return id
        ? { key: `map:${id}`, section: 'maps', kind: 'map', id, label: id }
        : { key: 'map-new', section: 'maps', kind: 'new-map', label: t('maps.new') }
    },
  })
  const rules = editors.rulesPanel
  add('rules', 'rules-panel', rules, {
    canNavigate: ({ node }) => node.kind !== 'rule-file' || rules!.canNavigate(node.id ?? ''),
    activate: ({ node }) => {
      if (node.kind === 'rule-file') rules!.navigate(node.id ?? '')
    },
    // render already refreshes the current rule file and tab. Only navigation selects a file.
    refresh: () => {},
  })
  const controls = editors.actionBarPanel
  add('controls', 'action-bar-panel', controls, {
    canNavigate: (selection) =>
      target(selection) !== 'controls' || controls!.canNavigate(selection.sceneId),
    activate: ({ sceneId }) => {
      controls!.navigate(sceneId)
    },
    reconcile(node, state, replace) {
      if (
        replace &&
        state.lastCommand === 'scene.setActionBar' &&
        node.kind === 'component' &&
        !state.view?.scenes
          .find(({ id }) => id === node.parentId)
          ?.components.some(({ id }) => id === node.id)
      )
        return {
          key: 'controls',
          section: 'controls',
          kind: 'section',
          label: t('controls.heading'),
        }

      return node
    },
  })
  const status = editors.statusPanel
  add('status', 'status-panel-editor', status, {
    canNavigate: (selection) =>
      target(selection) !== 'status' ||
      status!.canNavigate(
        selection.sceneId,
        selection.node.section === 'scenes' ? selection.node.id : undefined,
      ),
    activate: ({ sceneId, component }) => {
      status!.navigate(sceneId, component?.id)
    },
  })
  const items = editors.itemEditor

  const inventoryFile = ({ node }: ProjectSelection) =>
    node.kind === 'data-file' && node.parentId === 'inventories'

  add('items', 'item-editor', items, {
    canNavigate: (selection) =>
      target(selection) !== 'items' ||
      (inventoryFile(selection)
        ? items!.canNavigateInventory(selection.node.id ?? '')
        : items!.canNavigate(selection.sceneId, selection.component?.id)),
    activate: (selection) => {
      if (inventoryFile(selection)) items!.navigateInventory(selection.node.id ?? '')
      else items!.navigate(selection.sceneId, selection.component?.id)
    },
  })
  const shop = editors.shopEditor
  add('shops', 'shop-editor', shop, {
    canNavigate: (selection) =>
      target(selection) !== 'shops' || shop!.canNavigate(selection.sceneId),
    activate: ({ sceneId }) => {
      shop!.navigate(sceneId)
    },
  })
  const combat = editors.combatEditor

  const encounter = ({ component, node }: ProjectSelection) =>
    node.kind === 'data-file' && node.parentId === 'combat'
      ? node.id
      : component?.type === 'combat'
        ? component.encounter
        : undefined

  add('combat', 'combat-editor', combat, {
    canNavigate: (selection) =>
      target(selection) !== 'combat' ||
      (combat!.canOpenFile(
        selection.node.kind === 'data-file' ? selection.node.key : '',
        selection.node.parentId === 'combatLibraries',
      ) &&
        combat!.canNavigate(selection.sceneId, encounter(selection))),
    activate: (selection) => {
      combat!.openFile(
        selection.node.kind === 'data-file' ? selection.node.key : '',
        selection.node.parentId === 'combatLibraries' ? selection.node.id : undefined,
      )
      combat!.navigate(selection.sceneId, encounter(selection))
    },
  })
  const leveling = editors.levelingEditor

  const profile = ({ component, node }: ProjectSelection) =>
    node.kind === 'data-file'
      ? node.id
      : component?.type === 'character-progression'
        ? component.profile
        : undefined

  add('leveling', 'leveling-editor', leveling, {
    canNavigate: (selection) =>
      target(selection) !== 'leveling' ||
      leveling!.canNavigate(selection.sceneId, profile(selection), selection.component?.id),
    activate: (selection) => {
      leveling!.navigate(selection.sceneId, profile(selection), selection.component?.id)
    },
  })
  const stylesheet = editors.stylesheetEditor
  add('stylesheet', 'stylesheet-editor', stylesheet, {
    canNavigate: ({ node }) =>
      node.section !== 'stylesheet' ||
      stylesheet!.canNavigate(node.id, node.kind === 'new-stylesheet'),
    activate: ({ node }) => {
      stylesheet!.navigate(node.id, node.kind === 'new-stylesheet')
    },
    reconcile(node, state, replace) {
      if (node.section !== 'stylesheet' || stylesheet?.hasDrafts()) return node

      const file =
        replace && state.lastCommand === 'game.upsertStylesheet'
          ? state.view?.game?.stylesheet
          : undefined

      if (file)
        return {
          key: `stylesheet:${file}`,
          section: 'stylesheet',
          kind: 'stylesheet-file',
          id: file,
          label: file,
        }

      if (
        node.kind === 'stylesheet-file' &&
        !Object.hasOwn(state.view?.stylesheets ?? {}, node.id ?? '')
      )
        return {
          key: 'stylesheet',
          section: 'stylesheet',
          kind: 'section',
          label: t('stylesheets.heading'),
        }

      return node
    },
  })
  const components = editors.componentEditor
  add('component', 'component-editor', components, {
    canNavigate: (selection) =>
      target(selection) !== 'component' ||
      components!.canNavigate(
        selection.sceneId,
        selection.node.id,
        selection.node.kind === 'new-component',
      ),
    activate: ({ sceneId, node }) => {
      components!.navigate(sceneId, node.id, node.kind === 'new-component')
    },
  })
  add('localization', 'localization-editor', editors.localizationEditor)

  const storyKey = ({ node }: ProjectSelection) =>
    node.kind === 'data-file'
      ? (node.parentId === 'dialogues' ? 'dialogue:' : 'quest:') + node.id
      : ''

  add('story', 'story-editor', editors.storyEditor, {
    canNavigate: (selection) =>
      target(selection) !== 'story' ||
      !storyKey(selection) ||
      editors.storyEditor!.canOpenDefinition(storyKey(selection)),
    activate: (selection) => {
      const key = storyKey(selection)

      if (key) editors.storyEditor!.openDefinition(key)
    },
  })
  add('repair', undefined, editors.repairEditor, { role: 'adjunct', matches: () => false })
  definitions.push({ create: () => ({ id: 'read-only', role: 'fallback', matches: () => true }) })

  return definitions
}
