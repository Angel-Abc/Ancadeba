export const UI_MESSAGES = {
  UI_INITIALIZED: 'UI/UI_INITIALIZED',
  VIRTUAL_KEY_PRESSED: 'ui.virtualKeyPressed',
  VIRTUAL_INPUT_PRESSED: 'ui.virtualInputPressed',
} as const

export type UIMessage = (typeof UI_MESSAGES)[keyof typeof UI_MESSAGES]

export type UIMessagePayloads = {
  [UI_MESSAGES.UI_INITIALIZED]: undefined
  [UI_MESSAGES.VIRTUAL_KEY_PRESSED]: { virtualKey: string }
  [UI_MESSAGES.VIRTUAL_INPUT_PRESSED]: {
    virtualInput: string
    label: string
  }
}
