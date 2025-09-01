import { STATE_CHANGED } from '@editor/messages/editor'
import { editorModelToken, EditorState, IEditorModel } from '@editor/model/EditorModel'
import { useService } from '@ioc/IocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'

export const App: React.FC = (): React.JSX.Element => {
  const editorModel = useService<IEditorModel>(editorModelToken)
  const messageBus = useService<IMessageBus>(messageBusToken)
  const [editorState, setEditorState] = useState<EditorState>(editorModel.state)

  useEffect(() => {
    return messageBus.registerMessageListener(
      STATE_CHANGED,
      message => setEditorState(message.payload as EditorState)
    )
  }, [messageBus])

  switch (editorState) {
    case EditorState.init:
      return (<>starting ...</>)
    case EditorState.loading:
      return (<>loading ...</>)
    default: {
      return (
        <>Unknown editor state: {editorModel.state}</>
      )
    }
  }
}
