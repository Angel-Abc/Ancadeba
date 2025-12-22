export const UI_MESSAGES = {
  UI_INITIALIZED: 'UI/UI_INITIALIZED',
} as const

export type UIMessage = (typeof UI_MESSAGES)[keyof typeof UI_MESSAGES]

export type UIMessagePayloads = {
  [UI_MESSAGES.UI_INITIALIZED]: undefined
}
