export const LogLevel = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
} as const
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]
