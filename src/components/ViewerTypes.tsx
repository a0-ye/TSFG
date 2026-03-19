import type { FlagValue } from "./utils";

/**
  ```
  id: string, // id
    type: string,   // narration, action, journal
    data: {
        content:string[],
        type:string,
        vars?:{
            key:string,
            operation:string,
            value:string | number,
        },
        transition?:{
            auto:boolean,
            duration:string|number,
            startDelay:string|number,
        },
    }
        
    ```
 */
export interface DataNode {
    id: string, // id
    type: string,   // narration, action, journal
    data: {
        content:string[],
        type:string,
        vars?:{
            key:string,
            operation:string,
            value:string | number,
        }[],
        transition:{
            auto:boolean,
            duration:string|number,
            startDelay:string|number,
        },
    }, 
};

/**
 * Multiple JournalNodes can share the same groupID. When its time to display, only one of a groupID can display (and only in its place)
 */
export interface JournalNode extends DataNode { // type 4
    groupID:string,
    priority:number,    // priority. Higher means its displayed over lower ones if their conditions are all met
    dependencies: Record<string,FlagValue>,   // object with string: string | number | boolean
    persist:boolean     //persist on restart
}

export interface DataEdge {
    id: string, // id
    source: string, 
    target: string
    data?: {
        type?:string,
        vars?:{
            key:string,
            operation:string,
            value:string | number,
        }[],
    }, 
}

// ERROR NODES ==================

export const ERROR_DATANODE:DataNode = {
    id:'ERROR', // id
    type: 'ERROR',   // narration, action, journal
    data: {
        content:['ERROR','ERROR','ERROR'],
        type:'ERROR',
        transition:{
            auto:false,
            duration:'ERROR',
            startDelay:'ERROR',
        }
    }, 
};
