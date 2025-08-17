import { Container } from '@ioc/container'
import { ActionExecutor, actionExecutorDependencies, actionExecutorToken } from '@actions/actionExecutor'
import { PostMessageAction, postMessageActionDependencies, postMessageActionToken } from '@actions/postMessageAction'

/**
 * Registers action related services and predefined actions.
 */
export class ActionsBuilder {
  /**
   * Register action dependencies into the container.
   */
  register(container: Container): void {
    container.register({
      token: actionExecutorToken,
      useClass: ActionExecutor,
      deps: actionExecutorDependencies
    })
    container.register({
      token: postMessageActionToken,
      useClass: PostMessageAction,
      deps: postMessageActionDependencies,
      scope: 'transient'
    })
  }
}

