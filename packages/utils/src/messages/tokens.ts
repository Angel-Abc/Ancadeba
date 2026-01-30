import { token } from '../ioc/token'
import { type IMessageBus, MessageBusLogName } from './types'

export const messageBusToken = token<IMessageBus>(MessageBusLogName)
