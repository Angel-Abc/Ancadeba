import type { Action as ActionData } from '@loader/data/action'
import { type Action } from '@loader/schema/action'
import { fatalError } from '@utils/logMessage'

const logName = 'mapAction'

/**
 * Convert an action from the game schema to the loader runtime format.
 *
 * Supported action types:
 * - `post-message`: passes through message and payload.
 * - `script`: normalizes script content to a single string, joining arrays with newlines.
 *
 * Unsupported action types trigger a fatal error.
 *
 * @param action - Action definition from the schema.
 * @returns Normalized action data ready for execution.
 */
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
