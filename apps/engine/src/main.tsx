import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ContainerBuilder } from './builders/containerBuilder'
import { ConsoleLogger } from '@angelabc/utils/utils'
import { Container, IocProvider } from '@angelabc/utils/ioc'
import { gameEngineToken, IGameEngine } from './core/gameEngine'

const containerBuilder = new ContainerBuilder(
  new ConsoleLogger()
)
const container: Container = containerBuilder.build()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Failed to find the root element')
}

const startUp = async () => {
  try {
    const engine = container.resolve<IGameEngine>(gameEngineToken)
    await engine.start()
  } catch (err) {
    console.error('Engine failed to start', err)
  }
}

const Root = () => {
  useEffect(() => {
    startUp()
  }, [])

  return (
    <StrictMode>
      <IocProvider container={container}>
        <App />
      </IocProvider>
    </StrictMode>
  )
}

createRoot(root).render(
  <Root />
)
