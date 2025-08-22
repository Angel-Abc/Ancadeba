import { GameItem } from '@editor/providers/gameDefinitionProvider'

export interface SetContentPayload {
    label: GameItem['type']
    level: number
    dataId: number | null
}

