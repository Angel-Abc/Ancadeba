import type {
  ButtonComponentData,
  IGameActions,
  IGameBindings,
  SceneComponentData,
  TextResolutionOptions,
  IGameLocalization,
  IGameInventory,
  IGameSaves,
  GameData,
  GameSaveFile,
  SceneInstance,
} from '@ancadeba/game-runtime'
import type { AssetCatalog, InventoryDefinition, SceneTransition } from '@ancadeba/schemas'
import type { IGraphicResources } from './graphicResources.js'
import type { KeyboardInputSink } from './keyboardInput.js'
import type { GameConfirmation } from './gameConfirmationDialog.js'
import type { ActionInfo } from './actionInfo.js'

type SceneNavigation = Extract<
  NonNullable<ButtonComponentData['action']>,
  { type: 'new-game' | 'enter-scene' | 'open-menu' | 'resume-game' | 'main-menu' }
>

export interface ComponentRendererOptions {
  readonly confirm?: GameConfirmation | undefined
  readonly game?: GameData | undefined
  readonly downloadSave?: ((file: GameSaveFile) => void) | undefined
  readonly onOpenMenu?: ((scene: string) => void) | undefined
  readonly canOpenMenu?: (() => boolean) | undefined
  readonly canResumeGame?: (() => boolean) | undefined
  readonly onLoadAutosave?: (() => void) | undefined
  readonly saves?: IGameSaves | undefined
  readonly onLoadGame?: (() => void) | undefined
  readonly input?: KeyboardInputSink | undefined
  readonly assets?: AssetCatalog | undefined
  readonly graphics?: IGraphicResources | undefined
  readonly localization?: IGameLocalization | undefined
  readonly bindingMode?: TextResolutionOptions['mode']
  readonly onButtonActivate?: (action: SceneNavigation) => void
  readonly canEnterScene?: (action: SceneTransition) => boolean
  readonly subscribeNavigationChanges?: (listener: () => void) => () => void
  readonly navigationUnavailableMessage?: () => string
}

export interface ComponentRenderContext extends ComponentRendererOptions {
  readonly actionInfo?: ActionInfo | undefined
  readonly scene?: SceneInstance | undefined
  readonly onActionBarFocusLost?: (() => void) | undefined
  readonly document: Document
  readonly bindings?: IGameBindings | undefined
  readonly actions?: IGameActions | undefined
  readonly inventory?: IGameInventory | undefined
  readonly inventoryDefinition?: InventoryDefinition | undefined
}

export interface RenderedComponent {
  readonly element: HTMLElement
  dispose(): void
}

export interface IComponentRenderer<TComponent extends SceneComponentData = SceneComponentData> {
  render(component: TComponent, context: ComponentRenderContext): RenderedComponent
}

export type ComponentRenderers = {
  readonly [TType in SceneComponentData['type']]: IComponentRenderer<
    Extract<SceneComponentData, { type: TType }>
  >
}
