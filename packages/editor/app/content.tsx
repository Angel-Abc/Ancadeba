import { useService } from '@ioc/iocProvider'
import { ContentBar } from './contentBar'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'

interface ContentInfo {
    label: string
    level: number
}

export const Content: React.FC = (): React.JSX.Element => {
    const [contentInfo, setContentInfo] = useState<ContentInfo | null>(null)
    const messageBus = useService<IMessageBus>(messageBusToken)
    useEffect(() => {
        return messageBus.registerMessageListener(
            SET_EDITOR_CONTENT,
            message => {
                setContentInfo(message.payload as ContentInfo)
            }
        )
    }, [messageBus, setContentInfo])
    return (
        <section className='main'>
            <ContentBar />
            <main className='content'>
                {contentInfo?.label}
            </main>
        </section>
    )
}
