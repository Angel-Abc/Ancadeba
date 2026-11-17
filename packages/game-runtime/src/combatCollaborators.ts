import type { CombatDefinition, RewardOperation } from '@ancadeba/schemas'
import type { SceneInstance } from './gameLifecycle.js'
import type { CombatCapture } from './combat.js'
import type { CombatStatsSnapshot } from './combatStats.js'
import type { TemporaryStatContribution } from './combatEffects.js'

/** Coordination ports for combat; presentation interfaces remain separate. */
export interface CombatRewardService {
  capture(
    scene: SceneInstance,
    component: string,
    operation: RewardOperation,
  ): CombatCapture | undefined
  canCommand(scene: SceneInstance, component: string, operation: RewardOperation): boolean
  execute(scene: SceneInstance, component: string, operation: RewardOperation): void
  complete(definition: CombatDefinition): (() => void) | undefined
  text(scene: SceneInstance, component: string): string
  subscribeChanges(listener: () => void): () => void
}

export interface CombatLevelingService {
  version(profile: string | undefined): object | undefined
  moveAvailable(definition: CombatDefinition, move: string): boolean
  text(profile: string): string
  subscribeChanges(listener: () => void): () => void
}

export interface CombatStatsService {
  setTemporaryEffects(read: (owner: string) => readonly TemporaryStatContribution[]): () => void
  baseSnapshot(owner: string): CombatStatsSnapshot | undefined
  encounterIssue(definition: CombatDefinition): string | undefined
  encounterVersion(definition: CombatDefinition): object | undefined
  acquire(definition: CombatDefinition): boolean
  release(encounter: string): void
}
