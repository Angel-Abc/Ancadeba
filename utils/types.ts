export type CleanUp = () => void

export type Message = {
    message: string
    payload: null | number | string | Record<string, unknown>
}

export const LogLevel = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3
} as const
// eslint-disable-next-line no-redeclare
export type LogLevel = typeof LogLevel[keyof typeof LogLevel]
