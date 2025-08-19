import { Screen as ScreenData } from '@loader/data/page'
import { Grid } from './grid'
import { loggerToken, type ILogger } from '@utils/logger'
import { useService } from '@ioc/iocProvider'

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
    const logger = useService<ILogger>(loggerToken)
    switch (screen.type) {
        case 'grid':
            return (
                <Grid screen={screen} />
            )
        default:
            logger.warn(logName, 'Unsupported screen type: {0}', screen.type)
            return null
    }
}
