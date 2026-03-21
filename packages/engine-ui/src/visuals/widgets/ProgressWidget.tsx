import type { Widget } from '@ancadeba/content'
import type { WidgetProps } from '../../registries/types'
import { useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import {
  IEngineProgressPayload,
  ITranslationProvider,
  MESSAGE_ENGINE_PROGRESS,
  translationProviderToken,
} from '@ancadeba/engine'
import { useEffect, useState } from 'react'

type ProgressWidgetData = Extract<Widget, { type: 'progress' }>

export function ProgressWidget({
  widget,
}: WidgetProps<ProgressWidgetData>): React.JSX.Element {
  const messageBus = useService<IMessageBus>(messageBusToken)
  const translationProvider = useService<ITranslationProvider>(
    translationProviderToken,
  )
  const [lastProgress, setLastProgress] = useState<number>(0)
  const [lastMessage, setLastMessage] = useState<string>('')

  useEffect(() => {
    return messageBus.subscribe(MESSAGE_ENGINE_PROGRESS, (payload) => {
      const { message, progress } = payload as IEngineProgressPayload
      setLastProgress(progress)
      setLastMessage(translationProvider.getTranslation(message))
    })
  }, [messageBus, translationProvider])

  return (
    <div className="progress-widget">
      {widget.showPercentage && <>{lastProgress} - </>}
      {lastMessage}
    </div>
  )
}
