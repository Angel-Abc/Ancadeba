import { useService } from '@ioc/iocProvider'
import { ContentBar } from './contentBar'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { ComponentType, useEffect, useState } from 'react'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'
import { BaseItemType } from '@editor/types/gameItems'
import { RootContent } from './content/rootContent'
import { GameItemTreeNode } from '@editor/providers/editTreeProvider'

const contentPages: Record<BaseItemType, ComponentType<unknown>> = {
    'root': RootContent as ComponentType<unknown>,
    'pages': RootContent as ComponentType<unknown>,
    'page': RootContent as ComponentType<unknown>,
    'languages': RootContent as ComponentType<unknown>,
    'language': RootContent as ComponentType<unknown>,
    'translations': RootContent as ComponentType<unknown>,
}

export const Content: React.FC = (): React.JSX.Element => {
    const [contentInfo, setContentInfo] = useState<GameItemTreeNode | null>(null)
    const messageBus = useService<IMessageBus>(messageBusToken)
    useEffect(() => {
        return messageBus.registerMessageListener(
            SET_EDITOR_CONTENT,
            message => {
                setContentInfo(message.payload as GameItemTreeNode)
            }
        )
    }, [messageBus, setContentInfo])

    if (!contentInfo?.data) return (<></>)

    const MyContent = contentPages[contentInfo.data.type as BaseItemType]
    return (
        <section className='main'>
            <ContentBar />
            <main className='content'>
                <MyContent content={contentInfo}/>
            </main>
        </section>
    )
}
