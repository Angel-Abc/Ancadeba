/**
 * Condition defined by evaluating a JavaScript snippet.
 *
 * @property type   Discriminator for the condition, always `'script'`.
 * @property script Source code returning a boolean value.
 */
export interface ScriptCondition {
    type: 'script'
    script: string
}

/** Union type of all available conditions evaluated at runtime. */
export type Condition = ScriptCondition

/** Default condition that always evaluates to `true`. */
export const trueCondition: Condition = {
    type: 'script',
    script: 'return true'
}
