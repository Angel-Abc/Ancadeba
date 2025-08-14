import { useEffect, useState } from 'react'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { Page } from './controls/page'
import { useService } from './iocProvider'
import { PAGE_SWITCHED } from '@messages/system'

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
