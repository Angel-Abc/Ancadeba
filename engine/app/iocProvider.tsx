import { createContext, useContext, useMemo, PropsWithChildren } from 'react'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'
import { fatalError } from '@utils/logMessage'

const logName = 'IocProvider'

export const IocContext = createContext<Container | null>(null)

export const IocProvider = ({ container, children }: PropsWithChildren<{ container: Container }>) => {
  return <IocContext.Provider value={container}>{children}</IocContext.Provider>
}

export const useService = <T,>(t: Token<T>): T => {
  const c = useContext(IocContext)
  if (!c) fatalError(logName, 'IocProvider is missing in the tree')
  return useMemo(() => c.resolve(t), [c, t])
}
