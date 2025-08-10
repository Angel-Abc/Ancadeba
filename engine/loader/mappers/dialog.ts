import type { Dialog as DialogData, DialogSet as DialogSetData, Behavior as BehaviorData, DialogChoice as DialogChoiceData, DialogAction as DialogActionData } from '@loader/data/dialog'
import { type Dialog, type DialogSet, type Behavior, type DialogChoice, type DialogAction } from '@loader/schema/dialog'
import { mapCondition } from './condition'
import { mapAction } from './action'

export function mapDialogSet(dialogSet: DialogSet): DialogSetData {
    const defaultBehavior = mapBehavior(dialogSet['default-behavior'])
    const dialogs: Record<string, DialogData> = {}
    dialogSet.dialogs.forEach(dialog => dialogs[dialog.id] = mapDialog(dialog, defaultBehavior))
    return {
        id: dialogSet.id,
        startCondition: mapCondition(dialogSet['start-condition']),
        dialogs: dialogs,
        startWith: dialogSet['start-with']
    }
}

export function mapBehavior(behavior: Behavior): BehaviorData {
    return {
        canMove: behavior['can-move']
    }
}

export function mapDialogAction(action: DialogAction): DialogActionData {
    switch (action.type) {
        case 'goto':
            return {
                type: 'goto',
                target: action.target
            }
        case 'end-dialog':
            return {
                type: 'end-dialog',
                message: action.message
            }
        default:
            return mapAction(action)
        }
}

export function mapDialogChoice(choice: DialogChoice): DialogChoiceData {
    return {
        id: choice.id,
        label: choice.label,
        visible: choice.visible ? mapCondition(choice.visible) : undefined,
        enabled: choice.enabled ? mapCondition(choice.enabled) : undefined,
        action: mapDialogAction(choice.action)
    }
}

export function mapDialogChoices(choices: DialogChoice[]): DialogChoiceData[] {
    return choices.map(mapDialogChoice)
}

export function mapDialog(dialog: Dialog, defaultBehavior: BehaviorData): DialogData {
    const behavior = dialog.behavior ? mapBehavior(dialog.behavior) : {}
    return {
        id: dialog.id,
        message: dialog.message,
        behavior: {
            ...defaultBehavior,
            ...behavior
        },
        choices: mapDialogChoices(dialog.choices)
    }
}