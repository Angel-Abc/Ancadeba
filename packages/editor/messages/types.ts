import { BaseItemType } from '@editor/types/gameItems'

export interface SetEditorContentPayload {
    id: number
    label: string
    type: BaseItemType | null
}
