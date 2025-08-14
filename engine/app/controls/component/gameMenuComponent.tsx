import { GameMenuComponent as GameMenuComponentData } from '@loader/data/component'
import { Button } from '@loader/data/button'
import { logDebug } from '@utils/logMessage'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { useService } from '@app/iocProvider'

interface GameMenuComponentProps {
    component: GameMenuComponentData
}

export const GameMenuComponent: React.FC<GameMenuComponentProps> = ({ component }): React.JSX.Element => {
    const translationService = useService<ITranslationService>(translationServiceToken)

    const onButtonClick = (button: Button) => {
        logDebug('GameMenuComponent', 'button click: {0}', button.action)
    }

    return (
        <div className='game-menu'>
            {component.buttons.map(button => (
                <button type='button' key={button.label} onClick={() => onButtonClick(button)}>
                    {translationService.translate(button.label)}
                </button>
            ))}
        </div>
    )
}
