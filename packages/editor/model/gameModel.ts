import { Token, token } from '@ioc/token'
import { loggerToken, type ILogger } from '@utils/logger'
import { messageBusToken, type IMessageBus } from '@utils/messageBus'
import { dataUrlToken } from '@editor/builders/containerBuilders/staticDataTokens'
import { loadJsonResource } from '@utils/loadJsonResource'
import { gameSchema } from '@loader/schema/game'
import { mapSchemaToEditor } from '@editor/model/mappers/gameMapper'
import type { CleanUp } from '@utils/types'
import type { EditorGame, GameModelState } from '@editor/model/types'

const logName = 'GameModel'

export interface IGameModel {
  initialize(): Promise<void>
  get(): GameModelState
  subscribe(listener: () => void): CleanUp
  setTitle(title: string): void
}

export const gameModelToken = token<IGameModel>(logName)
export const gameModelDependencies: Token<unknown>[] = [loggerToken, messageBusToken, dataUrlToken]

export class GameModel implements IGameModel {
  private state: GameModelState = { loading: false, error: null, dirty: false, game: null }
  private listeners = new Set<() => void>()

  constructor(
    private logger: ILogger,
    private bus: IMessageBus,
    private dataUrl: string
  ) {}

  public async initialize(): Promise<void> {
    if (this.state.loading || this.state.game) return
    this.setState({ ...this.state, loading: true, error: null })
    try {
      const url = `${this.dataUrl}/index.json`
      const schemaGame = await loadJsonResource(url, gameSchema, this.logger)
      const editorGame: EditorGame = mapSchemaToEditor(schemaGame, this.dataUrl)
      this.setState({ loading: false, error: null, dirty: false, game: editorGame })
      this.bus.postMessage({ message: 'MODEL/INITIALIZED', payload: null })
      this.logger.info(logName, 'Game loaded from {0}', url)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.setState({ ...this.state, loading: false, error: message })
      this.logger.error(logName, 'Failed to initialize: {0}', message)
    }
  }

  public get(): GameModelState { return this.state }

  public subscribe(listener: () => void): CleanUp {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  public setTitle(title: string): void {
    if (!this.state.game) return
    const next: GameModelState = {
      ...this.state,
      dirty: true,
      game: { ...this.state.game, title }
    }
    this.setState(next)
    this.bus.postMessage({ message: 'MODEL/CHANGED', payload: { field: 'title' } })
  }

  private setState(next: GameModelState): void {
    this.state = next
    this.listeners.forEach(l => {
      try { l() } catch (err) { this.logger.warn(logName, 'Listener error: {0}', err) }
    })
  }
}
