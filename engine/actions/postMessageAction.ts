import { Token, token } from '@ioc/token'
import { IActionHandler } from '@registries/actionHandlerRegistry'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { Message } from '@utils/types'
import { PostMessageAction as PostMessageActionData } from '@loader/data/action'

export type IPostMessageAction = IActionHandler<PostMessageActionData>

const logName = 'PostMessageAction'
export const postMessageActionToken = token<IPostMessageAction>(logName)
export const PostMessageActionDependencies: Token<unknown>[] = [messageBusToken]
export class PostMessageAction implements IPostMessageAction {
    readonly type = 'post-message' as const

    constructor(private messageBus: IMessageBus){}

    public handle(action: PostMessageActionData, _message?: Message, _data?: unknown): void {
        void _message
        void _data
        this.messageBus.postMessage({
            message: action.message,
            payload: action.payload
        })
    }
}
