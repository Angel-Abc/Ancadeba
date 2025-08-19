import { fatalError } from './logMessage'

/**
 * Executes arbitrary JavaScript code in a new function scope.
 *
 * @template T Type of the return value produced by the script.
 * @template U Type of the context object available to the script.
 * @template V Type of additional data passed to the script.
 * @param {string} script JavaScript source to execute.
 * @param {U} context Object provided as the first argument to the script.
 * @param {V} data Data provided as the second argument to the script.
 * @returns {T | undefined} The value returned by the script, or `undefined` if execution fails.
 * @remarks Errors thrown during execution are caught and reported via {@link fatalError}.
 */
export function runScript<T, U = unknown, V = unknown>(script: string, context: U, data: V) {
    try {
        const scriptFunction = new Function('context', 'data', script)
        return scriptFunction(context, data) as T
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        fatalError('ScriptRunner', 'Error executing script {0}', message)
    }
}
