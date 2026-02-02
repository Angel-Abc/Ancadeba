import { LogLevel } from './logLevel'

// NOTE: in the future get log level from the config
export const currentLevel = LogLevel.debug

// NOTE: in the future get enabled categories from the config
export const enabledCategories = new Set<string>()
