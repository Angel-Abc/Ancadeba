import { describe, it, expect } from 'vitest'
import { mapGame } from '@loader/mappers/game'
import { mapLanguage } from '@loader/mappers/language'
import { mapCondition } from '@loader/mappers/condition'
import type { Game } from '@loader/schema/game'
import type { Language as SchemaLanguage } from '@loader/schema/language'
import type { Condition as ConditionData } from '@loader/data/condition'

describe('Loader mappers', () => {
  it('maps game data to runtime format', () => {
    const input: Game = {
      title: 'My game',
      description: 'desc',
      version: '1.0',
      'initial-data': { language: 'en', 'start-page': 'start' },
      languages: { en: ['English'] },
      pages: { start: 'page1' },
      maps: { world: 'mapdata' },
      tiles: { tile1: 'tiledata' },
      dialogs: { dlg1: 'dialogdata' },
      styling: ['style.css'],
      handlers: ['handler1'],
      'virtual-keys': ['vk1'],
      'virtual-inputs': ['vi1']
    }

    const game = mapGame(input, '')
    expect(game.title).toBe('My game')
    expect(game.initialData).toEqual({ language: 'en', startPage: 'start' })
  })

  it('maps language translations', () => {
    const input: SchemaLanguage = {
      id: 'en',
      translations: {
        greeting: 'Hello',
        multiline: ['line1', 'line2']
      }
    }

    const result = mapLanguage(input)
    expect(result).toEqual({
      id: 'en',
      translations: {
        greeting: 'Hello',
        multiline: 'line1\n line2'
      }
    })
  })

  it('maps condition data', () => {
    const input: ConditionData = { type: 'script', script: 'return true' }
    const result = mapCondition(input)
    expect(result).toEqual({ type: 'script', script: 'return true' })
  })
})
