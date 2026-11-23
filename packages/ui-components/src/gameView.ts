import type {
  GameData,
  IGameLifecycle,
  SceneData,
  SceneInstance,
  IGameSaves,
  GameSaveFile,
  SubmitForm,
} from '@ancadeba/game-runtime'
import { canEnterScene, runtimeText } from '@ancadeba/game-runtime'
import { bindKeyboardInput, type KeyboardInputSink } from './keyboardInput.js'
import { SceneRenderer, type SceneRendererOptions } from './sceneRenderer.js'
import { mountGameStylesheet } from './gameStylesheet.js'
import type { SceneEntrance } from '@ancadeba/schemas'
import { GameConfirmationDialog } from './gameConfirmationDialog.js'

export interface GameViewSession {
  readonly submitForm?: SubmitForm | undefined
  readonly prepareMenu?: () => boolean
  readonly saves?: IGameSaves | undefined
  readonly lifecycle: IGameLifecycle
  readonly input: KeyboardInputSink | undefined
}

export interface GameViewOptions extends SceneRendererOptions {
  readonly downloadSave?: (file: GameSaveFile) => void
  readonly scenePicker?: boolean
  readonly scenePickerLabels?: {
    readonly caption: string
    readonly accessibleName: string
    readonly empty: string
  }
}

/** Shared browser surface for the standalone engine and the editor preview. */
export function mountGameView(
  target: HTMLElement,
  game: GameData,
  session: GameViewSession,
  options: GameViewOptions = {},
): () => void {
  const document = target.ownerDocument
  const root = document.createElement('section')
  root.className = 'ancadeba-game'
  root.tabIndex = 0
  const localization = options.localization ?? game.localization

  const syncMetadata = () => {
    const content = localization?.current ?? game
    root.setAttribute('aria-label', content.title)

    if (content.language) root.setAttribute('lang', content.language)
  }

  syncMetadata()
  const viewport = document.createElement('div')
  viewport.className = 'ancadeba-scene-viewport'
  const cleanups: (() => void)[] = []
  let disposed = false
  let sceneRevision = 0

  const confirmations = new GameConfirmationDialog(
    root,
    viewport,
    (key, values) => runtimeText(game, key, values),
    () => session.input?.reset(),
  )

  cleanups.push(() => confirmations.dispose())

  const load = (autosave = false) => {
    const saves = session.saves

    if (!saves || !(autosave ? saves.canLoadAutosave : saves.canLoad)) return

    const sourceGame = session.lifecycle.currentGame
    const sourceScene = session.lifecycle.activeScene
    const slot = saves.selectedSlot

    const perform = () => {
      if (
        disposed ||
        sourceGame !== session.lifecycle.currentGame ||
        sourceScene !== session.lifecycle.activeScene ||
        slot !== saves.selectedSlot
      )
        return

      if (autosave) saves.loadAutosave()
      else saves.load()
    }

    if (sourceGame) confirmations.request(() => runtimeText(game, 'save.confirm'), perform)
    else perform()
  }

  const cleanup = () => {
    if (disposed) return
    disposed = true
    const errors: unknown[] = []

    try {
      for (const release of [...cleanups].reverse()) {
        try {
          release()
        } catch (error) {
          errors.push(error)
        }
      }
    } finally {
      root.remove()
    }

    if (errors.length) throw new AggregateError(errors, 'Game view cleanup failed')
  }

  const enter = (scene: SceneData, entrance?: SceneEntrance) => {
    if (scene.type === 'game' && !session.lifecycle.currentGame) session.lifecycle.startGame()
    session.lifecycle.enterScene(scene.id, entrance)
  }

  const openMenu = (id: string, stillCurrent?: () => boolean) => {
    session.input?.reset()

    if (session.prepareMenu?.() === false || stillCurrent?.() === false) return
    session.lifecycle.openMenu?.(id)
    root.focus()
  }

  const resume = () => {
    session.input?.reset()
    session.lifecycle.resumeGame?.()
    root.focus()
  }

  const menuShortcutFor = (scene: SceneInstance) => {
    const suspended = session.lifecycle.suspendedScene
    const menu = game.menuScene

    if (!suspended && (!menu || scene.type !== 'game')) return

    const revision = sceneRevision
    const stillCurrent = () => !disposed && !confirmations.isOpen && revision === sceneRevision

    // Opening a menu settles queued gameplay work, which must happen outside message delivery.
    return () =>
      queueMicrotask(() => {
        if (!stillCurrent()) return

        if (suspended) resume()
        else if (menu) openMenu(menu, stillCurrent)
      })
  }

  try {
    if (localization) cleanups.push(localization.subscribe(syncMetadata))

    if (localization) cleanups.push(localization.subscribe(() => confirmations.refresh()))
    cleanups.push(
      session.lifecycle.subscribeSceneChanges(() => {
        sceneRevision++
        confirmations.cancel()
      }),
    )
    let selectedSlot = session.saves?.selectedSlot

    if (session.saves)
      cleanups.push(
        session.saves.subscribe(() => {
          if (selectedSlot === session.saves?.selectedSlot) return
          selectedSlot = session.saves?.selectedSlot
          confirmations.cancel()
        }),
      )

    if (options.scenePicker) {
      const label = document.createElement('label')
      label.className = 'ancadeba-scene-picker'
      const caption = document.createElement('span')

      const syncPickerLabels = () => {
        caption.textContent =
          options.scenePickerLabels?.caption ?? runtimeText(game, 'scene.caption')
        select.setAttribute(
          'aria-label',
          options.scenePickerLabels?.accessibleName ?? runtimeText(game, 'scene.preview'),
        )
        empty.textContent = options.scenePickerLabels?.empty ?? runtimeText(game, 'scene.empty')
      }

      const select = document.createElement('select')
      const empty = document.createElement('option')
      empty.value = ''
      syncPickerLabels()
      select.append(empty)

      const sceneOptions = new Map<string, HTMLOptionElement>()

      for (const scene of (localization?.current ?? game).scenes.values()) {
        const option = document.createElement('option')
        option.value = scene.id
        option.textContent = scene.title
        sceneOptions.set(scene.id, option)
        select.append(option)
      }

      if (localization)
        cleanups.push(
          localization.subscribe(() => {
            syncPickerLabels()

            for (const [id, option] of sceneOptions) {
              option.textContent = localization.current.scenes.get(id)?.title ?? id
            }
          }),
        )

      const syncSelection = () => {
        select.value = session.lifecycle.activeScene?.data.id ?? ''
      }

      syncSelection()

      const onChange = () => {
        try {
          if (!select.value) session.lifecycle.leaveScene()
          else {
            const scene = game.scenes.get(select.value)

            if (scene) enter(scene)
          }
        } finally {
          syncSelection()
        }
      }

      select.addEventListener('change', onChange)
      cleanups.push(() => select.removeEventListener('change', onChange))
      cleanups.push(session.lifecycle.subscribeSceneChanges(syncSelection))
      label.append(caption, select)
      const frame = document.createElement('div')
      frame.className = 'ancadeba-scene-frame'
      frame.append(viewport)
      root.append(label, frame)
    } else root.append(viewport)

    target.append(root)

    if (game.stylesheet !== undefined) mountGameStylesheet(viewport, game.stylesheet)

    const renderer = new SceneRenderer(viewport, session.lifecycle, {
      ...options,
      game,
      submitForm: session.submitForm,
      onOpenMenu: openMenu,
      canOpenMenu: () =>
        Boolean(
          session.lifecycle.currentGame &&
          session.lifecycle.openMenu &&
          (session.lifecycle.activeScene?.type === 'game' || session.lifecycle.suspendedScene),
        ),
      canResumeGame: () => Boolean(session.lifecycle.suspendedScene),
      saves: session.saves,
      confirm: confirmations.request,
      onLoadGame: () => load(),
      onLoadAutosave: () => load(true),
      input: session.input,
      keyboardSurface: root,
      menuShortcutFor,
      onActionBarFocusLost: () => root.focus(),
      assets: game.assets,
      localization,
      canEnterScene: (action) =>
        canEnterScene(game, action, session.lifecycle.currentGame?.mapMovement),
      subscribeNavigationChanges: (listener) =>
        session.lifecycle.currentGame?.bindings?.subscribeChanges(listener) ?? (() => {}),
      navigationUnavailableMessage: () => runtimeText(game, 'navigation.blocked'),
      onButtonActivate: (action) => {
        if (disposed) return

        if (action.type === 'resume-game') {
          resume()

          return
        }

        if (action.type === 'open-menu') {
          openMenu(action.scene)

          return
        }

        if (
          action.type === 'enter-scene' &&
          !canEnterScene(game, action, session.lifecycle.currentGame?.mapMovement)
        )
          return
        const scene = game.scenes.get(action.scene)

        if (!scene) throw new Error(`Missing button target scene: ${action.scene}`)

        if (action.type === 'main-menu') session.lifecycle.endGame()

        if (session.lifecycle.suspendedScene && scene.type === 'stand-alone') {
          openMenu(scene.id)

          return
        }

        if (action.type === 'new-game') session.lifecycle.startGame()
        enter(
          scene,
          action.type === 'enter-scene' && action.position && action.mapView
            ? { mapView: action.mapView, position: action.position }
            : undefined,
        )
      },
    })

    cleanups.push(() => renderer.dispose())

    if (session.input) {
      const input = session.input

      const capturesKey = (code: string) => {
        const scene = session.lifecycle.activeScene

        const bar = scene?.data.components.find((component) => component.type === 'action-bar')

        return Boolean(
          bar &&
          Object.entries(bar.slots).some(
            ([id, { inputBinding: binding }]) =>
              scene?.type === 'game' &&
              scene.game.actionBar?.getSlot(scene, bar.id, id) &&
              binding &&
              binding.context === input.context &&
              input.getKeyboardCodes?.(binding.context, binding.input).includes(code),
          ),
        )
      }

      cleanups.push(bindKeyboardInput(root, input, capturesKey))
    }

    if (!session.lifecycle.activeScene) {
      const first =
        game.initialScene === undefined
          ? game.scenes.values().next().value
          : game.scenes.get(game.initialScene)

      if (first) enter(first)
    }

    return cleanup
  } catch (error) {
    cleanup()
    throw error
  }
}
