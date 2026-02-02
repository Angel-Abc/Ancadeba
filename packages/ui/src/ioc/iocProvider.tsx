import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react'
import {
  loggerToken,
  type IContainer,
  type ILogger,
  type Token,
} from '@ancadeba/utils'

const logName = 'ui/ioc/IocProvider'

export const IocContext = createContext<IContainer | null>(null)

export const IocProvider = ({
  container,
  children,
}: PropsWithChildren<{ container: IContainer }>): React.JSX.Element => {
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
