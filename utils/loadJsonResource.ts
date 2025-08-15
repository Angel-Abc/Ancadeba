/**
 * Fetches JSON resources and validates them against a provided Zod schema.
 * Emits debug logs and halts execution via {@link fatalError} on failure.
 */
import { ZodType } from 'zod'
import { fatalError, logDebug } from './logMessage'

const logName = 'loadJsonResource'

/**
 * Retrieve a JSON document from a URL and validate it using the supplied schema.
 *
 * @param url The location of the JSON resource.
 * @param schema A Zod schema describing the expected shape of the JSON.
 * @returns The parsed and validated object.
 * @throws {Error} If the network request fails, the response is not OK, the
 * JSON is invalid, or the data fails schema validation. Errors are reported via
 * {@link fatalError} which throws.
 */
export async function loadJsonResource<T>(url: string, schema: ZodType<T>): Promise<T> {
    logDebug(logName, 'Fetching JSON resource from {0}', url)
    let response: Response
    try {
        response = await fetch(url)
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        fatalError(logName, 'Failed to fetch {0} with message {1}', url, message)
    }

    if (!response.ok) {
        fatalError(logName, 'Failed to fetch resource {0} with response {1}', url, response)
    }

    let json: unknown
    try {
        json = await response.json()
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        fatalError(logName, 'Invalid JSON response: {0} for resource {1}', message, url)
    }

    const parseResult = schema.safeParse(json)
    if (!parseResult.success) {
        fatalError(logName, 'Schema validation failed for resource {0} with error {1}', url, parseResult.error.message)
    }

    logDebug(logName, 'Resulting object: {0}', parseResult.data)

    return parseResult.data
}
