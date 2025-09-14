import { createContext, useContext, useMemo, PropsWithChildren } from 'react'
import { Container } from './container'
import type { Token } from './token'
import { loggerToken, type ILogger } from '../utils/logger'

const logName = 'IocProvider'

/**
 * React context providing access to the application's IoC container.
 */
export const IocContext = createContext<Container | null>(null)

/**
 * Supplies a {@link Container} to descendant components through {@link IocContext}.
 *
 * @param props - Props including the IoC container and optional children.
 * @param props.container - Container used to resolve services.
 * @param props.children - Elements that will have access to the container.
 * @returns The wrapped React elements.
 */
export const IocProvider = ({ container, children }: PropsWithChildren<{ container: Container }>) => {
  return <IocContext.Provider value={container}>{children}</IocContext.Provider>
}

/**
 * Resolve a service instance for the provided token.
 *
 * @param t - Token identifying the desired service.
 * @param logger - Optional logger used to report errors when the provider is missing.
 * @returns The resolved service instance.
 * @throws When `IocProvider` is missing from the tree.
 */
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
