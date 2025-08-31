import { useService } from '@ioc/IocProvider'
import { IGameModel, gameModelToken } from '@editor/model/gameModel'

export const useGameModel = (): IGameModel => useService(gameModelToken)

