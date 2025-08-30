import { Token, token } from '@ioc/token'

export interface IPagesValidator {
    isValidKey(key: string): boolean
    isDuplicateKey(key: string, existingKeys: string[]): boolean
}

const logName = 'PagesValidator'
export const pagesValidatorToken = token<IPagesValidator>(logName)
export const pagesValidatorDependencies: Token<unknown>[] = []
export class PagesValidator implements IPagesValidator {
    constructor(
        
    ) { }

    public isValidKey(key: string): boolean {
        if (key === null || key === undefined) return false
        const trimmed = key.trim()
        if (trimmed.length === 0) return false
        return /^[a-z0-9-]+$/.test(trimmed)
    }

    public isDuplicateKey(key: string, existingKeys: string[]): boolean {
        const normalized = (key ?? '').trim().toLowerCase()
        return existingKeys.some(k => k.toLowerCase() === normalized)
    }
}

