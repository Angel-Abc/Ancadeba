import type { AuthoredPlaythrough } from './authoredRules.js'
import type { GameInstance, IGameLifecycle, SceneInstance } from './gameLifecycle.js'

export type ConfirmCharacter = (
  origin: SceneInstance,
  componentId: string,
  selections: ReadonlyMap<string, string>,
) => boolean

export function characterConfirmation(
  lifecycle: IGameLifecycle,
  playthroughFor: (game: GameInstance) => AuthoredPlaythrough | undefined,
  settle: () => boolean,
): ConfirmCharacter {
  return (origin, componentId, selections) => {
    if (lifecycle.activeScene !== origin || !settle() || lifecycle.activeScene !== origin)
      return false

    const component = origin.data.components.find(({ id }) => id === componentId)

    if (component?.type !== 'character-creator') return false
    const active = lifecycle.currentGame

    if (origin.type === 'game') {
      if (active !== origin.game || !playthroughFor(active)?.applyCharacterProfile(selections))
        return false
    } else {
      if (active) return false

      try {
        lifecycle.startGame((candidate) => {
          if (!playthroughFor(candidate)?.applyCharacterProfile(selections)) throw invalidChoices
        })
      } catch (error) {
        if (error === invalidChoices) return false
        throw error
      }
    }

    lifecycle.enterScene(component.continueScene)

    return true
  }
}

const invalidChoices = new Error('Invalid character choices')
