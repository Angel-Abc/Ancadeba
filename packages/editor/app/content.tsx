import { useService } from '@ioc/iocProvider'
import { ContentBar } from './contentBar'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { ComponentType, useEffect, useState } from 'react'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'
import { BaseItemType } from '@editor/types/gameItems'
import { RootContent } from './content/rootContent'
import { GameItemTreeNode } from '@editor/providers/editTreeProvider'
import { BaseContent, BaseContentProps } from './content/baseContent'
import { PagesContent } from './content/pagesContent'

const contentPages: Record<BaseItemType, ComponentType<BaseContentProps>> = {
    'root': RootContent,
    'pages': PagesContent,
    'page': BaseContent,
    'languages': BaseContent,
    'language': BaseContent,
    'translations': BaseContent,
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
