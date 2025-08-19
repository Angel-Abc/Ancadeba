import { describe, it, expect, vi } from 'vitest'
import { InputSourcesService } from '../../packages/engine/services/inputSourcesService'
import type { IGameDataProvider, ActiveInput } from '../../packages/engine/providers/gameDataProvider'
import type { IConditionResolver } from '../../packages/engine/conditions/conditionResolver'
import type { IInputsProvider, IInputsProviderRegistry } from '../../packages/engine/registries/inputsProviderRegistry'
import type { ILogger } from '@utils/logger'
import type { Input } from '../../packages/engine/loader/data/inputs'
import type { Condition } from '../../packages/engine/loader/data/condition'

describe('InputSourcesService', () => {
  it('uses the last provider and warns when duplicate virtualInputs are supplied', () => {
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const conditionResolver: IConditionResolver = {
      resolve: (condition: Condition | null | undefined) => !!condition && condition.script.endsWith('2')
    }

    const input1: Input = {
      virtualInput: 'jump',
      label: 'Jump1',
      description: '',
      visible: { type: 'script', script: 'vis1' },
      enabled: { type: 'script', script: 'en1' },
      action: { type: 'noop' }
    }

    const input2: Input = {
      virtualInput: 'jump',
      label: 'Jump2',
      description: '',
      visible: { type: 'script', script: 'vis2' },
      enabled: { type: 'script', script: 'en2' },
      action: { type: 'noop' }
    }

    const provider1: IInputsProvider = {
      isActive: () => true,
      getInputs: () => [input1]
    }
    const provider2: IInputsProvider = {
      isActive: () => true,
      getInputs: () => [input2]
    }

    const registry: IInputsProviderRegistry = {
      getInputsProviders: () => [provider1, provider2],
      registerInputsProvider: vi.fn(),
      clear: vi.fn()
    }

    const gameData: { activeInputs: Map<string, ActiveInput> } = { activeInputs: new Map() }
    const gameDataProvider: IGameDataProvider = { Game: gameData } as unknown as IGameDataProvider

    const service = new InputSourcesService(gameDataProvider, conditionResolver, registry, logger)
    service.updateInputs()

    const result = gameDataProvider.Game.activeInputs.get('jump')
    expect(result?.input).toBe(input2)
    expect(result?.enabled).toBe(true)
    expect(result?.visible).toBe(true)
    expect(logger.warn).toHaveBeenCalledWith('InputSourcesService', 'Duplicate input for virtualInput {0}', 'jump')
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })
})
