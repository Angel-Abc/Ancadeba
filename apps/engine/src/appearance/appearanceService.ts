import { Token, token } from '@ancadeba/utils'
import {
  COMPONENT_KEYS,
  AppearanceComponent,
  EquippedAppearance,
  createAppearanceComponent,
} from '../ecs/components'
import { IWorld, worldToken } from '../ecs/world'
import { IAppearanceService } from './types'

const logName = 'engine/appearance/appearanceService'
export const appearanceServiceToken = token<IAppearanceService>(logName)
export const appearanceServiceDependencies: Token<unknown>[] = [worldToken]

export class AppearanceService implements IAppearanceService {
  constructor(private readonly world: IWorld) {}

  getPlayerAppearances(): AppearanceComponent | undefined {
    const playerEntities = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (playerEntities.length === 0) {
      return undefined
    }

    const playerEntity = playerEntities[0]
    return this.world.getComponent<AppearanceComponent>(
      playerEntity,
      COMPONENT_KEYS.appearance
    )
  }

  hasAppearanceInCategory(categoryId: string): boolean {
    const appearances = this.getPlayerAppearances()
    if (!appearances) {
      return false
    }

    return appearances.equipped.some(
      (equipped) => equipped.categoryId === categoryId
    )
  }

  getEquippedAppearance(categoryId: string): string | undefined {
    const appearances = this.getPlayerAppearances()
    if (!appearances) {
      return undefined
    }

    const equipped = appearances.equipped.find(
      (eq) => eq.categoryId === categoryId
    )
    return equipped?.appearanceId
  }

  equipAppearance(categoryId: string, appearanceId: string): void {
    const playerEntities = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (playerEntities.length === 0) {
      return
    }

    const playerEntity = playerEntities[0]
    let appearances = this.world.getComponent<AppearanceComponent>(
      playerEntity,
      COMPONENT_KEYS.appearance
    )

    // Create component if it doesn't exist
    if (!appearances) {
      appearances = createAppearanceComponent()
    }

    // Remove existing appearance in the same category
    const filteredEquipped = appearances.equipped.filter(
      (eq) => eq.categoryId !== categoryId
    )

    // Add the new appearance
    const newEquipped: EquippedAppearance = {
      categoryId,
      appearanceId,
    }

    const updatedAppearances: AppearanceComponent = {
      equipped: [...filteredEquipped, newEquipped],
    }

    this.world.setComponent(
      playerEntity,
      COMPONENT_KEYS.appearance,
      updatedAppearances
    )
  }

  unequipAppearance(categoryId: string): void {
    const playerEntities = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (playerEntities.length === 0) {
      return
    }

    const playerEntity = playerEntities[0]
    const appearances = this.world.getComponent<AppearanceComponent>(
      playerEntity,
      COMPONENT_KEYS.appearance
    )

    if (!appearances) {
      return
    }

    // Remove appearance from the category
    const updatedAppearances: AppearanceComponent = {
      equipped: appearances.equipped.filter(
        (eq) => eq.categoryId !== categoryId
      ),
    }

    this.world.setComponent(
      playerEntity,
      COMPONENT_KEYS.appearance,
      updatedAppearances
    )
  }

  getAllEquippedAppearances(): EquippedAppearance[] {
    const appearances = this.getPlayerAppearances()
    if (!appearances) {
      return []
    }

    return [...appearances.equipped]
  }
}
