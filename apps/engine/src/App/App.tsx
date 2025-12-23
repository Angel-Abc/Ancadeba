export interface AppProps {
  isStarted: boolean
  title?: string
}

export function App({ isStarted, title }: AppProps) {
  if (!isStarted) return <div>loading</div>

  return <div>loaded {title}</div>
}
