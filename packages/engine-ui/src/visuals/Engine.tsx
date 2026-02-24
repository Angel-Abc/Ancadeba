import {
  IEngineLanguageChangedPayload,
  IUIReadySignal,
  MESSAGE_ENGINE_LANGUAGE_CHANGED,
  uiReadySignalToken,
} from '@ancadeba/engine'
import { useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import { useEffect, useState } from 'react'
import { Surface } from './Surface'

export function Engine(): React.JSX.Element {
  const uiSignalReady = useService<IUIReadySignal>(uiReadySignalToken)
  const messageBus = useService<IMessageBus>(messageBusToken)
  const [language, setLanguage] = useState<string | null>(null)

  useEffect(() => {
    // signal that the UI is ready
    uiSignalReady.signalReady()
  }, [uiSignalReady])

  useEffect(() => {
    return messageBus.subscribe(MESSAGE_ENGINE_LANGUAGE_CHANGED, (payload) => {
      setLanguage((payload as IEngineLanguageChangedPayload).languageId)
    })
  }, [messageBus])

  return <Surface key={language} />
}
