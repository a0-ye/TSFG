import type { ActionNode, JournalNode } from "./NodeTypes";

export type FlagValue = string | number | boolean;
// Evaluates dependency
// used AI to help generate regex (I dont know how to write regex but I know how to utilize it)
/**
 * 
 * @param currentValue Current value of a given flag
 * @param requirement Requirement to meet. May include inequality
 * @returns 
 */
export function evaluateDependency(currentValue: FlagValue, requirement: string | FlagValue): boolean {
    const hasOperator = typeof requirement === 'string' && /^[><=!]+/.test(requirement);
    // if it is not a string or has no operator
    if (!hasOperator) {
        return currentValue === requirement;
    }
    // otherwise we gotta check the operator
    // regex to split the operator from the value (e.g., '>=' and '50'). 
    const match = requirement.match(/^([><=!]+)\s*(.*)$/);
    if (!match) return currentValue === requirement;

    const [_, operator, reqValueStr] = match;

    // Convert reqValue to the appropriate type for comparison
    const reqValue = isNaN(Number(reqValueStr)) ? reqValueStr : Number(reqValueStr);

    switch (operator) {
        case '>': return currentValue > reqValue;
        case '<': return currentValue < reqValue;
        case '>=': return currentValue >= reqValue;
        case '<=': return currentValue <= reqValue;
        case '!=': return currentValue !== reqValue;
        case '==': return currentValue === reqValue;
        default: return currentValue === requirement;
    }
}

/**
 * Checks if all dependencies for a given node are met according to the given set of flags
 * @param node The JournalNode or ActionNode to check
 * @param flags The Record containing ALL flags
 * @returns Boolean for if all the dependencies for the given node are met
 */
export function evaluateDependencies(node: JournalNode | ActionNode, flags:Record<string, FlagValue>): boolean {
    console.log("NODE:",node, "FLAGS:", flags, "");
    
    return Object.entries(node.dependencies).every(
        entry => evaluateDependency(flags[entry[0]], entry[1])
    )
}
