import React, { createContext, useContext, type ReactNode } from 'react'

/**
 * Data sources available to widgets through the data source context.
 * Each data source is keyed by its identifier (e.g., 'boot:progress').
 */
export type DataSources = Record<string, unknown>

/**
 * Context value providing data sources to widgets.
 */
interface DataSourceContextValue {
  dataSources: DataSources
}

const DataSourceContext = createContext<DataSourceContextValue | null>(null)

/**
 * Hook to access data sources within widgets.
 * Throws if used outside of a DataSourceProvider.
 */
export function useDataSource(sourceKey: string): unknown {
  const context = useContext(DataSourceContext)
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider')
  }

  return context.dataSources[sourceKey]
}

/**
 * Hook to access all data sources.
 * Throws if used outside of a DataSourceProvider.
 */
export function useDataSources(): DataSources {
  const context = useContext(DataSourceContext)
  if (!context) {
    throw new Error('useDataSources must be used within a DataSourceProvider')
  }

  return context.dataSources
}

/**
 * Provider component that supplies data sources to child widgets.
 */
interface DataSourceProviderProps {
  dataSources: DataSources
  children: ReactNode
}

export function DataSourceProvider({
  dataSources,
  children,
}: DataSourceProviderProps): React.JSX.Element {
  return (
    <DataSourceContext.Provider value={{ dataSources }}>
      {children}
    </DataSourceContext.Provider>
  )
}
