import type { IGameLifecycle } from './gameLifecycle.js'

/** Menu presentation does not change the scene observed by gameplay services. */
export function gameplayLifecycle(lifecycle: IGameLifecycle): IGameLifecycle {
  return {
    get currentGame() {
      return lifecycle.currentGame
    },
    get activeScene() {
      return lifecycle.suspendedScene ?? lifecycle.activeScene
    },
    get disposed() {
      return lifecycle.disposed
    },
    subscribeSceneChanges(handler) {
      let previous = lifecycle.suspendedScene ?? lifecycle.activeScene

      return lifecycle.subscribeSceneChanges(() => {
        const current = lifecycle.suspendedScene ?? lifecycle.activeScene

        if (current === previous) return
        const change = { previous, current }
        previous = current
        handler(change)
      })
    },
    bindGameRuntime: (factory) => lifecycle.bindGameRuntime(factory),
    startGame: (prepare, restore) => lifecycle.startGame(prepare, restore),
    validateGame: (prepare, restore) => lifecycle.validateGame(prepare, restore),
    enterScene: (id, entrance) => lifecycle.enterScene(id, entrance),
    leaveScene: () => lifecycle.leaveScene(),
    endGame: () => lifecycle.endGame(),
    dispose: () => lifecycle.dispose(),
  }
}
