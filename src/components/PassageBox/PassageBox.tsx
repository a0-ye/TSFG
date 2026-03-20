import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { evaluateDependencies, type dataVars, type FlagValue } from "../utils";
import { ERROR_DATANODE, type DataEdge, type DataNode } from "../ViewerTypes";




interface PassageBoxProps {
    node: DataNode,
    passageMap: Map<string, DataNode>,    // map of ALL story content
    edgeMap: Map<string, DataEdge[]>,
    addPassage: (node: DataNode) => void,
    index: number,

    flags: Record<string, FlagValue>
    updateFlags: (vars: dataVars[]) => void,
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
    const passageMap = props.passageMap
    const passageNode: DataNode = props.node

    const [lockoutChoices, setLockoutChoices] = useState(false)
    const [choiceIndex, setChoiceIndex] = useState(Infinity)

    /**
     * 
     * @param dataNodeID id to get met next (met dependencies, has an edge to a next node)
     * @returns 
     */
    const getMetNext = (dataNodeID: string): DataNode[] => {
        return (props.edgeMap.get(dataNodeID) || []).filter((edge: DataEdge) => {
            return evaluateDependencies(edge.data?.vars || [], props.flags)
        }).map((edge: DataEdge) => {
            return passageMap.get(edge.target) || ERROR_DATANODE
        })
    }
    /**
     * A list of Target Nodes that connect to potential next nodes.
     */
    const [next] = useState<DataNode[]>(() => {
        if (passageNode.type === 'ghost') {
            // if we made a ghost, just use what was given.
            return passageNode.data.ghostActions as DataNode[]
        }
        props.updateFlags(passageNode.data.vars || [])    // Set the variables here, since this only gets called once as a little hack :3
        return getMetNext(passageNode.id)
    });

    useEffect(() => {
        // 1. Guard: Only run if 'auto' is true and we have a target to move to
        const { auto, delayAuto } = passageNode.data.transition;

        if (auto) {
            // for every narration passage, load all of them.
            // 2. Set the timer
            const timer = setTimeout(() => {
                const narrations = next.filter((node) => {
                    return node.type == 'narration'
                })
                narrations.forEach((node) => props.addPassage(node))

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

            <div dangerouslySetInnerHTML={{ __html: passageNode.data.content || `ERROR: no node found for ID ${passageNode.id}` }}></div>
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
                                        /**
                                         * Assemble all next Action nodes. package them into a ghost Passage.
                                         * 
                                         */
                                        const allNext = getMetNext(node.id); // list of all next for this action. Can include actions
                                        const narrativeNext = allNext.filter((node) => { return node.type === 'narration' });
                                        narrativeNext.forEach((node) => {
                                            props.addPassage(node)
                                        })
                                        const actionNext = allNext.filter((node) => { return node.type === 'action' });
                                        if (actionNext.length > 0) {
                                            const ghostpassage: DataNode = {
                                                id: `ghost-${node.id}`,
                                                type: 'ghost',
                                                data: {
                                                    content: [],
                                                    type: 'ghost',
                                                    // Inject the children directly here!
                                                    ghostActions: actionNext,
                                                    transition: { auto: false, delayAuto: 0, duration: 1, startDelay: 0 }
                                                },
                                            };
                                            props.addPassage(ghostpassage);
                                        }
                                        props.updateFlags(node.data.vars || [])    // Update flags directly from node varset
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
                                        props.addPassage(node)
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