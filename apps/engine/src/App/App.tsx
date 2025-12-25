import { Scene } from './Components/Scene'

export interface AppProps {
  isStarted: boolean
}

export function App({ isStarted }: AppProps) {
  if (!isStarted) return <div>loading</div>

  return <Scene />
}
