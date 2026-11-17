import { type ProjectSectionDefinition } from './projectSectionRegistry.js'
import { builtinSectionDefinitions } from './projectBuiltinSections.js'
import { bindProjectForms } from './projectForms.js'
import type { ProjectPanelDependencies } from './projectPanelDependencies.js'
import { bindLevelingEditor } from './levelingEditor.js'
import { bindLocalizationEditor } from './localizationEditor.js'
import { bindMapEditor } from './mapEditor.js'
import type { ConfirmAction } from './editorConfirmation.js'
import { mountGameStylesheet } from '@ancadeba/ui-components'
import type { ProjectView } from '@ancadeba/editor-core'
import { ProjectEditorController } from './projectController.js'
import type { Translate } from '@ancadeba/utilities'
import { bindAssetsPanel } from './assetsPanel.js'
import { bindRulesPanel } from './rulesPanel.js'
import { bindStoryEditor } from './storyEditor.js'
import { bindActionBarPanel } from './actionBarPanel.js'
import { bindStatusPanelEditor } from './statusPanelEditor.js'
import { bindItemEditor } from './itemEditor.js'
import { bindShopEditor } from './shopEditor.js'
import { bindCombatEditor } from './combatEditor.js'
import { bindComponentEditor } from './componentEditor.js'
import { bindSceneControls } from './sceneControls.js'
import { bindComponentClipboard } from './componentClipboard.js'
import { bindStylesheetEditor } from './stylesheetEditor.js'
import { bindProjectRepair } from './projectRepair.js'
import {
  dataFilesSection,
  ruleFileNodes,
  mapFileNodes,
  projectTreeSections,
  type ProjectTreeNode,
} from './projectTree.js'

interface SectionComposition {
  root: HTMLElement
  dependencies: ProjectPanelDependencies
  t: Translate
  controller: ProjectEditorController
  confirmDelete: ConfirmAction
  confirmMapChange: ConfirmAction
  hasDrafts: (exclude?: readonly string[]) => boolean
  renderHistoryControls: () => void
  showSelection: () => void
  selectKey: (key: string) => void
  renderTree: (key: string) => void
  state: { selection: ProjectTreeNode; preferredScene: string | undefined }
}

export function createProjectSections({
  root,
  dependencies,
  t,
  controller,
  confirmDelete,
  confirmMapChange,
  hasDrafts,
  renderHistoryControls,
  showSelection,
  selectKey,
  renderTree,
  state,
}: SectionComposition): ProjectSectionDefinition[] {
  const { fetcher } = dependencies

  const forms = bindProjectForms(root, t, (command) => {
    void controller.save(command)
  })

  const treeElement = root.querySelector<HTMLElement>('#project-tree')
  let assetsPanel: ReturnType<typeof bindAssetsPanel> | undefined
  const rulesElement = treeElement && root.querySelector<HTMLElement>('#rules-panel')
  const storyElement = treeElement && root.querySelector<HTMLElement>('#story-editor')
  let storyEditor: ReturnType<typeof bindStoryEditor> | undefined
  const mapElement = treeElement && root.querySelector<HTMLElement>('#map-editor')
  let mapEditor: ReturnType<typeof bindMapEditor> | undefined

  const actionBarElement = treeElement && root.querySelector<HTMLElement>('#action-bar-panel')
  const statusPanelElement = treeElement && root.querySelector<HTMLElement>('#status-panel-editor')
  let rulesPanel: ReturnType<typeof bindRulesPanel> | undefined
  let actionBarPanel: ReturnType<typeof bindActionBarPanel> | undefined
  let statusPanel: ReturnType<typeof bindStatusPanelEditor> | undefined
  const itemElement = treeElement && root.querySelector<HTMLElement>('#item-editor')
  let itemEditor: ReturnType<typeof bindItemEditor> | undefined
  const shopElement = treeElement && root.querySelector<HTMLElement>('#shop-editor')
  let shopEditor: ReturnType<typeof bindShopEditor> | undefined
  const levelingElement = treeElement && root.querySelector<HTMLElement>('#leveling-editor')
  let levelingEditor: ReturnType<typeof bindLevelingEditor> | undefined
  const localizationElement = treeElement && root.querySelector<HTMLElement>('#localization-editor')
  let localizationEditor: ReturnType<typeof bindLocalizationEditor> | undefined
  const stylesheetElement = treeElement && root.querySelector<HTMLElement>('#stylesheet-editor')
  let stylesheetEditor: ReturnType<typeof bindStylesheetEditor> | undefined
  const repairElement = treeElement && root.querySelector<HTMLElement>('#project-repair')
  let repairEditor: ReturnType<typeof bindProjectRepair> | undefined
  const combatElement = treeElement && root.querySelector<HTMLElement>('#combat-editor')
  let combatEditor: ReturnType<typeof bindCombatEditor> | undefined
  const componentElement = treeElement && root.querySelector<HTMLElement>('#component-editor')
  let componentEditor: ReturnType<typeof bindComponentEditor> | undefined
  const sceneControlsElement = treeElement && root.querySelector<HTMLElement>('#scene-controls')
  let sceneControls: ReturnType<typeof bindSceneControls> | undefined
  const clipboardElement = treeElement && root.querySelector<HTMLElement>('#component-clipboard')
  let componentClipboard: ReturnType<typeof bindComponentClipboard> | undefined

  const sections = [
    ...projectTreeSections,
    ...(mapElement ? [{ id: 'maps', labelKey: 'maps.heading', nodes: mapFileNodes }] : []),
    ...(storyElement ? [{ id: 'story', labelKey: 'story.heading', nodes: () => [] }] : []),
    ...(rulesElement ? [{ id: 'rules', labelKey: 'rules.heading', nodes: ruleFileNodes }] : []),
    ...(actionBarElement
      ? [{ id: 'controls', labelKey: 'controls.heading', nodes: () => [] }]
      : []),
    ...(statusPanelElement ? [{ id: 'status', labelKey: 'status.heading', nodes: () => [] }] : []),
    ...(itemElement ? [{ id: 'items', labelKey: 'items.heading', nodes: () => [] }] : []),
    ...(shopElement ? [{ id: 'shops', labelKey: 'shops.heading', nodes: () => [] }] : []),
    ...(levelingElement ? [{ id: 'leveling', labelKey: 'leveling.heading', nodes: () => [] }] : []),
    ...(localizationElement
      ? [{ id: 'localization', labelKey: 'localization.heading', nodes: () => [] }]
      : []),
    ...(stylesheetElement
      ? [
          {
            id: 'stylesheet',
            labelKey: 'stylesheets.heading',
            nodes: (view: ProjectView): ProjectTreeNode[] => [
              ...Object.keys(view.stylesheets ?? {}).map((file) => ({
                key: `stylesheet:${file}`,
                section: 'stylesheet',
                kind: 'stylesheet-file',
                id: file,
                label: file,
                ...(view.game?.stylesheet === file ? { detail: t('stylesheets.assigned') } : {}),
              })),
              {
                key: 'stylesheet-new',
                section: 'stylesheet',
                kind: 'new-stylesheet',
                label: t('stylesheets.new'),
              },
            ],
          },
        ]
      : []),
    ...(combatElement ? [{ id: 'combat', labelKey: 'combat.heading', nodes: () => [] }] : []),
    ...(treeElement ? [dataFilesSection] : []),
  ]

  if (repairElement)
    repairEditor = bindProjectRepair(
      repairElement,
      t,
      {
        check: (request) => controller.checkRepair(request),
        save: (request) => controller.repair(request),
      },
      (css) => {
        const host = root.ownerDocument.createElement('div')
        host.hidden = true
        repairElement.append(host)

        try {
          mountGameStylesheet(host, css)
        } finally {
          host.remove()
        }
      },
    )

  const copyButton =
    clipboardElement && sceneControlsElement
      ? root.ownerDocument.createElement('button')
      : undefined

  if (clipboardElement)
    componentClipboard = bindComponentClipboard(clipboardElement, t, {
      copyButton,
      copy: (sceneId, componentId) => controller.copyComponent(sceneId, componentId),
      save: (command) => {
        void controller.save(command)
      },
      canChange: () => !hasDrafts(['clipboard']),
      onSaved(command) {
        state.selection = {
          key: `component:${command.sceneId}:${command.newId}`,
          section: 'scenes',
          kind: 'component',
          parentId: command.sceneId,
          id: command.newId,
          label: command.newId,
        }
        state.preferredScene = command.sceneId
      },
    })

  if (sceneControlsElement)
    sceneControls = bindSceneControls(sceneControlsElement, t, {
      copyButton,
      save: (command) => {
        void controller.save(command)
      },
      canChange: () => !hasDrafts(['scene-controls']),
      confirmDelete,
      onSaved(command, next) {
        if (command.type === 'scene.duplicateComponent' || command.type === 'scene.moveComponent') {
          const id =
            command.type === 'scene.duplicateComponent' ? command.newId : command.componentId

          state.selection = {
            key: `component:${command.sceneId}:${id}`,
            section: 'scenes',
            kind: 'component',
            parentId: command.sceneId,
            id,
            label: id,
          }
          state.preferredScene = command.sceneId

          return
        }

        const id =
          command.type === 'scene.rename' || command.type === 'scene.duplicate'
            ? command.newId
            : command.type === 'scene.remove'
              ? (command.replacementScene ?? next.scenes[0]?.id)
              : command.type === 'scene.removeComponent'
                ? command.sceneId
                : undefined

        if (id) {
          state.selection = { key: `scene:${id}`, section: 'scenes', kind: 'scene', id, label: id }
          state.preferredScene = id
        }
      },
    })

  if (rulesElement)
    rulesPanel = bindRulesPanel(
      rulesElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (mapElement)
    mapEditor = bindMapEditor(
      mapElement,
      (command) => {
        void controller.save(command)
      },
      t,
      {
        confirm: confirmMapChange,
        onHistoryChange: renderHistoryControls,
        createGraphics: dependencies.createGraphics,
        onNavigate(id) {
          state.selection = id
            ? { key: `map:${id}`, section: 'maps', kind: 'map', id, label: id }
            : { key: 'map-new', section: 'maps', kind: 'new-map', label: t('maps.new') }
          showSelection()
          renderTree(state.selection.key)
        },
        onSaved(id) {
          state.selection = id
            ? { key: `map:${id}`, section: 'maps', kind: 'map', id, label: id }
            : { key: 'map-new', section: 'maps', kind: 'new-map', label: t('maps.new') }
        },
      },
    )

  if (actionBarElement)
    actionBarPanel = bindActionBarPanel(
      actionBarElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (statusPanelElement)
    statusPanel = bindStatusPanelEditor(
      statusPanelElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (levelingElement)
    levelingEditor = bindLevelingEditor(
      levelingElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (localizationElement)
    localizationEditor = bindLocalizationEditor(
      localizationElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (stylesheetElement)
    stylesheetEditor = bindStylesheetEditor(
      stylesheetElement,
      (command) => {
        void controller.save(command)
      },
      t,
      (css) => {
        const host = root.ownerDocument.createElement('div')
        host.hidden = true
        stylesheetElement.append(host)

        try {
          mountGameStylesheet(host, css)
        } finally {
          host.remove()
        }
      },
    )

  if (storyElement)
    storyEditor = bindStoryEditor(
      storyElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (combatElement)
    combatEditor = bindCombatEditor(
      combatElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (shopElement)
    shopEditor = bindShopEditor(
      shopElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (itemElement)
    itemEditor = bindItemEditor(
      itemElement,
      (command) => {
        void controller.save(command)
      },
      t,
    )

  if (componentElement)
    componentEditor = bindComponentEditor(
      componentElement,
      (command) => {
        void controller.save(command)
      },
      {
        t,
        onCreated(sceneId, componentId) {
          state.selection = {
            key: `component:${sceneId}:${componentId}`,
            section: 'scenes',
            kind: 'component',
            parentId: sceneId,
            id: componentId,
            label: componentId,
          }
        },
        onCancel(sceneId) {
          selectKey(`scene:${sceneId}`)
        },
      },
    )
  assetsPanel = bindAssetsPanel(
    root,
    {
      save: (command) => controller.save(command),
      importAsset: (id, format, file) => controller.importAsset(id, format, file),
    },
    fetcher,
    t,
    (id) => selectKey(`asset:${id}`),
    (key) => selectKey(key),
  )

  const registrations = builtinSectionDefinitions({
    root,
    t,
    sections,
    forms,
    takePreferredScene: () => {
      const preferred = state.preferredScene
      state.preferredScene = undefined

      return preferred
    },
    assetsPanel,
    rulesPanel,
    actionBarPanel,
    statusPanel,
    itemEditor,
    shopEditor,
    combatEditor,
    levelingEditor,
    localizationEditor,
    stylesheetEditor,
    componentEditor,
    storyEditor,
    mapEditor,
    repairEditor,
    sceneControls,
    componentClipboard,
  })

  return [
    ...sections.map(
      (tree) =>
        registrations.find((entry) => entry.tree?.id === tree.id) ?? {
          tree,
          create: () => ({ id: `tree:${tree.id}`, role: 'adjunct' as const, matches: () => false }),
        },
    ),
    ...registrations.filter((entry) => !entry.tree),
  ]
}
