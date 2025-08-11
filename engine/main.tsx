import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@app/App'
import { ContainerBuilder, IContainerBuilder } from '@builders/containerBuilder'
import { gameEngineToken, IGameEngine } from '@engine/gameEngine'
import { IocProvider } from '@app/providers/iocProvider'
import { Container } from '@ioc/container'
import { turnSchedulerToken } from '@engine/turnScheduler'
import './styling/reset.css'
import './styling/variables.css'
import './styling/engine.css'

const containerBuilder: IContainerBuilder = new ContainerBuilder(
  container => {
    const scheduler = container.resolve(turnSchedulerToken)
    return scheduler.onQueueEmpty.bind(scheduler)
  },
)
const container: Container = containerBuilder.build()

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <IocProvider container={container}>
        <App />
      </IocProvider>
    </React.StrictMode>,
  )
}

(async () => {
  try {
    const engine = container.resolve<IGameEngine>(gameEngineToken)
    await engine.start()
  } catch (err) {
    console.error('Engine failed to start', err)
  }
})()
