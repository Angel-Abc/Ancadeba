/**
 * Saves JSON resources validated by a provided Zod schema.
 * Emits debug logs and halts execution via {@link fatalError} on failure.
 */
import { ZodType } from 'zod'
import { fatalError } from './logMessage'
import type { ILogger } from './logger'

const logName = 'saveJsonResource'

/**
 * Validate and send a JSON document to a URL using HTTP PUT.
 *
 * @param url The destination for the JSON resource.
 * @param data The data to serialize and send.
 * @param schema A Zod schema describing the expected shape of the data.
 * @throws {Error} If validation fails or the network request errors. Errors are
 * reported via {@link fatalError} which throws.
 */
export async function saveJsonResource<T>(url: string, data: unknown, schema: ZodType<T>, logger: ILogger): Promise<void> {
    logger.debug(logName, 'Saving JSON resource to {0}', url)

    const parseResult = schema.safeParse(data)
    if (!parseResult.success) {
        fatalError(logName, 'Schema validation failed for resource {0} with error {1}', url, parseResult.error.message)
    }

    let response: Response
    try {
        response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(parseResult.data)
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        fatalError(logName, 'Failed to save {0} with message {1}', url, message)
    }

    if (!response.ok) {
        fatalError(logName, 'Failed to save resource {0} with response {1}', url, response)
    }

    logger.debug(logName, 'Successfully saved resource to {0}', url)
}

