import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { evaluateDependencies, type FlagValue } from "../utils";
import { ERROR_DATANODE, type DataEdge, type DataNode } from "../ViewerTypes";




interface PassageBoxProps {
    passageID: string,
    passageMap: Map<string, DataNode>,    // map of ALL story content
    edgeMap: Map<string, DataEdge[]>,
    addPassage: Function,
    index: number,

    flags: Record<string, FlagValue>
    updateFlags: Function,
}


const neutralActionStyle = '#fce045ff'

const greyedActionStyle = '#5c5c5cff'

/**
 * 
 * Passage box used to display a passage's text content, and actions/decisions if there any to be made.
 * 
 * Check nodeMap[passageID] for my data. 
 */
export default function PassageBox(props: PassageBoxProps) {
    const passageID = props.passageID
    const passageMap = props.passageMap
    const passageNode: DataNode = passageMap.get(passageID) || ERROR_DATANODE

    const [lockoutChoices, setLockoutChoices] = useState(false)
    const [choiceIndex, setChoiceIndex] = useState(Infinity)

    /**
     * A list of Target Nodes that connect to potential next nodes.
     */
    const [next] = useState<DataNode[]>(() => {
        props.updateFlags(passageNode.data.vars)    // Set the variables here, since this only gets called once as a little hack :3

        return (props.edgeMap.get(passageID) || []).filter((edge: DataEdge) => {
            return evaluateDependencies(edge.data?.vars || [], props.flags)
        }).map((edge: DataEdge) => {
            return passageMap.get(edge.target) || ERROR_DATANODE
        })


    });

    useEffect(() => {
        // 1. Guard: Only run if 'auto' is true and we have a target to move to
        const { auto, delayAuto } = passageNode.data.transition;

        if (auto) {
            // for every narration passage, load all of them.
            // 2. Set the timer
            const timer = setTimeout(() => {
                console.log(`delaying adding new passages for ${delayAuto} seconds`);
                
                const narrations = next.filter((node)=>{
                    return node.type == 'narration'
                })
                narrations.forEach((node)=>props.addPassage(node.id))
                
            }, (Number(delayAuto) || 0.5) * 1000);

            // 3. Cleanup: If the user clicks something else or leaves the node, 
            // kill the timer so addPassage() doesn't fire twice.
            return () => clearTimeout(timer);
        }
    }, []);

    return <>
        <motion.div key={props.index}
            style={{
                position: 'relative',
                // margin: '50px', 
                // border: 'solid 2px white', 
                // backgroundColor: '#2e2c28',
                textAlign: 'left', padding: '1em',
            }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: Number(passageNode.data.transition?.duration) || 0,
                delay: Number(passageNode.data.transition?.startDelay) || 0,
            }}
        >

            <div dangerouslySetInnerHTML={{ __html: passageNode.data.content || `ERROR: no node found for ID ${passageID}` }}></div>
            <div id="actionBox"
                style={{
                    // backgroundColor: lockoutChoices?  'transparent' : "#70707052"
                }}>
                {passageNode.data.transition.auto ? <>
                    {/* Should do nothing. no actions. nothin. Maybe debug stuff can live here but nothing else. */}
                </> :

                    next.map((node, index) => {
                        if (node.type == 'action') {
                            return <>
                                <button id={node.id + '-button'} key={node.id + '-button'}
                                    style={{
                                        backgroundColor: "transparent",
                                        color: lockoutChoices ? ((choiceIndex == index) ? "inherit" : greyedActionStyle) : neutralActionStyle,
                                        pointerEvents: lockoutChoices ? "none" : 'auto',
                                    }}
                                    dangerouslySetInnerHTML={
                                        {
                                            __html: choiceIndex == index ? node.data.content[1] || `ACTION ERROR: no text for ID ${node.id}[1]`
                                                : node.data.content[0] || `ACTION ERROR: no text for ID ${node.id}[0]`
                                        }
                                    }
                                    onClick={() => {
                                        setLockoutChoices(true);
                                        setChoiceIndex(index);
                                        (props.edgeMap.get(node.id) || []).forEach((nextEdge) => {
                                            console.log('action selected!', passageMap.get(nextEdge.target));
                                            props.addPassage((passageMap.get(nextEdge.target)?.id || ERROR_DATANODE.id)) // Append next Passage ID to the global chain if clicked
                                        });
                                        props.updateFlags(node.data.vars)    // Update flags directly from node varset
                                    }}>

                                </button>
                                {/* <span id="DEBUG" style={{ fontSize: '10px', color: '#68c7caff', }}>
                                ID: {passageMap.get(actionID)?.id} | next: {(passageMap.get(actionID) as ActionNode)?.next}
                            </span> */}
                                <br />
                            </>
                        }
                        else if (node.type == 'narration') {
                            // make a button that adds it
                            return <>
                                <button
                                    id={node.id + '-default-button'}
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: choiceIndex == Infinity ? neutralActionStyle : 'inherit',
                                        pointerEvents: lockoutChoices ? "none" : 'auto',
                                        // opacity: lockoutChoices ? 0 : 1,
                                        display: lockoutChoices ? 'none' : 'auto',
                                    }}
                                    onClick={() => {
                                        props.addPassage(node.id)
                                        setChoiceIndex(0)
                                        setLockoutChoices(true)
                                    }}> &#62;&#62;&#62; ...({node.id}) </button>
                            </>
                        }


                        return <>
                            <div>ERROR. Got a weird type of node</div>
                        </>
                    })}

                { }
            </div>
            {/* <span style={{ fontSize: '10px', color: '#68c7caff', position: 'absolute', top: '2px', right: '5px' }}>
                DEBUG INFO|   ID: {passageNode?.id} Type: {passageNode?.type} | next: {passageNode?.next}
            </span> */}
        </motion.div>



    </>
}