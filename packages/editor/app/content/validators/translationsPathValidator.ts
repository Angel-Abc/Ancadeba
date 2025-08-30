import { Token, token } from '@ioc/token'

export interface ITranslationsPathValidator {
    isValidPath(path: string): boolean
    isDuplicatePath(path: string, existing: string[]): boolean
}

const logName = 'TranslationsPathValidator'
export const translationsPathValidatorToken = token<ITranslationsPathValidator>(logName)
export const translationsPathValidatorDependencies: Token<unknown>[] = []
export class TranslationsPathValidator implements ITranslationsPathValidator {
    constructor(
    ) { }

    public isValidPath(path: string): boolean {
        if (path === null || path === undefined) return false
        const trimmed = path.trim()
        if (trimmed.length === 0) return false
        return /\.json$/i.test(trimmed)
    }

    public isDuplicatePath(path: string, existing: string[]): boolean {
        const normalized = (path ?? '').trim().toLowerCase()
        return existing.some(p => p.toLowerCase() === normalized)
    }
}

