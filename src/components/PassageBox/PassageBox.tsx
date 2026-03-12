import { useState } from "react"
import { motion } from "motion/react"
import { ERROR_STORY_NODE, type ActionNode, type AllNodes, type DataNode, type StoryNode } from "../NodeTypes"
import { updateFlags } from "../Journal/Journal"


interface PassageBoxProps {
    passageID: string,
    passageMap: Map<string, AllNodes>,    // map of ALL story content
    addPassage: Function,
    index: number,
}


/**
 * 
 * Passage box used to display a passage's text content, and actions/decisions if there any to be made.
 * Looks up the data to be used from the passage map, and 
 * 
 * if the type of this node is branch/decision (from json info), load the next nodes as actions in this passage box.
 */
export default function PassageBox(props: PassageBoxProps) {
    const passageID = props.passageID
    const passageMap = props.passageMap
    const passageNode:StoryNode = passageMap.get(passageID) as StoryNode || ERROR_STORY_NODE

    const [lockoutChoices, setLockoutChoices] = useState(false)
    const [choiceIndex, setChoiceIndex] = useState(Infinity)
    const actions: string[] = []

    /**
     * id, type, next['stringids']
     */
    if (passageNode?.type == '1') { // perform a check for various things. Mainly the type
        actions.push(...passageNode?.next);  // push in the string IDs for the actions
    } else {
        // actions.push(passageNode?.next[0] || 'error')
    }

    return <>
        <motion.div key={props.index} style={{ position: 'relative', margin: '50px', height: 500, border: 'solid 2px white', backgroundColor: '#2e2c28' }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >

            <div dangerouslySetInnerHTML={{ __html: passageNode?.data[0] || `ERROR: no node found for ID ${passageID}` }}></div>
            <div style={{ position: 'absolute', bottom: '0%' }}>
                {actions.length > 0 ? actions.map((actionID, index) => {
                    return <>
                        <button id={actionID}
                            style={{ backgroundColor: choiceIndex == index ? '#7e8f20ff' : (lockoutChoices ? '#70707052' : "auto"), pointerEvents: lockoutChoices ? "none" : 'auto' }}
                            dangerouslySetInnerHTML={
                                {
                                    __html: choiceIndex == index ? props.passageMap.get(actionID)?.data[1] || `ACTION ERROR: no text for ID ${actionID}[1]`
                                        : props.passageMap.get(actionID)?.data[0] || `ACTION ERROR: no text for ID ${actionID}[0]`
                                }
                            }
                            onClick={() => {
                                const thisNode = (passageMap.get(actionID) as ActionNode)
                                setLockoutChoices(true)
                                setChoiceIndex(index)
                                props.addPassage(thisNode.next[0]) // Append next Passage ID to the global chain if clicked
                                updateFlags(thisNode.varset)    // Update flags directly from node varset
                            }}>

                        </button>
                        <span style={{ fontSize: '10px', color: '#68c7caff', position: 'absolute', top: '2px', right: '5px' }}>
                            ID: {passageMap.get(actionID)?.id} | next: {(passageMap.get(actionID)as ActionNode)?.next}
                        </span>
                    </>
                }) : <button
                    style={{ backgroundColor: choiceIndex != Infinity ? '#7e8f20ff' : (lockoutChoices ? '#70707052' : "auto"), pointerEvents: lockoutChoices ? "none" : 'auto' }}
                    onClick={() => {
                        props.addPassage(passageNode?.next[0])
                        setChoiceIndex(0)
                        setLockoutChoices(true)
                    }}> advance... </button>
                }
            </div>
            <span style={{ fontSize: '10px', color: '#68c7caff', position: 'absolute', top: '2px', right: '5px' }}>
                DEBUG INFO|   ID: {passageNode?.id} | next: {passageNode?.next}
            </span>
        </motion.div>



    </>
}