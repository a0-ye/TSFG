import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ERROR_JOURNALNODE, type JournalNode } from "../ViewerTypes";
import { evaluateDependencies, type FlagValue } from "../utils";


interface journalProps {
    flags: Record<string, FlagValue>,
    setFlags: Function,
    displayedJournalEntries: JournalNode[],
    setDisplayedJournalEntries: Function,
    journalMap: Map<string, JournalNode>


}

/**
 * REQS:
 * remember page when closing
 * 
 * Option to view cover of journal
 * 
 * slide to center of screen, flip open
 *  Drag? easy
 * 
 * Rectangle div in center. Work on instant page toggle for flipping.
 * Animations come later
 * Click to slide on screen come later. Uses pop-in button for now
 * 
 * little bookmarks appear per entry! how cute
 * show variant toggle between entry variants
 * 
 */




export default function Journal(props: journalProps) {
    /**
     * on journalFlag update
     * 1. grab all dependency-met JournalNodes
     * 2. keep only the highest priority per groupID. Replace entries
     * 
     */
    useEffect(() => {
        // Filter out based on condition: node's dependency flags' currentValue vs requirement is true
        const allJournalNodes = Array.from(props.journalMap.values())
        const met = allJournalNodes.filter((node: JournalNode) => {
            return evaluateDependencies(node.data.vars || [], props.flags)
        });
        console.log('met', met);

        // keep only the highest priority node per GroupID. map of groupID:node
        const groupMap = new Map<string, JournalNode>();
        met.forEach((node: JournalNode) => {
            const existing = groupMap.get(node.groupID);

            if (!existing || node.priority > existing.priority) {
                groupMap.set(node.groupID, node);
            }
        });

        // realistically, only one new node will be added at a time. if more entries are added though, they are added in an undefined order.

        // replacement. go through the entire displayedEntries, replacing with whatever is inside the groupMap.
        // This SHOULD preserve order
        props.setDisplayedJournalEntries((prev: JournalNode[]) => {
            // map all previous values to the most updated version from the Map
            const updatedEntries: JournalNode[] = prev.map((node) => {
                return groupMap.get(node.groupID) || ERROR_JOURNALNODE
            })
            // for every valid entry, entry doesnt exist in updatedEntries, add it
            groupMap.forEach((node) => {
                if (!updatedEntries.includes(node)) {
                    updatedEntries.push(node)
                }
            })
            console.log('displayedJournalEntries:', updatedEntries);
            return updatedEntries
        })

    }, [props.flags, props.journalMap]);

    const [leftPageIdx, setleftPageIdx] = useState(0)
    const [showJournal, setShowJournal] = useState(false)

    const nextPage = () => {
        setleftPageIdx((currentLeftPageIdx) => {
            //activePageIdx == length-1 means we are at the back cover. Do not increment
            return currentLeftPageIdx + 2 >= props.displayedJournalEntries.length ? currentLeftPageIdx : currentLeftPageIdx + 2
        })
    }
    const prevPage = () => {
        setleftPageIdx((currentLeftPageIdx) => {
            // == 0 means front cover. dont decrement
            return currentLeftPageIdx - 2 < 0 ? currentLeftPageIdx : currentLeftPageIdx - 2
        })
    }

    return <>
        {/** perhaps there should be a collision box? needs to be big enough such that the offset to the visual wont affect selection on the hover animation yk? like 
         * it displaces 100px to the right, that animation can possibly move it off the mouse, thus un-hovering it
         */}
        <motion.div
            id="journal-toggle-collision"
            style={{
                position: 'fixed',
                bottom: '15%',
                width: 500, height: 700,
                x: -300,
                y: 0,
                rotate: 15,
            }}
            whileHover={{
                x: 0,
                y: 0,
                rotate: 5,
            }}
            onClick={() => { setShowJournal((prevShowJournal) => (!prevShowJournal)) }}
        >
            <div
                id='journal-visuals'
                style={{
                    width: 450, height: 650,
                    backgroundColor: '#635337ff',
                    border: 'solid 2px black'
                }}
            >

            </div>

        </motion.div>
        <div style={{ position: "fixed", left: '0%', top: '0%' }}>
            <button onClick={() => { setShowJournal((prevShowJournal) => (!prevShowJournal)) }}
            // style={{ position: "fixed", left: '0%', top: '0%' }}
            >
                toggle journal
            </button>
        </div>
        {showJournal && <div style={{
            position: 'fixed', left: '50%', top: '25%', translate: '-50% 0',
            backgroundColor: "#755d3dff", zIndex: 1
        }}>
            <div style={{
                display: "flex"
            }}>
                <div style={{ border: 'solid black 2px', backgroundColor: '#44433aff', margin: 5, width: 650, height: 600 }}>
                    {props.displayedJournalEntries[leftPageIdx]?.data ?
                        <div dangerouslySetInnerHTML={{ __html: props.displayedJournalEntries[leftPageIdx].data.content[0] }} />
                        : <div> {`No Content found for index ${leftPageIdx}`} </div>}
                </div>
                <div style={{ border: 'solid black 2px', backgroundColor: '#44433aff', margin: 5, width: 650, height: 600 }}>
                    {props.displayedJournalEntries[leftPageIdx + 1]?.data ?
                        <div dangerouslySetInnerHTML={{ __html: props.displayedJournalEntries[leftPageIdx + 1].data.content[0] }} />
                        : <div> {`No Content found for index ${leftPageIdx + 1}`} </div>}
                </div>
            </div>
            <div> {leftPageIdx} </div>
            <button onClick={prevPage}> prev page </button>
            <button onClick={nextPage}> next page </button>

        </div>}
    </>
}