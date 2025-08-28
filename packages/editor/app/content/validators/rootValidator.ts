import { Token, token } from '@ioc/token'

export interface IRootValidator {
    validateTitle(title: string): boolean
    validateDescription(description: string): boolean
    validateVersion(version: string): boolean
}

const logName = 'RootValidator'
export const rootValidatorToken = token<IRootValidator>(logName)
export const rootValidatorDependencies: Token<unknown>[] = [

]
export class RootValidator implements IRootValidator {
    constructor(

    ){}

    public validateDescription(description: string): boolean {
        return description !== null && description !== undefined && description !== ''
    }

    public validateTitle(title: string): boolean {
        return title !== null && title !== undefined && title !== ''
    }

    public validateVersion(version: string): boolean {
        return version !== null && version !== undefined && version !== ''        
    }
}
