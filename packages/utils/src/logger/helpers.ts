import { LogLevel } from './types'

// NOTE: in the future get log level from the config
const currentLevel = LogLevel.debug

// NOTE: in the future get enabled categories from the config
const enabledCategories = new Set<string>()

export function isLevelEnabled(level: LogLevel): boolean {
  return level >= currentLevel
}

export function isCategoryEnabled(category?: string): boolean {
  return (
    enabledCategories.size === 0 ||
    category === undefined ||
    enabledCategories.has(category)
  )
}
