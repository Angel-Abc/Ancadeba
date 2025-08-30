import { Token, token } from '@ioc/token'

export interface ILanguagesValidator {
    isValidCode(code: string): boolean
    isDuplicate(code: string, existing: string[]): boolean
}

const logName = 'LanguagesValidator'
export const languagesValidatorToken = token<ILanguagesValidator>(logName)
export const languagesValidatorDependencies: Token<unknown>[] = []
export class LanguagesValidator implements ILanguagesValidator {
    constructor(
        
    ) { }

    public isValidCode(code: string): boolean {
        if (code === null || code === undefined) return false
        const trimmed = code.trim()
        if (trimmed.length < 2) return false
        return /^[a-z]{2,}$/.test(trimmed)
    }

    public isDuplicate(code: string, existing: string[]): boolean {
        const normalized = (code ?? '').trim().toLowerCase()
        return existing.some(l => l.toLowerCase() === normalized)
    }
}

