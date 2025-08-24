import { useService } from '@ioc/iocProvider'
import { ContentBar } from './contentBar'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { ComponentType, useEffect, useState } from 'react'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'
import { BaseItemType } from '@editor/types/gameItems'
import { RootContent } from './content/rootContent'
import { BaseContent, BaseContentProps } from './content/baseContent'
import { PagesContent } from './content/pagesContent'
import { SetEditorContentPayload } from '@editor/messages/types'

const contentPages: Record<BaseItemType, ComponentType<BaseContentProps>> = {
    'root': RootContent,
    'pages': PagesContent,
    'page': BaseContent,
    'languages': BaseContent,
    'language': BaseContent,
    'translations': BaseContent,
}

export const Content: React.FC = (): React.JSX.Element => {
    const [contentInfo, setContentInfo] = useState<SetEditorContentPayload | null>(null)
    const messageBus = useService<IMessageBus>(messageBusToken)
    useEffect(() => {
        return messageBus.registerMessageListener(
            SET_EDITOR_CONTENT,
            message => {
                setContentInfo(message.payload as SetEditorContentPayload)
            }
        )
    }, [messageBus, setContentInfo])

    if (contentInfo === null || contentInfo.type === null) return (<></>)

    const MyContent = contentPages[contentInfo.type]
    return (
        <section className='main'>
            <ContentBar />
            <main className='content'>
                <MyContent id={contentInfo.id} label={contentInfo.label} />
            </main>
        </section>
    )
}
