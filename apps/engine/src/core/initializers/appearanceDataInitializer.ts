import { Token, token } from '@ancadeba/utils'
import type { Appearance } from '@ancadeba/schemas'
import {
  IAppearanceDataStorage,
  appearanceDataStorageToken,
} from '../../resourceData/storage'

export interface IAppearanceDataInitializer {
  initializeAppearances(appearances: Appearance[]): void
}

const logName = 'engine/core/initializers/appearanceDataInitializer'
export const appearanceDataInitializerToken =
  token<IAppearanceDataInitializer>(logName)
export const appearanceDataInitializerDependencies: Token<unknown>[] = [
  appearanceDataStorageToken,
]

export class AppearanceDataInitializer implements IAppearanceDataInitializer {
  constructor(private readonly appearanceDataStorage: IAppearanceDataStorage) {}

  initializeAppearances(appearances: Appearance[]): void {
    appearances.forEach((appearance) => {
      this.appearanceDataStorage.addAppearanceData(appearance.id, appearance)
    })
  }
}
