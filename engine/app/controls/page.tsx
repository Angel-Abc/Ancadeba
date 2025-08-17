import { useService } from '@app/iocProvider'
import { Screen } from './screen/screen'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'

interface PageProps {
    pageId: string
}

/**
 * Displays the screen for a given page.
 * @param pageId - Identifier of the page to render.
 */
export const Page: React.FC<PageProps> = ({ pageId }): React.JSX.Element => {
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    if (gameDataProvider.Context.currentPageId !== pageId || !gameDataProvider.Game.loadedPages[pageId]) {
        console.warn(`Page ${pageId} is not loaded or is not current. Rendering fallback.`);
        return (<div>Loading...</div>);
    }
    const pageData = gameDataProvider.Game.loadedPages[pageId]

    return (
        <Screen screen={pageData.screen} />
    )
}
