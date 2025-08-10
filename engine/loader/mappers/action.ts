import type {Action as ActionData } from '@loader/data/action'
import { type Action } from '@loader/schema/action'

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
    }
}