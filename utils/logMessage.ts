export const LogLevel = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3
} as const
// eslint-disable-next-line no-redeclare
export type LogLevel = typeof LogLevel[keyof typeof LogLevel]

const env = (
    globalThis.process?.env ??
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env ??
    {}
) as Record<string, string | undefined>
const currentLevelName = (env.LOG_LEVEL ?? env.VITE_LOG_LEVEL ?? 'info').toLowerCase()
const currentLevel: LogLevel = (LogLevel as Record<string, LogLevel>)[currentLevelName] ?? LogLevel.info

const categoriesEnv = env.LOG_DEBUG ?? env.VITE_LOG_DEBUG ?? ''
const enabledCategories = new Set(
    categoriesEnv
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
)

export function isLevelEnabled(level: LogLevel): boolean {
    return level >= currentLevel
}

export function isCategoryEnabled(category?: string): boolean {
    return enabledCategories.size === 0 || category === undefined || enabledCategories.has(category)
}

function formatMessageForConsole(
    message: string,
    ...args: unknown[]
): { formattedMessage: string; extraArgs: unknown[] } {
    // This array will hold any arguments that should be passed separately to the console.
    const extraArgs: unknown[] = []

    // Replace placeholders in the message with either their string value or with a console format specifier.
    // We use a regex to find all placeholders like {0}, {1}, etc.
    const formattedMessage = message.replace(/\{(\d+)\}/g, (_: string, indexStr: string) => {
        const index = parseInt(indexStr, 10)
        const arg: unknown = args[index]

        // If the argument is an object (or not a primitive), use '%o' as the placeholder
        // and push the object into extraArgs to be passed to the console.
        if (typeof arg === 'object' && arg !== null) {
            extraArgs.push(arg)
            return '%o'
        }

        // Otherwise, simply convert the argument to a string.
        return String(arg)
    })

    return { formattedMessage, extraArgs }
}

export function logMessage(
    logLevel: LogLevel,
    category: string | undefined,
    message: string,
    ...args: unknown[]
): string {
    const { formattedMessage, extraArgs } = formatMessageForConsole(message, ...args)
    if (!isLevelEnabled(logLevel)) return formattedMessage
    if (logLevel === LogLevel.debug && !isCategoryEnabled(category)) return formattedMessage

    const finalMessage = category ? `[${category}] ${formattedMessage}` : formattedMessage

    switch (logLevel) {
        case LogLevel.debug:
            console.debug('\x1B[37m' + finalMessage, ...extraArgs)
            break
        case LogLevel.info:
            console.info('\x1B[30m' + finalMessage, ...extraArgs)
            break
        case LogLevel.warning:
            console.warn('\x1B[1m\x1B[33m' + finalMessage, ...extraArgs)
            break
        case LogLevel.error:
            console.error('\x1B[1m\x1B[31m' + finalMessage, ...extraArgs)
            break
        default:
            console.log(finalMessage, ...extraArgs)
            break
    }

    return finalMessage
}

function createLogger(level: LogLevel) {
    return (categoryOrMessage: string, messageOrArg?: unknown, ...args: unknown[]): string => {
        if (typeof messageOrArg === 'string') {
            return logMessage(level, categoryOrMessage, messageOrArg, ...args)
        }
        const params = messageOrArg === undefined ? args : [messageOrArg, ...args]
        return logMessage(level, undefined, categoryOrMessage, ...params)
    }
}

export const logDebug = createLogger(LogLevel.debug)
export const logInfo = createLogger(LogLevel.info)
export const logWarning = createLogger(LogLevel.warning)
export function fatalError(categoryOrMessage: string, messageOrArg?: unknown, ...args: unknown[]): never {
    if (typeof messageOrArg === 'string') {
        throw new Error(logMessage(LogLevel.error, categoryOrMessage, messageOrArg, ...args))
    }
    const params = messageOrArg === undefined ? args : [messageOrArg, ...args]
    throw new Error(logMessage(LogLevel.error, undefined, categoryOrMessage, ...params))
}
