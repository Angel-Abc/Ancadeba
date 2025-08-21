import { describe, it, expect, vi } from 'vitest'
import { EditTreeProvider } from './editTreeProvider'
import { IGameDefinitionProvider, GameItem, RootItem, PageItem, LanguageItem } from './gameDefinitionProvider'
import type { ILogger } from '@utils/logger'
import type { Game } from '@loader/schema/game'


describe('EditTreeProvider', () => {
    it('organizes items into categories and nested language groups', () => {
        const rootItem: RootItem = { id: 1, type: 'root', current: { title: 'My Game' } as unknown as Game, original: { title: 'My Game' } as unknown as Game }
        const pageItem: PageItem = {
            id: 2,
            type: 'page',
            current: null,
            original: null,
            currentFilename: 'page1.json',
            originalFilename: 'page1.json',
            currentKey: 'page1',
            originalKey: 'page1'
        }
        const languageEn1: LanguageItem = {
            id: 3,
            type: 'language',
            current: null,
            original: null,
            currentFilename: 'en-1.json',
            originalFilename: 'en-1.json',
            currentKey: 'en',
            originalKey: 'en'
        }
        const languageEn2: LanguageItem = {
            id: 4,
            type: 'language',
            current: null,
            original: null,
            currentFilename: 'en-2.json',
            originalFilename: 'en-2.json',
            currentKey: 'en',
            originalKey: 'en'
        }
        const languageFr: LanguageItem = {
            id: 5,
            type: 'language',
            current: null,
            original: null,
            currentFilename: 'fr-1.json',
            originalFilename: 'fr-1.json',
            currentKey: 'fr',
            originalKey: 'fr'
        }
        const items: GameItem[] = [rootItem, pageItem, languageEn1, languageEn2, languageFr]
        const mockProvider: IGameDefinitionProvider = {
            get Items() {
                return items
            },
            setRoot: vi.fn()
        }
        const logger: ILogger = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        }

        const provider = new EditTreeProvider(logger, mockProvider)
        const root = provider.Root

        expect(root.label).toBe('My Game')
        expect(root.level).toBe(0)
        expect(root.children).toHaveLength(2)

        const pageCategory = root.children.find(n => n.label === 'page')!
        expect(pageCategory.level).toBe(1)
        expect(pageCategory.isCollapsed).toBe(true)
        expect(pageCategory.children).toHaveLength(1)
        expect(pageCategory.children[0].label).toBe('page1.json')
        expect(pageCategory.children[0].level).toBe(2)

        const languageCategory = root.children.find(n => n.label === 'language')!
        expect(languageCategory.level).toBe(1)
        expect(languageCategory.children).toHaveLength(2)

        const enGroup = languageCategory.children.find(n => n.label === 'en')!
        expect(enGroup.level).toBe(2)
        expect(enGroup.children.map(c => c.label)).toEqual(['en-1.json', 'en-2.json'])
        enGroup.children.forEach(child => expect(child.level).toBe(3))

        const frGroup = languageCategory.children.find(n => n.label === 'fr')!
        expect(frGroup.level).toBe(2)
        expect(frGroup.children).toHaveLength(1)
        expect(frGroup.children[0].label).toBe('fr-1.json')
        expect(frGroup.children[0].level).toBe(3)
    })
})
