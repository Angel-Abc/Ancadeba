import { useService } from '@ioc/iocProvider'
import { CSSCustomProperties } from '@app/types'
import { IInputMatrxBuilder, inputMatrixBuilderToken, MatrixInputItem } from '@builders/inputMatrixBuilder'
import { InputMatrixComponent } from '@loader/data/component'
import { FINALIZE_END_TURN_MESSAGE, VIRTUAL_INPUT } from '@messages/system'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'

export type InputMatrxProps = {
    component: InputMatrixComponent
}

export const InputMatrix: React.FC<InputMatrxProps> = ({ component }): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const inputMatrixBuilder = useService<IInputMatrxBuilder>(inputMatrixBuilderToken)
    const [inputMatrix, setInputMatrix] = useState(inputMatrixBuilder.build(component.matrixSize.width, component.matrixSize.height))

    const style: CSSCustomProperties = {
        '--ge-input-matrix-width': component.matrixSize.width.toString(),
        '--ge-input-matrix-height': component.matrixSize.height.toString()
    }

    useEffect(() => {
        return messageBus.registerMessageListener(
            FINALIZE_END_TURN_MESSAGE,
            () => {
                setInputMatrix(inputMatrixBuilder.build(component.matrixSize.width, component.matrixSize.height))
            }
        )
    }, [messageBus, inputMatrixBuilder, component.matrixSize.height, component.matrixSize.width])

    const onButtonClick = (item: MatrixInputItem): void => {
        if (!item.enabled || item.virtualInput === '') return
        messageBus.postMessage({ message: VIRTUAL_INPUT, payload: item.virtualInput })
    }

    let keyCounter = 0
    return (
        <div className='input-matrix' style={style}>
            {inputMatrix.map(row => {
                return (
                    <div key={`row_${keyCounter++}`}>
                        {row.map(item => {
                            const isEmpty = item.label === ''
                            const label = isEmpty ? '' : `${item.character} - ${item.label}`
                            return (
                                <button key={`row_${keyCounter++}`} disabled={!item.enabled || isEmpty} type="button" onClick={() => onButtonClick(item)}>
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}
