import { ZodType } from 'zod'
import { ILogger } from '../logger/types'

const logName = 'utils/json/loadJsonResource'

export async function loadJsonResource<T>(
  url: string,
  schema: ZodType<T>,
  logger: ILogger
): Promise<T> {
  logger.debug(logName, 'Loading JSON resource from URL {0}', url)

  let response: Response
  try {
    response = await fetch(url, { cache: 'no-cache' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.fatal(
      logName,
      'Failed to fetch JSON resource from URL {0}: {1}',
      url,
      message
    )
  }

  let json: unknown
  try {
    json = await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.fatal(
      logName,
      'Failed to parse JSON from URL {0}: {1}',
      url,
      message
    )
  }

  const parseResult = schema.safeParse(json)
  if (!parseResult.success) {
    logger.fatal(
      logName,
      'JSON from URL {0} does not match the expected schema: {1}',
      url,
      parseResult.error.message
    )
  }

  const result = parseResult.data
  logger.debug(
    logName,
    'Successfully loaded JSON resource from URL {0} resulting in {1}',
    url,
    result
  )
  return result
}
