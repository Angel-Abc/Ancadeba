import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { ContainerBuilder } from './builders/containerBuilder'
import { ConsoleLogger } from '@angelabc/utils/utils'
import { Container, IocProvider } from '@angelabc/utils/ioc'
import { editorApplicationToken, IEditorApplication } from './core/editorApplication'

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
    const editorApp = container.resolve<IEditorApplication>(editorApplicationToken)
    await editorApp.start()
  } catch (err) {
    console.error('Editor UI failed to start', err)
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
