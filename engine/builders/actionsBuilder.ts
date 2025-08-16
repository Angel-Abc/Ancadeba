import { Container } from '@ioc/container'
import { ActionExecuter, actionExecuterDependencies, actionExecuterToken } from '@actions/actionExecuter'
import { PostMessageAction, PostMessageActionDependencies, postMessageActionToken } from '@actions/postMessageAction'

/**
 * Registers action related services and predefined actions.
 */
export class ActionsBuilder {
  /**
   * Register action dependencies into the container.
   */
  register(container: Container): void {
    container.register({
      token: actionExecuterToken,
      useClass: ActionExecuter,
      deps: actionExecuterDependencies
    })
    container.register({
      token: postMessageActionToken,
      useClass: PostMessageAction,
      deps: PostMessageActionDependencies,
      scope: 'transient'
    })
  }
}

