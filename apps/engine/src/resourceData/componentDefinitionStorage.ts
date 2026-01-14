import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { ComponentDefinition } from '@ancadeba/schemas'

export interface IComponentDefinitionStorage {
  addComponentDefinition(definitionId: string, data: ComponentDefinition): void
  getComponentDefinition(definitionId: string): ComponentDefinition
  hasComponentDefinition(definitionId: string): boolean
  getLoadedDefinitionIds(): string[]
}

const logName = 'engine/resourceData/ComponentDefinitionStorage'
export const componentDefinitionStorageToken =
  token<IComponentDefinitionStorage>(logName)
export const componentDefinitionStorageDependencies: Token<unknown>[] = [
  loggerToken,
]

export class ComponentDefinitionStorage implements IComponentDefinitionStorage {
  private definitions: Map<string, ComponentDefinition> = new Map()

  constructor(private readonly logger: ILogger) {}

  addComponentDefinition(
    definitionId: string,
    data: ComponentDefinition
  ): void {
    this.definitions.set(definitionId, data)
  }

  getComponentDefinition(definitionId: string): ComponentDefinition {
    const definition = this.definitions.get(definitionId)
    if (!definition) {
      this.logger.fatal(
        logName,
        'No component definition for id: {0}',
        definitionId
      )
    }
    return definition
  }

  hasComponentDefinition(definitionId: string): boolean {
    return this.definitions.has(definitionId)
  }

  getLoadedDefinitionIds(): string[] {
    return Array.from(this.definitions.keys())
  }
}
