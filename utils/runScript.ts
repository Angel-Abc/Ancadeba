import { fatalError } from './logMessage'

export function runScript<T, U = unknown, V = unknown>(script: string, context: U, data: V) {
    try {
        const scriptFunction = new Function('context', 'data', script)
        return scriptFunction(context, data) as T
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        fatalError('ScriptRunner', 'Error executing script {0}', message)
    }
}
