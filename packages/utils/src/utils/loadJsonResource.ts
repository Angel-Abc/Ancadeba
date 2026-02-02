import { ZodType } from 'zod'
import { ILogger } from '../logger/types'

const logName = 'utils/utils/loadJsonResource'

export async function loadJsonResource<T>(
  url: string,
  schema: ZodType<T>,
  logger: ILogger,
): Promise<T> {
  logger.debug(logName, 'Fetching JSON resource from {0}', url)
  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      logger.error(
        logName,
        'Failed to fetch {0} with message {1}',
        url,
        message,
      ),
    )
  }

  if (!response.ok) {
    throw new Error(
      logger.error(
        logName,
        'Failed to fetch resource {0} with response {1}',
        url,
        response,
      ),
    )
  }

  let json: unknown
  try {
    json = await response.json()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      logger.error(
        logName,
        'Invalid JSON response: {0} for resource {1}',
        message,
        url,
      ),
    )
  }

  const parseResult = schema.safeParse(json)
  if (!parseResult.success) {
    throw new Error(
      logger.error(
        logName,
        'Schema validation failed for resource {0} with error {1}',
        url,
        parseResult.error.message,
      ),
    )
  }

  logger.debug(logName, 'Resulting object: {0}', parseResult.data)

  return parseResult.data
}
