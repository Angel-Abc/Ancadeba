import { Token, token } from '@ioc/token'
import { gameDefinitionProviderToken, GameItem, IGameDefinitionProvider, RootItem } from './gameDefinitionProvider'
import { ILogger, loggerToken } from '@utils/logger'

interface TreeNode<T> {
    label: string
    children: TreeNode<T>[]
    isCollapsed: boolean
    data: T | null
    level: number
}

export type GameItemTreeNode = TreeNode<GameItem>

export interface IEditTreeProvider {
    get Root(): GameItemTreeNode
}

const logName = 'EditTreeProvider'
export const editTreeProviderToken = token<IEditTreeProvider>(logName)
export const editTreeProviderDependencies: Token<unknown>[] = [loggerToken, gameDefinitionProviderToken]
export class EditTreeProvider implements IEditTreeProvider {
    constructor(
        private logger: ILogger,
        private gameDefinitionProvider: IGameDefinitionProvider
    ) { }

    public get Root(): GameItemTreeNode {
        if (this.gameDefinitionProvider.Items.length === 0) {
            return {
                label: 'No Data',
                children: [],
                isCollapsed: true,
                data: null,
                level: 0
            }
        }
        const rootItem = this.gameDefinitionProvider.Items[0] as RootItem
        const result = {
            label: this.getItemLabel(rootItem),
            children: this.getChildren(1),
            isCollapsed: false,
            data: rootItem,
            level: 0
        }
        return result
    }

    private getChildren(level: number): GameItemTreeNode[] {
        const result: GameItemTreeNode[] = []
        const nodeLookup: Map<string, GameItemTreeNode> = new Map()
        for (let index = 1; index < this.gameDefinitionProvider.Items.length; index++) {
            const item = this.gameDefinitionProvider.Items[index]
            const treeNode = this.getTreeNode(item, level + 1)
            let parentNode: GameItemTreeNode
            if (nodeLookup.has(item.type)) parentNode = nodeLookup.get(item.type)!
            else {
                parentNode = {
                    label: this.getCategoryLabel(item.type),
                    children: [],
                    isCollapsed: true,
                    data: null,
                    level: level
                }
                result.push(parentNode)
                nodeLookup.set(item.type, parentNode)
            }
            if (item.type === 'language') {
                let languageRootNode: GameItemTreeNode
                if (nodeLookup.has(item.currentKey)) languageRootNode = nodeLookup.get(item.currentKey)!
                else {
                    languageRootNode = {
                        label: item.currentKey,
                        children: [],
                        isCollapsed: true,
                        data: null,
                        level: level + 1
                    }
                    parentNode.children.push(languageRootNode)
                }
                treeNode.level = level + 2
                nodeLookup.set(item.currentKey, languageRootNode)
                languageRootNode.children.push(treeNode)
            } else {
                parentNode.children.push(treeNode)
            }
        }
        return result
    }

    private getTreeNode(item: GameItem, level: number): GameItemTreeNode {
        const result: GameItemTreeNode = {
            label: this.getItemLabel(item),
            data: item,
            isCollapsed: false,
            children: [],
            level: level
        }
        return result
    }

    private getItemLabel(item: GameItem): string {
        if (item.type === 'root') return item.current?.title ?? 'game'
        return item.currentFilename
    }

    private getCategoryLabel(type: GameItem['type']): string {
        return type
    }
}
