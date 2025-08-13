import { useEffect, useState } from 'react'
import { useService } from './providers/iocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { PAGE_SWITCHED } from '../messages/system'
import { Page } from './controls/page'

export const App: React.FC = (): React.JSX.Element => {
  const messageBus = useService<IMessageBus>(messageBusToken)
  const [pageId, setPageId] = useState<string | null>(null)

  useEffect(() => {
    const cleanupFn = messageBus.registerMessageListener(
      PAGE_SWITCHED,
      message => setPageId(message.payload as string)
    )
    return cleanupFn
  }, [messageBus])

  return (
    <>
      {pageId && (
        <Page pageId={pageId} />
      )}
    </>
  )
}
