
export type AllNodes = DataNode | StoryNode | ActionNode | JournalNode;

export interface DataNode {
    id: string, // id
    type: string,
    data: string[], // other rows' content excluding the ID row (very first one)
    rowCount: number, // total number of rows, INCLUDING the id row,

};

export interface StoryNode extends DataNode {  // type 0,1
    next: string[]
}
export interface ActionNode extends DataNode {  // type 3
    next: string[]
    varset: {}  // object with string: string | number | boolean
}

/**
 * Multiple JournalNodes can share the same groupID. When its time to display, only one of a groupID can display (and only in its place)
 */
export interface JournalNode extends DataNode { // type 4
    groupID:string,
    priority:number,    // priority. Higher means its displayed over lower ones if their conditions are all met
    dependencies: {}  // object with string: string | number | boolean
}

// ERROR NODES ==================

export const ERROR_NODE: DataNode = {
    id: 'error',
    type: "error",
    data: ["error"],
    rowCount: Infinity,
}
export const ERROR_STORY_NODE: StoryNode = {
    ...ERROR_NODE,
    next: ['error']
}
export const ERROR_ACTION_NODE: ActionNode = {
    ...ERROR_NODE,
    next: ['error'],
    varset: { 'error': 'error' }
}
export const ERROR_JOURNAL_NODE: JournalNode = {
    ...ERROR_NODE,
    groupID:'error',
    priority:Infinity,
    dependencies: { 'error': 'error' }
}