import type { Condition as ConditionData } from '@loader/data/condition'
import { type Condition } from '@loader/schema/condition'
import { fatalError } from '@utils/logMessage'

const logName = 'mapCondition'

export function mapCondition(condition: Condition): ConditionData {
    switch(condition.type){
        case 'script':
            return {
                type: 'script',
                script: condition.script
            }
        default:
            // Guard against unrecognized condition schema types
            fatalError(logName, 'Unsupported condition type: {0}', (condition as { type: string }).type)
    }
}
