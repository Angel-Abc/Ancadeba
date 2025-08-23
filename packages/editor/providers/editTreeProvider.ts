import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'
import { gameDataProviderToken, IGameDataProvider } from './gameDataProvider'
import { BaseItem } from '@editor/types/gameItems'

interface TreeNode<T> {
    label: string
    id: number
    children: TreeNode<T>[]
    data: T | null
}

export type GameItemTreeNode = TreeNode<BaseItem>

export interface IEditTreeProvider {
    get Root(): GameItemTreeNode
}

const logName = 'EditTreeProvider'
export const editTreeProviderToken = token<IEditTreeProvider>(logName)
export const editTreeProviderDependencies: Token<unknown>[] = [
    loggerToken,
    gameDataProviderToken
]
export class EditTreeProvider implements IEditTreeProvider {
    constructor(
        private logger: ILogger,
        private gameDataProvider: IGameDataProvider
    ) { }

    public get Root(): GameItemTreeNode {
        if (this.gameDataProvider.Root === null) {
            return {
                label: 'No data',
                data: null,
                id: 0,
                children: []
            }
        }

        const rootItem = this.gameDataProvider.Root
        const root = this.getItem(rootItem)
        return root
    }

    private getItem(item: BaseItem): GameItemTreeNode {
        var result = {
            label: item.label,
            id: item.id,
            data: item,
            children: item.children.map(i => this.getItem(i))
        }
        return result
    }
}
