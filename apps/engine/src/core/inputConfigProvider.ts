import { InputRange, InputRule } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../gameState.ts/provider'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../resourceData/provider'

export interface IInputConfigProvider {
  getInputRanges(): InputRange | undefined
  getInputRules(): InputRule[]
  getResolvedInputRules(): Map<string, InputRule>
}

const logName = 'engine/core/inputConfigProvider'
export const inputConfigProviderToken = token<IInputConfigProvider>(logName)
export const inputConfigProviderDependencies: Token<unknown>[] = [
  gameStateProviderToken,
  resourceDataProviderToken,
]

export class InputConfigProvider implements IInputConfigProvider {
  constructor(
    private readonly gameStateProvider: IGameStateProvider,
    private readonly resourceDataProvider: IResourceDataProvider
  ) {}

  getInputRanges(): InputRange | undefined {
    const scene = this.resourceDataProvider.getSceneData(
      this.gameStateProvider.activeSceneId
    )
    const sceneRanges = scene.inputRanges
    const gameRanges = this.gameStateProvider.inputRanges
    if (!sceneRanges) {
      return gameRanges
    }
    if (!gameRanges) {
      return sceneRanges
    }

    const merged: InputRange = []
    const maxRows = Math.max(sceneRanges.length, gameRanges.length)
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
      const sceneRow = sceneRanges[rowIndex]
      const gameRow = gameRanges[rowIndex]
      if (!sceneRow) {
        merged.push(gameRow ? [...gameRow] : [])
        continue
      }
      if (!gameRow) {
        merged.push([...sceneRow])
        continue
      }

      const mergedRow = []
      const maxColumns = Math.max(sceneRow.length, gameRow.length)
      for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
        const sceneInput = sceneRow[columnIndex]
        if (sceneInput === null || sceneInput === undefined) {
          mergedRow.push(gameRow[columnIndex] ?? null)
          continue
        }
        mergedRow.push(sceneInput)
      }
      merged.push(mergedRow)
    }

    return merged
  }

  getInputRules(): InputRule[] {
    const scene = this.resourceDataProvider.getSceneData(
      this.gameStateProvider.activeSceneId
    )
    const sceneRules = scene.inputRules ?? []
    const componentRules = scene.components.flatMap(
      (component) => component.inputRules ?? []
    )

    return [...sceneRules, ...componentRules]
  }

  getResolvedInputRules(): Map<string, InputRule> {
    const rules = this.getInputRules()
    const resolvedRules = new Map<string, InputRule>()
    const pendingRules = rules.filter((rule) => !rule.virtualInput)
    rules.forEach((rule) => {
      if (rule.virtualInput) {
        resolvedRules.set(rule.virtualInput, rule)
      }
    })

    const inputRanges = this.getInputRanges() ?? []
    let pendingIndex = 0
    inputRanges.forEach((row) => {
      row.forEach((input) => {
        if (!input || pendingIndex >= pendingRules.length) {
          return
        }
        if (resolvedRules.has(input.virtualInput)) {
          return
        }
        const nextRule = pendingRules[pendingIndex]
        if (!nextRule) {
          return
        }
        pendingIndex += 1
        resolvedRules.set(input.virtualInput, nextRule)
      })
    })

    return resolvedRules
  }
}
