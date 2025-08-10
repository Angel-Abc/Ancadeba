import type { Condition as ConditionData } from '@loader/data/condition'
import { type Condition } from '@loader/schema/condition'

export function mapCondition(condition: ConditionData): Condition {
    switch(condition.type){
        case 'script':
            return {
                type: 'script',
                script: condition.script
            }
    }
}