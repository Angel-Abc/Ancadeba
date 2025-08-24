import React from 'react'
import ReactDOM from 'react-dom/client'
import { gameEngineToken, IGameEngine } from '@core/gameEngine'
import { Container } from '@ioc/container'
import { turnSchedulerToken } from '@core/turnScheduler'
import './styling/reset.css'
import './styling/variables.css'
import './styling/engine.css'
import { App } from '@app/App'
import { IocProvider } from '@ioc/IocProvider'
import { ConsoleLogger } from '@utils/logger'
import { ContainerBuilder, IContainerBuilder } from '@builders/containerBuilder'
import { ActionHandlerRegistrar, ConditionResolverRegistrar, InputsProviderRegistrar } from '@builders/containerBuilders/registrars'
import { postMessageActionToken } from '@actions/postMessageAction'
import { scriptActionToken } from '@actions/scriptAction'
import { gotoDialogToken } from '@actions/gotoDialog'
import { endDialogToken } from '@actions/endDialog'
import { pageInputsToken } from '@inputs/pageInputs'
import { dialogInputsToken } from '@inputs/dialogInputs'
import { scriptConditionToken } from '@conditions/scriptCondition'

const dataPath = import.meta.env.VITE_DATA_PATH ?? '/data'
const containerBuilder: IContainerBuilder = new ContainerBuilder(
  new ConsoleLogger(),
  dataPath,
  container => () => {
    const scheduler = container.resolve(turnSchedulerToken)
    return scheduler.onQueueEmpty()
  },
  [
    (r => r.registerActionHandler('post-message', postMessageActionToken)) as ActionHandlerRegistrar,
    (r => r.registerActionHandler('script', scriptActionToken)) as ActionHandlerRegistrar,
    (r => r.registerActionHandler('goto', gotoDialogToken)) as ActionHandlerRegistrar,
    (r => r.registerActionHandler('end-dialog', endDialogToken)) as ActionHandlerRegistrar,
  ],
  [
    (r => r.registerInputsProvider(pageInputsToken)) as InputsProviderRegistrar,
    (r => r.registerInputsProvider(dialogInputsToken)) as InputsProviderRegistrar,
  ],
  [
    (r => r.registerConditionResolver('script', scriptConditionToken)) as ConditionResolverRegistrar,
  ]
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
