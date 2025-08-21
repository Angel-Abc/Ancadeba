import { describe, it, expect } from 'vitest'
import { GameDefinitionProvider } from '../../packages/editor/providers/gameDefinitionProvider'
import type { Game } from '@loader/schema/game'


describe('GameDefinitionProvider', () => {
    it('categorizes item-definitions records', () => {
        const provider = new GameDefinitionProvider()
        const game: Game = {
            title: 'Test',
            description: 'desc',
            version: '1',
            'initial-data': { language: 'en', 'start-page': 'start' },
            languages: {},
            pages: {},
            maps: {},
            tiles: {},
            dialogs: {},
            styling: [],
            actions: [],
            'virtual-keys': [],
            'virtual-inputs': [],
            tags: [],
            'item-definitions': [
                'item-definitions/b.json',
                'item-definitions/a.json'
            ]
        }
        provider.setRoot(game)
        const items = provider.Items.filter(i => i.type === 'item-definitions')
        expect(items.map(i => i.currentFilename)).toEqual([
            'item-definitions/a.json',
            'item-definitions/b.json'
        ])
    })
})
