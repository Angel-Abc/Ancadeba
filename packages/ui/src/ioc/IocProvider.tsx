import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from 'react'
import { ILogger, type IContainer, Token, loggerToken } from '@ancadeba/utils'

const logName = 'ioc/IocProvider'

export const IocContext = createContext<IContainer | null>(null)

export const IocProvider = ({
  container,
  children,
}: PropsWithChildren<{ container: IContainer }>) => {
  return <IocContext.Provider value={container}>{children}</IocContext.Provider>
}

export const useService = <T,>(t: Token<T>, logger?: ILogger): T => {
  const c = useContext(IocContext)
  const log = logger ?? c?.resolve<ILogger>(loggerToken)
  if (!c) {
    const err = 'IocProvider is missing in the tree'
    if (log) log.error(logName, err)
    throw new Error(err)
  }
  if (!log) {
    throw new Error('Logger service is missing')
  }
  return useMemo(() => c.resolve(t), [c, t])
}
