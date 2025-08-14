import type { Action as ActionData } from '@loader/data/action'
import { type Action } from '@loader/schema/action'
import { fatalError } from '@utils/logMessage'

const logName = 'mapAction'

export function mapAction(action: Action): ActionData {
    switch(action.type){
        case 'post-message':
            return {
                type: 'post-message',
                message: action.message,
                payload: action.payload
            }
        case 'script':
            return {
                type: 'script',
                script: Array.isArray(action.script) ? action.script.join('\n') : action.script
            }
        default:
            // Halt execution if an unsupported action type is encountered
            fatalError(logName, 'Unsupported action type: {0}', (action as { type: string }).type)
    }
}
