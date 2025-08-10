import type { 
    Input as InputData, 
    VirtualInput as VirtualInputData, 
    VirtualKey as VirtualKeyData, 
    VirtualInputs as VirtualInputsData, 
    VirtualKeys as VirtualKeysData } from '@loader/data/inputs'
import { type Input, type VirtualInputs, type VirtualKeys, type VirtualInput, type VirtualKey } from '@loader/schema/inputs'
import { mapCondition } from './condition'
import { mapAction } from './action'

export function mapVirtualInput(input: VirtualInput): VirtualInputData {
    return {
        virtualInput: input.virtualInput,
        virtualKeys: input.virtualKeys,
        label: input.label
    }
}

export function mapVirtualInputs(inputs: VirtualInputs): VirtualInputsData {
    return inputs.map(mapVirtualInput)
}

export function mapVirtualKey(key: VirtualKey): VirtualKeyData {
    return {
        virtualKey: key.virtualKey,
        keyCode: key.keyCode,
        shift: key.shift ?? false,
        ctrl: key.ctrl ?? false,
        alt: key.alt ?? false
    }
}

export function mapVirtualKeys(keys: VirtualKeys): VirtualKeysData {
    return keys.map(mapVirtualKey)
}

export function mapInputs(inputs: Input[]): InputData[] {
    return inputs.map(mapInput)
}

export function mapInput(input: Input): InputData {
    return {
        virtualInput: input.virtualInput,
        preferredRow: input.preferredRow,
        preferredCol: input.preferredCol,
        label: input.label,
        description: input.description,
        visible: mapCondition(input.visible),
        enabled: mapCondition(input.enabled),
        action: mapAction(input.action)
    }
}