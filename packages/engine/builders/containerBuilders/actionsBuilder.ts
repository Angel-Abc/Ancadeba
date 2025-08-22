import { ActionExecutor, actionExecutorDependencies, actionExecutorToken } from '@actions/actionExecutor'
import { EndDialog, endDialogDependencies, endDialogToken } from '@actions/endDialog'
import { GotoDialog, gotoDialogDependencies, gotoDialogToken } from '@actions/gotoDialog'
import { PostMessageAction, postMessageActionDependencies, postMessageActionToken } from '@actions/postMessageAction'
import { ScriptAction, scriptActionDependencies, scriptActionToken } from '@actions/scriptAction'
import { Container } from '@ioc/container'

export class ActionsBuilder {
    public register(container: Container): void {
        container.register({
            token: actionExecutorToken,
            useClass: ActionExecutor,
            deps: actionExecutorDependencies
        })
        container.register({
            token: endDialogToken,
            useClass: EndDialog,
            deps: endDialogDependencies
        })
        container.register({
            token: gotoDialogToken,
            useClass: GotoDialog,
            deps: gotoDialogDependencies
        })
        container.register({
            token: postMessageActionToken,
            useClass: PostMessageAction,
            deps: postMessageActionDependencies
        })
        container.register({
            token: scriptActionToken,
            useClass: ScriptAction,
            deps: scriptActionDependencies
        })
    }
}
