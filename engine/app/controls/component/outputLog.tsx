import { useService } from '@ioc/iocProvider'
import { OutputComponent } from '@loader/data/component'
import { FINALIZE_END_TURN_MESSAGE } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'
import { ScrollContainer } from '../scrollContainer'

export type OutputLogProps = {
    component: OutputComponent
}

function getOutputLog(gameDataProvider: IGameDataProvider, logSize: number): string {
    const lines: string[] = []
    gameDataProvider.Context.turnOutputs.slice(-logSize).forEach(turnOutput => {
        if (turnOutput.outputs.length > 0) {
            lines.push('<hr/>')
            turnOutput.outputs.forEach(output => lines.push(output))
        }
    })
    return lines.join('')
}

export const OutputLog: React.FC<OutputLogProps> = ({ component }): React.JSX.Element => {
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    const messageBus = useService<IMessageBus>(messageBusToken)
    // TODO: figure out when getOutputLog gets called
    const [outputLog, setOutputLog] = useState<string>(getOutputLog(gameDataProvider, component.logSize))

    useEffect(() => {
        return messageBus.registerMessageListener(
            FINALIZE_END_TURN_MESSAGE,
            () => setOutputLog(getOutputLog(gameDataProvider, component.logSize))
        )
    }, [messageBus, gameDataProvider])

    return (
        <ScrollContainer className='output-log' html={outputLog} />
    )
}
