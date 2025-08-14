import { Action, BaseAction } from '@loader/data/action'
import { Message } from '@utils/types'

export interface IActionHandler<T extends BaseAction = Action> {
    readonly type: T['type']
    handle(action: T, message?: Message, data?: unknown): void
}
