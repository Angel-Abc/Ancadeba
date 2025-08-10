export const LogLevel = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3
} as const
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
