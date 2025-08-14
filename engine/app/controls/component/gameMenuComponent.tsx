import { GameMenuComponent as GameMenuComponentData } from '@loader/data/component'
import { Button } from '@loader/data/button'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { useService } from '@app/iocProvider'
import { actionExecuterToken, IActionExecuter } from '@actions/actionExecuter'

interface GameMenuComponentProps {
    component: GameMenuComponentData
}

export const GameMenuComponent: React.FC<GameMenuComponentProps> = ({ component }): React.JSX.Element => {
    const translationService = useService<ITranslationService>(translationServiceToken)
    const actionExecuter = useService<IActionExecuter>(actionExecuterToken)

    const onButtonClick = (button: Button) => {
        actionExecuter.execute(button.action)
    }

    return (
        <div className='game-menu'>
            {component.buttons.map(button => (
                <button type='button' key={button.id.toString()} onClick={() => onButtonClick(button)}>
                    {translationService.translate(button.label)}
                </button>
            ))}
        </div>
    )
}
