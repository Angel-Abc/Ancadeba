import { Screen as ScreenData } from '@loader/data/page'
import { Grid } from './grid'

interface ScreenProps {
    screen: ScreenData
}

export const Screen: React.FC<ScreenProps> = ({ screen }): React.JSX.Element => {
    switch (screen.type) {
        case 'grid':
            return (
                <Grid screen={screen} />
            )
    }
}
