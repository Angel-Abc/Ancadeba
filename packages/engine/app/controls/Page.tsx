import { useService } from '@ioc/IocProvider'
import { Screen } from './screen/Screen'
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
    if (gameDataProvider.context.currentPageId !== pageId || !gameDataProvider.game.loadedPages[pageId]) {
        console.warn(`Page ${pageId} is not loaded or is not current. Rendering fallback.`);
        return (<div>Loading...</div>);
    }
    const pageData = gameDataProvider.game.loadedPages[pageId]

    return (
        <Screen screen={pageData.screen} />
    )
}
