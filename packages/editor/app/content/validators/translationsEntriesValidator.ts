import { Token, token } from '@ioc/token'

export interface ITranslationsEntriesValidator {
    isValidKey(key: string): boolean
    isDuplicateKey(key: string, existingKeys: string[]): boolean
}

const logName = 'TranslationsEntriesValidator'
export const translationsEntriesValidatorToken = token<ITranslationsEntriesValidator>(logName)
export const translationsEntriesValidatorDependencies: Token<unknown>[] = []
export class TranslationsEntriesValidator implements ITranslationsEntriesValidator {
    constructor(
    ) { }

    public isValidKey(key: string): boolean {
        if (key === null || key === undefined) return false
        const trimmed = key.trim()
        if (trimmed.length === 0) return false
        // Allow letters, numbers, underscore, dashes, dots, slashes and colons often used in keys
        return /^[\w\-./:]+$/.test(trimmed)
    }

    public isDuplicateKey(key: string, existingKeys: string[]): boolean {
        const normalized = (key ?? '').trim().toLowerCase()
        return existingKeys.some(k => k.toLowerCase() === normalized)
    }
}
