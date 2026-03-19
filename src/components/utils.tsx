export type dataVars = { key: string, operation: string, value: string | number }

export type FlagValue = string | number | boolean;

export const castValue = (val: any): FlagValue => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (!isNaN(Number(val)) && val !== '') return Number(val);
    return val; // Stay as string
};


// Evaluates dependency
// used AI to help generate regex (I dont know how to write regex but I know how to utilize it)
/**
 * 
 * @param currentValue Current value of a given flag
 * @param value Requirement to meet. May include inequality
 * @returns 
 */
export function evaluateDependency(
    currentValue: any,
    operation: string,
    requirement: string | any
): boolean {
    const val = castValue(currentValue);
    const req = castValue(requirement);

    console.log(`Evaluating: ${val} (${typeof val}) ${operation} ${req} (${typeof req})`);

    if (val === undefined || val === null || operation === '' || req === '') {
        return false;
    }

    switch (operation) {
        case '>': return val > req;
        case '<': return val < req;
        case '>=': return val >= req;
        case '<=': return val <= req;
        case '!=': return val !== req;
        case '==': return val === req;
        default: return val === req;
    }
}
/**
 * Checks if all dependencies for a given node are met according to the given set of flags
 * @param vars {key, operation, value}
 * @param flags The Record containing ALL flags
 * @returns Boolean for if all the dependencies for the given node are met
 */
export function evaluateDependencies(vars: dataVars[], flags: Record<string, FlagValue>): boolean {
    // console.log("evaluating node ", node.id,);
    return vars.every((entry) => {
        return evaluateDependency(flags[entry.key], entry.operation, entry.value)
    })
}
