import { useService } from '@ioc/IocProvider'
import { ContentBar } from './ContentBar'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { ComponentType, useEffect, useState } from 'react'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'
import { BaseItemType } from '@editor/types/gameItems'
import { RootContent } from './content/RootContent'
import { BaseContentProps } from './content/BaseContent'
import { PagesContent } from './content/PagesContent'
import { SetEditorContentPayload } from '@editor/messages/types'
import { LanguagesContent } from './content/LanguagesContent'
import { LanguageContent } from './content/LanguageContent'
import { TranslationsContent } from './content/TranslationsContent'
import { PageContent } from './content/PageContent'

const contentPages: Record<BaseItemType, ComponentType<BaseContentProps>> = {
    'root': RootContent,
    'pages': PagesContent,
    'page': PageContent,
    'languages': LanguagesContent,
    'language': LanguageContent,
    'translations': TranslationsContent,
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
    }, [messageBus])

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
