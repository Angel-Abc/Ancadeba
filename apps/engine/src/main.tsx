import React from 'react'
import { createRoot } from 'react-dom/client'
import { ConsoleLogger } from '@ancadeba/utils'
import { IocProvider } from '@ancadeba/ui'
import { StartupContainer } from './App/StartupContainer'
import { gameEngineToken, IGameEngine } from './core/gameEngine'
import { ContainerBuilder } from './builders/containerBuilder'

const resourcesDataPath = import.meta.env.DEV
  ? `/@fs/${import.meta.env.VITE_GAME_RESOURCES_DIR}`
  : '/resources'

const logName = 'main'
const logger = new ConsoleLogger()
const containerBuilder = new ContainerBuilder(logger, resourcesDataPath)
export const container = containerBuilder.build()

const rootContainer = document.getElementById('root')

if (!rootContainer) {
  throw new Error('Root container not found')
}

const root = createRoot(rootContainer)

const startUp = async () => {
  try {
    const engine = container.resolve<IGameEngine>(gameEngineToken)
    await engine.start()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.fatal(logName, 'Failed to start the engine: {0}', message)
  }
}

const Root = () => {
  React.useEffect(() => {
    startUp()
  }, [])

  return (
    <React.StrictMode>
      <IocProvider container={container}>
        <StartupContainer />
      </IocProvider>
    </React.StrictMode>
  )
}

root.render(<Root />)
