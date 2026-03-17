
import React, { useCallback, useRef, useState } from 'react';
import {
    Background,
    ReactFlow,
    useNodesState,
    useEdgesState,
    reconnectEdge,
    addEdge,
    type Connection,
    type NodeMouseHandler,
    Handle,
    Position,
    MarkerType,
    BaseEdge,
    type EdgeProps,
    EdgeLabelRenderer,
    getSmoothStepPath,
    useReactFlow,
    type NodeProps,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { renderAsync } from 'docx-preview';
import { ERROR_NODE, type DataNode, type JournalNode } from '../NodeTypes';


/**
 * Node that can have vars set. Stored in the node's data prop as vars: data.vars
 */
function VarSetNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();

    const currentVars = (data?.vars as Array<{ key: string, value: string }>) || [];
    const updateGlobal = (newVars: Array<{ key: string, value: string }>) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, vars: newVars } };
            }
            return node;
        }));
    };

    const addVar = () => updateGlobal([...currentVars, { key: '', value: '' }]);

    const removeVar = (index: number) => {
        updateGlobal(currentVars.filter((_, i) => i !== index));
    };

    const updateVar = (index: number, field: string, value: string) => {
        const next = [...currentVars];
        next[index] = { ...next[index], [field]: value };
        updateGlobal(next);
    };

    return (
        <div id='VarSetNodeContainer' style={{ backgroundColor: '#fff', borderRadius: '5px', padding: '5px', fontSize: 'x-small' }}>
            <label style={{ color: 'black', }}>{id}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'black' }}>
                {/* <label>Variables Set</label> */}
                {currentVars.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1px' }}>
                        <input
                            className="nodrag"
                            placeholder="Var"
                            value={v.key}
                            onChange={(e) => updateVar(i, 'key', e.target.value)}
                            style={{ width: '60px', fontSize: 'xx-small' }}
                        />
                        <input
                            className="nodrag"
                            placeholder="Value"
                            value={v.value}
                            onChange={(e) => updateVar(i, 'value', e.target.value)}
                            style={{ width: '60px', fontSize: 'xx-small' }}
                        />
                        <button onClick={() => removeVar(i)}>X</button>
                    </div>
                ))}

                <button onClick={addVar} style={{ fontSize: 'xx-small' }}>+ Add Var</button>
            </div>

            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
const edgeTypes = {
    'custom-edge': CustomEdge,
};
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });
    const { setEdges } = useReactFlow();

    const currentVars = (data?.vars as Array<{ key: string, value: string }>) || [];
    const updateGlobal = (newVars: Array<{ key: string, value: string }>) => {
        setEdges((edges) => edges.map((edge) => {
            if (edge.id === id) {
                return { ...edge, data: { ...edge.data, vars: newVars } };
            }
            return edge;
        }));
    };

    const addVar = () => updateGlobal([...currentVars, { key: '', value: '' }]);
    const removeVar = (index: number) => {
        updateGlobal(currentVars.filter((_, i) => i !== index));
    };

    const updateVar = (index: number, field: string, value: string) => {
        const next = [...currentVars];
        next[index] = { ...next[index], [field]: value };
        updateGlobal(next);
    };
    return (
        <>
            <BaseEdge id={id} path={edgePath} />
            <EdgeLabelRenderer>
                <div id='EdgeDependenciesContainer' style={{
                    textAlign: 'left',
                    transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                    pointerEvents: 'all',
                    width: 'min-content',
                    fontSize: 'x-small'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label>Dependencies</label>
                        {currentVars.map((v, i) => (
                            <div key={i} style={{ display: 'flex', gap: '2px' }}>
                                <input
                                    className="nodrag" // Prevents dragging node while typing
                                    placeholder="Var"
                                    value={v.key}
                                    onChange={(e) => updateVar(i, 'key', e.target.value)}
                                    style={{ width: '60px', fontSize: 'inherit' }}
                                />
                                <input
                                    className="nodrag"
                                    placeholder="Value"
                                    value={v.value}
                                    onChange={(e) => updateVar(i, 'value', e.target.value)}
                                    style={{ width: '60px', fontSize: 'inherit' }}
                                />
                                <button onClick={() => removeVar(i)} style={{ padding: '0 4px', cursor: 'pointer' }}>X</button>
                            </div>
                        ))}
                        <button onClick={addVar}>add dependency</button>
                    </div>

                </div>
            </EdgeLabelRenderer>
        </>
    );
}

const nodeTypes = {
    VarSetNode: VarSetNode
}

const initialNodes: {
    id: string;
    data: {
        label: string;
    };
    position: {
        x: number;
        y: number;
    };
}[] = [
        // {
        //     id: '1',
        //     data: { label: 'Node A' },
        //     position: { x: 250, y: 0 },
        // },
        // {
        //     id: '2',
        //     data: { label: 'Node B' },
        //     position: { x: 100, y: 200 },
        // },
        // {
        //     id: '3',
        //     data: { label: 'Node C' },
        //     position: { x: 350, y: 200 },
        // },
    ];

const initialEdges: {
    id: string;
    source: string;
    target: string;
    label: string;
}[] = [];

/**
 * id: 'edge-button',
    source: 'button-1',
    target: 'button-2',
    type: 'buttonedge',
  },
 */
/**
 *  Using React Flow, we can make a node editor in browser to make and edit stories!
 * 
 * NEED: 
 * - local storage so progress isnt reset upon refreshing or crashes
 * - export as json
 * - maybe package DOCX & JSON together finally? node text previewer
 *          - specifically, load docx into the map. Have a list of IDs on the side. on click, preview the text inside, 
 *              have the option to create a node for it or if it exists dont do that
 * 
 * 
 * PLAN: do Varset in the node itself, do dependencies in the edges. Make edges have one way arrows.
 * 
 * create custom node and edge component
 * 
 * When exporting, we can just package everything nicely into a JSON. grab nodes, add next[target, target] from any edge with source = node
 */

export default function StoryEditor() {
    const edgeReconnectSuccessful = useRef(true);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const onConnect = useCallback((params: any) => setEdges((els) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed }, type: 'custom-edge' }, els)), [],);
    const onReconnectStart = useCallback(() => { edgeReconnectSuccessful.current = false; }, []);
    const onReconnect = useCallback((oldEdge: any, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    }, []);
    const onReconnectEnd = useCallback((_: any, edge: { id: string; }) => {
        if (!edgeReconnectSuccessful.current) {
            setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        }
        edgeReconnectSuccessful.current = true;
    }, []);
    const onNodeClick = useCallback<NodeMouseHandler>(
        (_, node) => {
            setSelectedDocxNodeId(node.id)
        },
        [],
    );


    const [fileLoaded, setFileLoaded] = useState(false)
    const [docxNodes, setDocxNodes] = useState<DataNode[]>([]);
    const [selectedDocxNodeId, setSelectedDocxNodeId] = useState<string | null>(null);
    const activeNode = docxNodes.find(n => n.id === selectedDocxNodeId);
    const loadStory = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const ghostDiv: HTMLElement = document.createElement('div');  // temp, used to extract the story content from docx
        const file = event.target.files?.[0];
        if (!file) { return; }
        try {
            const docxFile = file.arrayBuffer()
            if (!docxFile) {
                console.error("ERRO ON FILE LOAD: No .docx file found in the package");
            }
            // load docx into ghostDiv
            await renderAsync(file, ghostDiv);

            // read from the ghostDiv
            const tables = ghostDiv.querySelectorAll('article table');
            const nodeMap = new Map()

            // Everything is based on the Tables get created first, so if there is JSON data for a non-existent table in the DOCX, no DataNode will ever be created
            const tableNodes = Array.from(tables).map((table, index) => {
                const htmlTable = table as HTMLTableElement;
                const rows = Array.from(htmlTable.rows);
                const rawID = rows[0].cells[0].textContent?.trim() || `noIDError|Table-${index}`;


                // slice from index 1 to capture everything after the ID row
                const contentData = rows.slice(1).map(row =>
                    Array.from(row.cells).map(cell => cell.innerHTML)[0]
                );

                const output: DataNode = {
                    ...ERROR_NODE,  // if we cant find anything its just an error
                    id: rawID,
                    data: contentData,
                    rowCount: rows.length,
                };
                nodeMap.set(rawID, output)
                return output;
            });
            setDocxNodes(tableNodes);
            if (tableNodes.length > 0) {
                setSelectedDocxNodeId(tableNodes[0].id);
                setFileLoaded(true);
            }
        } catch (error) {
            console.error("Failed to load story nodes from DOCX ", error);

        }

    }


    return <>
        <div id='StoryEditorBase' style={{
            width: '100vw', height: '100vh',
            display: 'grid', gridTemplateColumns: '300px 1fr 100px',

        }}>
            <div id='left panel' style={{ display: 'grid', gridTemplateRows: '50vh 50vh', }}>
                <div style={{ overflow: 'scroll' }}>
                    {!fileLoaded ? <div>
                        <p>
                            Upload your story docx here!
                        </p>
                        <input type='file' accept='.docx' onChange={loadStory}></input>
                    </div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <h3>Nodes ({docxNodes.length})</h3>
                            {docxNodes.map(node => (
                                <button
                                    key={node.id}
                                    onClick={() => setSelectedDocxNodeId(node.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedDocxNodeId === node.id ? '#444' : 'transparent',
                                        border: '1px solid #555',
                                        color: 'white',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {node.id}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    Preview:
                    {fileLoaded &&
                        <div style={{ textAlign: 'left', padding: '1em' }} dangerouslySetInnerHTML={{ __html: activeNode?.data || 'ERROR no data found' }} />

                    }
                    {/* <button onClick={() => {
                        setNodes((prev) => {
                            const newNode = {
                                id: activeNode?.id || 'ERROR',
                                data: {
                                    label: activeNode?.id || 'ERROR'
                                },
                                position: { x: 250, y: 0 },
                            }
                            return [...prev, newNode]
                        })
                    }}> Click to add as Node </button> */}
                    <button onClick={() => {
                        setNodes((prev) => {
                            const newNode = {
                                id: activeNode?.id || 'ERROR',
                                data: {
                                    label: activeNode?.id || 'ERROR'
                                },
                                position: { x: 250, y: 0 },
                                type: 'VarSetNode'
                            }
                            return [...prev, newNode]
                        })
                    }}> Click to add as VarSetNode </button>
                </div>
            </div>
            <ReactFlow style={{ color: '#242424ff', backgroundColor: '#616161ff' }}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(onNodeClick)}
                snapToGrid
                onReconnect={onReconnect}
                onReconnectStart={onReconnectStart}
                onReconnectEnd={onReconnectEnd}
                onConnect={onConnect}
                fitView
                attributionPosition="top-right"
            >
                <Background />
            </ReactFlow>
            <div> right side
                <button onClick={() => {
                    console.log(nodes, edges);
                }}> click to export </button>

            </div>
        </div>


    </>
}