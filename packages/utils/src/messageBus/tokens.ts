import { token } from '../ioc/token'
import { type IMessageBus } from './types'

export const messageBusToken = token<IMessageBus>('utils/messageBus/messageBus')
