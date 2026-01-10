import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'

export interface ICssFileStorage {
  addCssFileName(fileName: string): void
  getCssFileNames(): string[]
}

export interface ILanguageFileStorage {
  getLanguageFileNames(language: string): string[]
  setLanguageFileNames(language: string, fileNames: string[]): void
}

const logName = 'engine/resourceData/AssetFileStorage'
export const cssFileStorageToken = token<ICssFileStorage>(
  'engine/resourceData/cssFileStorage'
)
export const languageFileStorageToken = token<ILanguageFileStorage>(
  'engine/resourceData/languageFileStorage'
)
export const assetFileStorageDependencies: Token<unknown>[] = [loggerToken]

export class AssetFileStorage implements ICssFileStorage, ILanguageFileStorage {
  private cssFileNames: string[] = []
  private languageFiles: Map<string, string[]> = new Map()

  constructor(private readonly logger: ILogger) {}

  addCssFileName(fileName: string): void {
    this.cssFileNames.push(fileName)
  }

  getCssFileNames(): string[] {
    return this.cssFileNames
  }

  getLanguageFileNames(language: string): string[] {
    if (!this.languageFiles.has(language)) {
      this.logger.fatal(
        logName,
        'No language files for language: {0}',
        language
      )
    }
    return this.languageFiles.get(language)!
  }

  setLanguageFileNames(language: string, fileNames: string[]): void {
    this.languageFiles.set(language, fileNames)
  }
}
