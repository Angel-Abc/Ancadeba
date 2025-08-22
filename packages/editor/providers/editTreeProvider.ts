import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'

interface TreeNode<T> {
    label: string
    children: TreeNode<T>[]
    isCollapsed: boolean
    data: T | null
    level: number
}

export type GameItemTreeNode = TreeNode<unknown>

export interface IEditTreeProvider {
    get Root(): GameItemTreeNode
}

const logName = 'EditTreeProvider'
export const editTreeProviderToken = token<IEditTreeProvider>(logName)
export const editTreeProviderDependencies: Token<unknown>[] = [loggerToken]
export class EditTreeProvider implements IEditTreeProvider {
    constructor(
        private logger: ILogger,
    ) { }

    public get Root(): GameItemTreeNode {
        return {
            label: 'Sample Game',
            isCollapsed: false,
            data: null,
            level: 0,
            children: [
                {
                    label: 'pages',
                    isCollapsed: true,
                    data: null,
                    level: 1,
                    children: [
                        {
                            label: 'main-game',
                            isCollapsed: false,
                            data: null,
                            level: 2,
                            children: []
                        },
                        {
                            label: 'start-page',
                            isCollapsed: false,
                            data: null,
                            level: 2,
                            children: []
                        }
                    ]
                },
                {
                    label: 'actions',
                    isCollapsed: true,
                    data: null,
                    level: 1,
                    children: [
                        {
                            label: 'actions/general-actions.json',
                            isCollapsed: false,
                            data: null,
                            level: 2,
                            children: []
                        }
                    ]
                },
                {
                    label: 'languages',
                    isCollapsed: true,
                    data: null,
                    level: 1,
                    children: [
                        {
                            label: 'en',
                            isCollapsed: false,
                            data: null,
                            level: 2,
                            children: [
                                {
                                    label: 'languages/en/start-beach.json',
                                    isCollapsed: false,
                                    data: null,
                                    level: 3,
                                    children: []
                                },
                                {
                                    label: 'languages/en/system.json',
                                    isCollapsed: false,
                                    data: null,
                                    level: 3,
                                    children: []
                                },
                                {
                                    label: 'languages/en/tiles.json',
                                    isCollapsed: false,
                                    data: null,
                                    level: 3,
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
}
