import { Token, token } from '@ioc/token'
import { Game } from '@loader/schema/game'
import { Page } from '@loader/schema/page'
import { Actions } from '@loader/schema/action'
import { Language } from '@loader/schema/language'
import { GameMap } from '@loader/schema/map'
import { TileSet } from '@loader/schema/tile'
import { DialogSet } from '@loader/schema/dialog'
import { VirtualKeys } from '@loader/schema/inputs'
import { VirtualInputs } from '@loader/schema/inputs'
import { Tags } from '@loader/schema/tags'
import { ItemDefinitions } from '@loader/schema/itemDefinitions'
import { ILogger, loggerToken } from '@utils/logger'

export interface BaseItem<T, Type extends string = string> {
    id: number
    current: T | null
    original: T | null
    type: Type
}

export type BaseFileItem<T> = BaseItem<T> & {
    currentFilename: string
    readonly originalFilename: string
}

export type BaseRecordItem<T> = BaseFileItem<T> & {
    currentKey: string
    readonly originalKey: string
}

export type RootItem = BaseItem<Game> & { type: 'root' }
export type PageItem = BaseRecordItem<Page> & { type: 'page' }
export type ActionsItem = BaseFileItem<Actions> & { type: 'actions' }
export type LanguageItem = BaseRecordItem<Language> & { type: 'languages' }
export type MapItem = BaseRecordItem<GameMap> & { type: 'map' }
export type TileItem = BaseRecordItem<TileSet> & { type: 'tile' }
export type DialogItem = BaseRecordItem<DialogSet> & { type: 'dialog' }
export type StylingItem = BaseFileItem<string> & { type: 'styling' }
export type VirtualKeysItem = BaseFileItem<VirtualKeys> & { type: 'virtual-keys' }
export type VirtualInputsItem = BaseFileItem<VirtualInputs> & { type: 'virtual-inputs' }
export type TagsItem = BaseFileItem<Tags> & { type: 'tags' }
export type ItemDefinitionsItem = BaseFileItem<ItemDefinitions> & { type: 'item-definitions' }

export type GameItem = RootItem | PageItem | ActionsItem | LanguageItem | MapItem
    | TileItem | DialogItem | StylingItem | VirtualInputsItem | VirtualKeysItem
    | TagsItem | ItemDefinitionsItem

export interface IGameDefinitionProvider {
    get Items(): GameItem[]
    setRoot(root: Game): void
    getItemById(id: number): GameItem
    setItem<T>(id: number, item: T): void
    setOriginal<T>(id: number, item: T): void
}

const logName = 'GameDefinitionProvider'
export const gameDefinitionProviderToken = token<IGameDefinitionProvider>(logName)
export const gameDefinitionProviderDependencies: Token<unknown>[] = [
    loggerToken
]
export class GameDefinitionProvider implements IGameDefinitionProvider {
    private items: GameItem[] = []
    private lookUp: Map<number, GameItem> = new Map<number, GameItem>()
    private nextId: number = 1
    constructor(
        private logger: ILogger
    ) { }

    public get Items(): GameItem[] {
        return this.items
    }

    public setRoot(root: Game): void {
        const rootItem: RootItem = {
            id: this.nextId++,
            type: 'root',
            current: root,
            original: root
        }
        this.lookUp.clear()
        this.items = [rootItem]
        this.lookUp.set(rootItem.id, rootItem)
        this.addPageItems(root)
        this.addActionsItems(root)
        this.addLanguageItems(root)
        this.addMapItems(root)
        this.addTileItems(root)
        this.addDialogItems(root)
        this.addStylingItems(root)
        this.addVirtualKeysItems(root)
        this.addVirtualInputsItems(root)
        this.addTags(root)
        this.addItemDefinitions(root)
    }

    public getItemById(id: number): GameItem {
        if (this.lookUp.has(id)) return this.lookUp.get(id)!
        throw new Error(this.logger.error(logName, 'No game item with id {0} was found', id))
    }

    public setItem<T>(id: number, item: T): void {
        const gameItem = this.getItemById(id) as BaseItem<T>
        gameItem.current = item
    }

    public setOriginal<T>(id: number, item: T): void {
        const gameItem = this.getItemById(id) as BaseItem<T>
        gameItem.original = item
    }

    private addMapItems(root: Game): void {
        this.addRecordItems<MapItem>(root.maps, (id, key, filename) => ({
            id,
            type: 'map',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename,
            currentKey: key,
            originalKey: key
        }))
    }

    private addTileItems(root: Game): void {
        this.addRecordItems<TileItem>(root.tiles, (id, key, filename) => ({
            id,
            type: 'tile',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename,
            currentKey: key,
            originalKey: key
        }))
    }

    private addDialogItems(root: Game): void {
        this.addRecordItems<DialogItem>(root.dialogs, (id, key, filename) => ({
            id,
            type: 'dialog',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename,
            currentKey: key,
            originalKey: key
        }))
    }

    private addStylingItems(root: Game): void {
        this.addArrayItems<StylingItem>(root.styling, (id, filename) => ({
            id,
            type: 'styling',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename
        }))
    }

    private addVirtualKeysItems(root: Game): void {
        this.addArrayItems<VirtualKeysItem>(root["virtual-keys"], (id, filename) => ({
            id,
            type: 'virtual-keys',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename
        }))
    }

    private addVirtualInputsItems(root: Game): void {
        this.addArrayItems<VirtualInputsItem>(root["virtual-inputs"], (id, filename) => ({
            id,
            type: 'virtual-inputs',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename
        }))
    }

    private addTags(root: Game): void {
        this.addArrayItems<TagsItem>(root.tags, (id, filename) => ({
            id,
            type: 'tags',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename
        }))
    }

    private addItemDefinitions(root: Game): void {
        this.addArrayItems<ItemDefinitionsItem>(root['item-definitions'], (id, filename) => ({
            id,
            type: 'item-definitions',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename
        }))
    }

    private addPageItems(root: Game): void {
        this.addRecordItems<PageItem>(root.pages, (id, key, value) => ({
            id,
            type: 'page',
            current: null,
            original: null,
            currentFilename: value,
            originalFilename: value,
            currentKey: key,
            originalKey: key
        }))
    }

    private addActionsItems(root: Game): void {
        this.addArrayItems<ActionsItem>(root.actions, (id, filename) => ({
            id,
            type: 'actions',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename
        }))
    }

    private addLanguageItems(root: Game): void {
        this.addRecordArrayItems<LanguageItem>(root.languages, (id, lang, filename) => ({
            id,
            type: 'languages',
            current: null,
            original: null,
            currentFilename: filename,
            originalFilename: filename,
            currentKey: lang,
            originalKey: lang,
        }))
    }


    private addArrayItems<T extends GameItem>(filenames: string[], createItem: (id: number, filename: string) => T): void {
        for (const filename of [...filenames].sort()) {
            const item = createItem(this.nextId++, filename)
            this.items.push(item)
            this.lookUp.set(item.id, item)
        }
    }

    private addRecordItems<T extends GameItem>(
        records: Record<string, string>,
        createItem: (id: number, key: string, filename: string) => T
    ): void {
        for (const key of Object.keys(records).sort()) {
            const filename = records[key]
            const item = createItem(this.nextId++, key, filename)
            this.items.push(item)
            this.lookUp.set(item.id, item)
        }
    }

    private addRecordArrayItems<T extends GameItem>(
        records: Record<string, string[]>,
        createItem: (id: number, key: string, filename: string) => T
    ): void {
        for (const key of Object.keys(records).sort()) {
            for (const filename of [...records[key]].sort()) {
                const item = createItem(this.nextId++, key, filename)
                this.items.push(item)
                this.lookUp.set(item.id, item)
            }
        }
    }


}
