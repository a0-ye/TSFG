import { useEffect, useRef, useState } from 'react'


import { type DataEdge, type DataNode, type JournalNode, } from '../ViewerTypes'
import PassageBox from '../PassageBox/PassageBox'
import { castValue, type dataVars, type FlagValue } from '../utils'




export default function StoryViewer() {
    /**
     * TODO:
     * Passage Event System ? what does this even mean? Sound triggers. visual triggers. Timer triggers? Events should be on Passage Load.
     * replace Map usage with Record<T,T>()
     */


    const [displayedPassages, setDisplayedPassages] = useState<string[]>([])  // An array of passage IDs to display
    const addPassage = (passageID: string) => {
        setDisplayedPassages((prevPassages) => {
            return [...prevPassages, passageID]
        })
    }
    const [fileLoaded, setFileLoaded] = useState(false)
    const [nodeMap, setNodeMap] = useState(new Map<string, DataNode>()) // A map containing all narrative and action nodes. id:{nodedata}
    const [journalMap, setJournalMap] = useState(new Map<string, JournalNode>()) // map of all journal entries. id:{nodedata}
    const [edgeMap, setEdgeMap] = useState(new Map<string, DataEdge[]>()) // 

    const [flags, setFlags] = useState<Record<string, FlagValue>>({})
    /**
   * Updates Journal Flags with the all flag:value in newFlags.
   * should not contain any operators since this is a flat value update
   * @param newFlags JS object of string: string | number | boolean. 
   */
    const updateFlags = (
        vars: dataVars[]
    ): void => {
        (vars || [] ).forEach((entry) => {
            const key = entry.key
            const operation = entry.operation
            const incomingValue = entry.value
            const newValue = castValue(incomingValue);

            // initialize if it doesn't exist
            if (!(key in flags)) {
                console.log(`Initializing ${key} with ${newValue}`);
                flags[key] = newValue;
                if (operation === '=') return;
            }

            const currentValue = flags[key];
            console.log(`Updating ${key}: ${currentValue} -> ${operation} ${newValue}`);

            try {
                switch (operation) {
                    case '=':
                        flags[key] = newValue;
                        break;
                    case '+=':
                        flags[key] = ((currentValue as number) || 0) + (newValue as number);
                        break;
                    case '!':
                        flags[key] = !currentValue;
                        break;
                    case '-=':
                        flags[key] = ((currentValue as number) || 0) - (newValue as number);
                        break;
                    default:
                        console.warn(`Unknown operation: ${operation}`);
                }
            } catch (error) {
                console.error(`Bad Variable Update: ${key}: ${currentValue} -> ${operation} ${newValue}`, error);

            }
        })

    }


    const [displayedJournalEntries, setDisplayedJournalEntries] = useState<JournalNode[]>([])    // list of nodes. should be based on groupID used to keep track of chronological entries

    /**
     * Runs when the game is restarted. NOT WIPED, but restarted.
     * 
     * Should reset all flags
     * Should remove all non-persistant displayed entries
     */
    function restartRun() {
        setFlags({})
        // filter nodes whose persist flag is true
        setDisplayedJournalEntries((prev) => prev.filter((node) => node.persist === true))
    }

    /**
     * RESETS EVERYTHING. Wipes the slate clean
     */
    function resetAll() {
        setFlags({})
        setDisplayedJournalEntries([])
        setFileLoaded(false)
    }

    /**
     * 
     * Extracts the story data from the zip file, and loads it into the global passageMap
     */
    const loadStory = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];   // JSON from editor
        if (!file) { return; }
        try {
            const jsonData = JSON.parse(await file.text())
            // console.log(jsonData);
            const allNodes: Array<any> = jsonData.nodes    // array of node objects Fix typing later
            const edges: Array<any> = jsonData.edges
            console.log(allNodes, edges)
            // Object.entries(jsonData)

            const narrativeMap = new Map<string, any>(allNodes.filter((node) => { return node.type === 'VarSetNode' }).map(
                (node: any) => {
                    const newDataNode: DataNode = {
                        id: node.id,
                        type: node.data.type,    // narrative or action
                        data: node.data
                    }
                    return [node.id, newDataNode]
                }));
            const journalMap = new Map<string, JournalNode>(allNodes.filter((node) => { return node.type === 'JournalEditNode' }).map(
                (node: any) => { return [node.id, node] })
            );
            // edge map is based on sources. get(sourceID) yields an array of Edge objects
            const edgeMap = new Map<string, DataEdge[]>()
            edges.forEach((edge) => {
                const newEdge: DataEdge = {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    data: edge.data
                }
                edgeMap.set(edge.source, [...edgeMap.get(edge.source) || [], newEdge])
            })

            setNodeMap(narrativeMap)
            setJournalMap(journalMap)
            setEdgeMap(edgeMap)
            addPassage('0-001')  // DEBUG AUTO ADD THE FIRST ONE NEED TO FIX ==========================================================================================================
        } catch (error) {
            console.error("Failed to load story nodes from DOCX ", error);
        }

        setFileLoaded(true)
    }


    const bottomRef = useRef<HTMLDivElement>(null);
    const jumpToBottom = () => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }
    useEffect(jumpToBottom, [displayedPassages]);

    return (
        <>
            {/* <Journal
                flags={flags}
                setFlags={setFlags}
                displayedJournalEntries={displayedJournalEntries}
                setDisplayedJournalEntries={setDisplayedJournalEntries}
                journalMap={journalMap}
            ></Journal> */}

            <div id='triColSplit' style={{ display: 'grid', gridTemplateColumns: ' 15vw 70vw 15vw ' }}>
                <div id='leftContent' className='sideCol' style={{}}></div>
                <div id='centerContent'>
                    <div style={{ position: 'fixed', top: 0, right: 0 }}>
                        <button onClick={() => {
                            resetAll()
                        }}>Reset ALL (wipes progress)</button>
                        <button onClick={() => {
                            restartRun()
                            // DOES NOT RESET THE JOURNAL. 
                        }}>Restart Story (keep journal progress) </button>
                        <button onClick={jumpToBottom}> Jump To Bottom </button>
                    </div>
                    {!fileLoaded && <div>
                        <p>
                            Upload your .zip file to begin. It should contain both the .json and the .docx
                        </p>
                        <input type='file' accept='.json' onChange={loadStory}></input>
                    </div>}

                    {
                        // fileLoaded && <DOCXNodeViewer nodes={storyNodes} />
                    }

                    <div>
                        {displayedPassages.map((passageID, index) => (
                            <>
                                {
                                    // should pass it:
                                    // The ID, the Json data, the passage map. The intent is that inside, it looks up passage content on its own.d
                                }
                                <PassageBox
                                    passageID={passageID}
                                    passageMap={nodeMap}
                                    edgeMap={edgeMap}
                                    addPassage={addPassage}
                                    index={index}
                                    flags={flags}
                                    updateFlags={updateFlags}
                                ></PassageBox>
                            </>
                        ))}


                        <div id='bottomRef' ref={bottomRef} style={{ height: '20vh' }} />
                    </div>
                </div>
                <div id='rightContent' className='sideCol' style={{}}></div>
            </div>
        </>
    )
}