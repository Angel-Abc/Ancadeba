import { createContext, useContext, useMemo, PropsWithChildren } from 'react'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'
import { fatalError } from '@utils/logMessage'

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
 * @returns The resolved service instance.
 * @throws via {@link fatalError} when `IocProvider` is missing from the tree.
 */
export const useService = <T,>(t: Token<T>): T => {
  const c = useContext(IocContext)
  if (!c) fatalError(logName, 'IocProvider is missing in the tree')
  return useMemo(() => c.resolve(t), [c, t])
}
