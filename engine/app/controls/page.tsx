import { useService } from '@app/providers/iocProvider'
import { gameDataProviderToken, IGameDataProvider } from '../../providers/gameDataProvider'
import { Screen } from './screen/screen'

interface PageProps {
    pageId: string
}

export const Page: React.FC<PageProps> = ({ pageId }): React.JSX.Element => {
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    if (gameDataProvider.Context.currentPageId !== pageId || !gameDataProvider.Game.loadedPages[pageId]) return (<></>)
    const pageData = gameDataProvider.Game.loadedPages[pageId]

    return (
        <Screen screen={pageData.screen} />
    )
}
