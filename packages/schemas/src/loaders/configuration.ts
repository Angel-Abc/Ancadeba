import { token } from '@ancadeba/utils'

export interface IJsonConfiguration {
  rootPath: string
}

const logName = 'schemas/loaders/configuration'
export const jsonConfigurationToken = token<IJsonConfiguration>(logName)
