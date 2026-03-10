import { act, useState } from "react"
import type { storyNode } from "../../App"
import { motion } from "motion/react"


interface PassageBoxProps {
    passageID: string,
    nodeData: Record<string, string>, // holds flags, transitions, next node, action nodes, etc. FROM THE JSON
    passageMap: Map<string, storyNode>,    // map of ALL story content
    addPassage: Function,
    setJournalFlags: Function,
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
    const storyNode = props.passageMap.get(passageID)

    const setJournalFlags = props.setJournalFlags
    const [lockoutChoices, setLockoutChoices] = useState(false)
    const [choiceIndex, setChoiceIndex] = useState(Infinity)
    const actions: string[] = []

    /**
     * id, type, next['stringids']
     */
    if (props.nodeData.type == '1') { // perform a check for various things. Mainly the type
        actions.push(props.nodeData.next);  // push in the string IDs for the actions
    } else {
        // add the default advance?
    }

    return <>
        <motion.div key={props.index} style={{ position: 'relative', margin: '50px', height: 500, border: 'solid 2px white', backgroundColor: '#2e2c28' }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div dangerouslySetInnerHTML={{ __html: storyNode?.data[0] || `ERROR: no node found for ID ${passageID}` }}></div>
            <div style={{ position: 'absolute', bottom: '0%' }}>
                {
                    actions.map((actionID, index) => {
                        return <button
                            style={{ backgroundColor: choiceIndex == index ? '#7e8f20ff' : (lockoutChoices ? '#70707052' : "auto"), pointerEvents: lockoutChoices ? "none" : 'auto' }}
                            dangerouslySetInnerHTML={
                                { __html: props.passageMap.get(actionID)?.data[0] || `ACTION ERROR: no action for ID ${actionID}` }
                            }
                            onClick={() => {
                                // action lockout flags
                                setLockoutChoices(true)
                                setChoiceIndex(index)
                                props.addPassage() // Append next Passage ID to the global chain. 
                                // check flags to be set via json data
                                // setJournalFlags((prevJournalFlags: Record<string, number>) => {
                                //     return { ...prevJournalFlags, ...detail.setFlags ?? {} }
                                // })
                            }}></button>
                    })
                }
            </div>
        </motion.div>



    </>
}