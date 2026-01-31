import type React from 'react'
import { useDataSource } from '../context/DataSourceContext'

/**
 * Props for the ProgressBarWidget.
 */
interface ProgressBarWidgetProps {
  /**
   * The data source key to bind to (e.g., 'boot:progress').
   * Expected data shape: { message: string, progress: number }
   */
  dataSource: string
}

/**
 * Progress bar widget that displays a loading bar and message.
 * Consumes data from the data source context.
 */
export function ProgressBarWidget({
  dataSource,
}: ProgressBarWidgetProps): React.JSX.Element {
  const data = useDataSource(dataSource) as {
    message: string
    progress: number
  }

  return (
    <>
      <div
        style={{
          width: '400px',
          height: '4px',
          backgroundColor: '#333',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${data.progress * 100}%`,
            height: '100%',
            backgroundColor: '#4a9eff',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <p style={{ marginTop: '1rem', color: '#888' }}>{data.message}</p>
    </>
  )
}
