import { Token, token } from '@ioc/token'
import { IActionHandler } from '@registries/actionHandlerRegistry'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { Message } from '@utils/types'
import { PostMessageAction as PostMessageActionData } from '@loader/data/action'

/**
 * Contract for handlers that post a message to the message bus.
 */
export type IPostMessageAction = IActionHandler<PostMessageActionData>

const logName = 'PostMessageAction'
export const postMessageActionToken = token<IPostMessageAction>(logName)
export const postMessageActionDependencies: Token<unknown>[] = [messageBusToken]

/**
 * {@link IActionHandler} implementation that forwards actions to the
 * {@link IMessageBus}.
 */
export class PostMessageAction implements IPostMessageAction {
    readonly type = 'post-message' as const

    /**
     * Creates a new {@link PostMessageAction}.
     *
     * @param messageBus - Bus used to dispatch the message.
     */
    constructor(private messageBus: IMessageBus){}

    /**
     * Posts the specified message through the {@link IMessageBus}.
     *
     * @param action - Contains the message and payload to dispatch.
     * @param _message - Optional incoming message; ignored.
     * @param _data - Optional auxiliary data; ignored.
     */
    public handle(action: PostMessageActionData, _message?: Message, _data?: unknown): void {
        void _message
        void _data
        this.messageBus.postMessage({
            message: action.message,
            payload: action.payload
        })
    }
}
