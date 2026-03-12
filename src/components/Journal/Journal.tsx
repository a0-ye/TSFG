import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { AllNodes, DataNode, JournalNode } from "../NodeTypes";

interface journalProps {
    passageMap: Map<string, AllNodes>,
    allJournalNodes: JournalNode[]
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

type FlagValue = string | number | boolean;
const [journalFlags, setJournalFlags] = useState<Record<string, FlagValue>>({})

/**
 * Updates Journal Flags with the all flag:value in newFlags.
 * should not contain any operators since this is a flat value update
 * @param newFlags JS object of string: string | number | boolean. 
 */
export function updateFlags(newFlags: Record<string, FlagValue>) {
    setJournalFlags((prev) => ({
        ...prev,
        ...newFlags
    }));
}
// Evaluates dependencies in a JournalNode. 
// used AI to help generate regex (I dont know how to write regex but I know how to utilize it)
function evaluateDependency(currentValue: FlagValue, requirement: string | FlagValue): boolean {
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

export default function Journal(props: journalProps) {
    const displayedEntries = useMemo(() => {
        // Filter out based on condition: node's dependency flags' currentValue vs requirement is true
        const met = props.allJournalNodes.filter((node: JournalNode) => {
            return Object.entries(node.dependencies).every(([flagKey, requirement]) => {
                const currentFlagValue = journalFlags[flagKey];
                if (currentFlagValue === undefined) return false;
                return evaluateDependency(currentFlagValue, requirement as FlagValue);
            });
        });

        // keep only the highest priority node per GroupID
        const groupMap = new Map<string, JournalNode>();

        met.forEach((node: JournalNode) => {
            const existing = groupMap.get(node.groupID);
            if (!existing || node.priority > existing.priority) {
                groupMap.set(node.groupID, node);
            }
        });
        return Array.from(groupMap.values()).map(node => node.id);
    }, [journalFlags, props.allJournalNodes]);



    const [leftPageIdx, setleftPageIdx] = useState(0)
    const [showJournal, setShowJournal] = useState(false)

    const nextPage = () => {
        setleftPageIdx((currentLeftPageIdx) => {
            //activePageIdx == length-1 means we are at the back cover. Do not increment
            return currentLeftPageIdx + 2 >= displayedEntries.length ? currentLeftPageIdx : currentLeftPageIdx + 2
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
                    {displayedEntries[leftPageIdx] || `No Content found for index ${leftPageIdx + 1}`}
                </div>
                <div style={{ border: 'solid black 2px', backgroundColor: '#44433aff', margin: 5, width: 650, height: 600 }}>
                    {displayedEntries[leftPageIdx + 1] || `No Content found for index ${leftPageIdx + 1}`}
                </div>
            </div>
            <div> {leftPageIdx} </div>
            <button onClick={prevPage}> prev page </button>
            <button onClick={nextPage}> next page </button>

        </div>}
    </>
}