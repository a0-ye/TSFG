import { useEffect, useRef, useState } from 'react'


import { type DataEdge, type DataNode, type JournalNode, } from '../ViewerTypes'
import PassageBox from '../PassageBox/PassageBox'
import { castValue, type dataVars, type FlagValue } from '../utils'
import Journal from '../Journal/Journal'




export default function StoryViewer() {
    /**
     * TODO:
     * Passage Event System ? what does this even mean? Sound triggers. visual triggers. Timer triggers? Events should be on Passage Load.
     * replace Map usage with Record<T,T>()
     */


    const [displayedPassages, setDisplayedPassages] = useState<DataNode[]>([])  // An array of DataNodes to display
    const addPassage = (node: DataNode) => {
        setDisplayedPassages((prevPassages) => {
            console.log('adding', node);
            
            return [...prevPassages, node]
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
        (vars || []).forEach((entry) => {
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

    // list of nodes. should be based on groupID used to keep track of chronological entries
    const [displayedJournalEntries, setDisplayedJournalEntries] = useState<JournalNode[]>([])

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

            const allNodes: Array<any> = jsonData.nodes    // array of node objects Fix typing later
            const edges: Array<any> = jsonData.edges
            console.log(allNodes, edges)
            // Object.entries(jsonData)

            const narrativeMap = new Map<string, any>(allNodes.filter((node) => { return node.type === 'VarSetNode' }).map(
                (node: any) => {
                    // console.log(node);

                    const filteredVars = (node.data.vars || []).filter(({ key, operation, value }: { key: string, operation: string, value: string }) => {
                        return key != '' && operation != '' && value != ''
                    })
                    const newDataNode: DataNode = {
                        id: node.id,
                        type: node.data.type,    // narrative or action
                        data: { ...node.data, vars: filteredVars }
                    }
                    return [node.id, newDataNode]
                }));
            const journalMap = new Map<string, JournalNode>(allNodes.filter((node) => { return node.type === 'JournalEditNode' }).map(
                (node: any) => { return [node.id, node] })
            );
            // edge map is based on sources. get(sourceID) yields an array of Edge objects
            const edgeMap = new Map<string, DataEdge[]>()
            edges.forEach((edge) => {
                const filteredVars = (edge.data?.vars || []).filter(({ key, operation, value }: { key: string; operation: string; value: string | number; }) => {
                    return key != '' && operation != '' && value != ''
                })
                const newEdge: DataEdge = {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    data: {...edge.data, vars:filteredVars}
                }
                edgeMap.set(edge.source, [...edgeMap.get(edge.source) || [], newEdge])
            })

            setNodeMap(narrativeMap)
            setEdgeMap(edgeMap)

            const walkGroupPriority = (node: JournalNode, groupID: string, priority: number) => {
                node.groupID = groupID
                node.priority = priority
                const nodeEdge = edgeMap.get(node.id)

                if (nodeEdge && nodeEdge.length > 0) {
                    walkGroupPriority(journalMap.get(nodeEdge[0].target) as JournalNode, groupID, priority + 1)
                }
            }

            // NOTE: this can be calculated in the editor, using node connection calculations. IDK how to but it should be a better way than this...
            // walk from nodes that are NOT targets (aka SOURCE nodes only) 
            const targets = new Set(edges.map(e => e.target));
            journalMap.forEach((jNode) => {
                if (!targets.has(jNode.id)) {
                    walkGroupPriority(jNode, `${jNode.id}-Group`, 0);
                }
                const filteredVars = (jNode.data.vars || []).filter(({ key, operation, value }: { key: string; operation: string; value: string | number; }) => {
                    return key != '' && operation != '' && value != ''
                })
                jNode.data['vars'] = filteredVars
            });
            setJournalMap(journalMap)
            addPassage( narrativeMap.get((edgeMap.get('START') as DataEdge[])[0].target) as DataNode ) // Start should be guraranteed to exist
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
            <Journal
                flags={flags}
                setFlags={setFlags}
                displayedJournalEntries={displayedJournalEntries}
                setDisplayedJournalEntries={setDisplayedJournalEntries}
                journalMap={journalMap}
            ></Journal>

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
                        {displayedPassages.map((node, index) => (
                            <>
                                {
                                    // should pass it:
                                    // The ID, the Json data, the passage map. The intent is that inside, it looks up passage content on its own.d
                                }
                                <PassageBox
                                    node={node}
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