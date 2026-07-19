import type {
  RuntimeGameContent,
  RuntimeInteraction,
} from '@angelabc/ancadeba-content'
import type { GameState } from './gameState'
import { getCurrentLocation } from './navigation'

export function isInteractionCompleted(
  state: GameState,
  interactionId: string,
): boolean {
  return state.completedInteractionIds.includes(interactionId)
}

export type InteractionAvailability =
  | { available: true }
  | { available: false; failureMessage: string }

export function getInteractionAvailability(
  interaction: RuntimeInteraction,
  state: GameState,
): InteractionAvailability {
  if (
    interaction.requirement &&
    !state.inventoryItemIds.includes(interaction.requirement.itemId)
  ) {
    return {
      available: false,
      failureMessage: interaction.requirement.failureMessage,
    }
  }
  return { available: true }
}

export function performInteraction(
  game: RuntimeGameContent,
  state: GameState,
  interactionId: string,
): GameState {
  const currentLocation = getCurrentLocation(game, state)
  const interaction = currentLocation.interactions.find(
    (interaction) => interaction.id === interactionId,
  )

  if (!interaction) {
    throw new Error(
      `Interaction with id "${interactionId}" not found in location "${currentLocation.id}".`,
    )
  }

  if (isInteractionCompleted(state, interactionId)) {
    throw new Error(
      `Interaction with id "${interactionId}" is already completed.`,
    )
  }

  const availability = getInteractionAvailability(interaction, state)
  if (!availability.available) {
    throw new Error(availability.failureMessage)
  }

  return {
    ...state,
    completedInteractionIds: [...state.completedInteractionIds, interactionId],
  }
}
