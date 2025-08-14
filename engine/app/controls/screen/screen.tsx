import { Screen as ScreenData } from '@loader/data/page'
import { Grid } from './grid'
import { logWarning } from '@utils/logMessage'

interface ScreenProps {
    screen: ScreenData
}

const logName = 'Screen'

/**
 * Selects a renderer for the provided screen data.
 * Logs a warning for unsupported screen types.
 * @param screen - Screen data to render.
 */
export const Screen: React.FC<ScreenProps> = ({ screen }): React.JSX.Element | null => {
    switch (screen.type) {
        case 'grid':
            return (
                <Grid screen={screen} />
            )
        default:
            logWarning(logName, 'Unsupported screen type: {0}', screen.type)
            return null
    }
}
