import { Token, token } from '@ioc/token'
import { ActiveInput, gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { create2DArray } from '@utils/array'

export type MatrixInputItem = {
    enabled: boolean
    label: string
    description: string
    virtualInput: string
    character: string
}

export const nullMatrixInputItem: MatrixInputItem = {
    enabled: false,
    label: '',
    description: '',
    virtualInput: '',
    character: ''
}

export interface IInputMatrxBuilder {
    build(width: number, height: number): MatrixInputItem[][]
}

const logName = 'InputMatrixBuilder'
export const inputMatrixBuilderToken = token<IInputMatrxBuilder>(logName)
export const inputMatrixBuilderDependencies: Token<unknown>[] = [
    gameDataProviderToken,
    translationServiceToken
]
export class InputMatrixBuilder implements IInputMatrxBuilder {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private translationService: ITranslationService
    ) { }

    public build(width: number, height: number): MatrixInputItem[][] {
        const inputs: ActiveInput[] = Array.from(this.gameDataProvider.Game.activeInputs.values()).filter(i => i.visible)
        const matrix: MatrixInputItem[][] = create2DArray<MatrixInputItem>(height, width, nullMatrixInputItem)
        const preferredIndex = new Map<string, ActiveInput>()
        const itemsToProcess: ActiveInput[] = []

        for (const item of inputs) {
            const { preferredRow, preferredCol } = item.input
            if (
                preferredRow !== undefined &&
                preferredCol !== undefined &&
                preferredRow >= 0 && preferredRow < height &&
                preferredCol >= 0 && preferredCol < width
            ) {
                const key = `${preferredCol},${preferredRow}`
                const existing = preferredIndex.get(key)
                if (existing) itemsToProcess.push(existing)
                preferredIndex.set(key, item)
            } else {
                itemsToProcess.push(item)
            }
        }

        let fallbackIndex = 0
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const key = `${x},${y}`
                const indexedItem = preferredIndex.get(key)
                if (indexedItem) {
                    matrix[y][x] = this.getMatrixInputItem(indexedItem)
                } else if (fallbackIndex < itemsToProcess.length) {
                    matrix[y][x] = this.getMatrixInputItem(itemsToProcess[fallbackIndex++])
                } else {
                    matrix[y][x] = nullMatrixInputItem
                }
            }
        }

        return matrix
    }

    private getMatrixInputItem(inputItem: ActiveInput): MatrixInputItem {
        return {
            enabled: inputItem.enabled,
            label: this.translationService.translate(inputItem.input.label),
            description: this.translationService.translate(inputItem.input.description),
            virtualInput: inputItem.input.virtualInput,
            character: this.gameDataProvider.Game.loadedVirtualInputsByInput.get(inputItem.input.virtualInput)?.label ?? ''
        }
    }

}
