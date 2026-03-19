
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
    MarkerType,
    type ReactFlowInstance,
    type Edge,
    type Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { renderAsync } from 'docx-preview';
import { VarSetNode, DependencyEdge, JournalEditNode } from './FlowNodes';



const nodeTypes = {
    VarSetNode: VarSetNode,
    JournalEditNode: JournalEditNode
}
const edgeTypes = {
    DependencyEdge: DependencyEdge,
};

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
 * 
 * 
 * When exporting, we can just package everything nicely into a JSON. grab nodes, add next[target, target] from any edge with source = node
 */

export default function StoryEditor() {
    const edgeReconnectSuccessful = useRef(true);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance<any, any> | null>(null);

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => {
            // 1. Look up the source node to see what "kind" of node is starting the connection
            const sourceNode = nodes.find((node) => { return node.id === params.source });

            let edgeType = 'DependencyEdge';
            let markerStyle = MarkerType.ArrowClosed;

            // 3. Conditional Logic: If the source is your "Second Type", change the edge
            if (sourceNode?.type === 'JournalEditNode') {
                edgeType = 'default'; // Your other custom edge component
                markerStyle = MarkerType.Arrow; // Maybe a different arrow head?
            }
            const newEdge: Edge = {
                ...params,
                id: `e${params.source}-${params.target}`,
                type: edgeType,
                markerEnd: { type: markerStyle },
            };
            return addEdge(
                newEdge,
                eds
            );
        });
    }, [setEdges]);
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

    const [flowKey, setFlowKey] = useState('default')
    const onSave = useCallback(() => {
        if (rfInstance) {
            if (localStorage.getItem(flowKey)) {
                localStorage.removeItem(flowKey);
            }
            const flow = rfInstance.toObject();
            localStorage.setItem(flowKey, JSON.stringify(flow));
            alert(` Saved as "${flowKey}" in browser local storage`)
        } else {
            console.log('no rf instance?');

        }
    }, [rfInstance, flowKey]);

    const onRestore = useCallback(() => {
        if (!localStorage.getItem(flowKey)) {
            alert(`save data ${flowKey} not found!`)
            return
        }
        const restoreFlow = async () => {
            const flow = JSON.parse(localStorage.getItem(flowKey) || '');

            if (flow) {
                // const { x = 0, y = 0, zoom = 1 } = flow.viewport;
                console.log(flow);

                setNodes(flow.nodes || []);
                setEdges(flow.edges || []);
            }
            alert(`loaded save data "${flowKey}"`)
        };

        restoreFlow();
    }, [setNodes, flowKey]);

    const onExport = () => {
        const saveData = localStorage.getItem(flowKey);

        if (!saveData) {
            alert("No data found!");
            return;
        }
        const blob = new Blob([saveData], { type: 'application/json' });

        // 3. Create a hidden link and click it programmatically
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${flowKey}${new Date().toISOString().slice(0, 10)}.json`;

        document.body.appendChild(link);
        link.click();

        // 4. Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    const onImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const flow = JSON.parse(e.target?.result as string);
                if (flow) {
                    setNodes(flow.nodes || []);
                    setEdges(flow.edges || []);
                    if (flow.viewport) {
                        rfInstance?.setViewport(flow.viewport, { duration: 1000 });
                    }
                }
            } catch (err) {
                alert("Invalid JSON file!");
            }
        };
        reader.readAsText(file);
    };


    const [fileLoaded, setFileLoaded] = useState(false)
    const [docxNodes, setDocxNodes] = useState<any[]>([]);
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

                const output = {
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
            display: 'flex',          // Changed to Flex
            overflow: 'hidden',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
        }}>
            <div id='left-panel' style={{ display: 'grid', gridTemplateRows: '50vh 50vh', maxWidth:300 }}>
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
                <div style={{ overflow: 'scroll' }}>
                    <button onClick={() => {
                        if (!rfInstance || !activeNode) return;
                        const domNode = document.querySelector('.react-flow');
                        if (!domNode) return;
                        const { left, top, width, height } = domNode.getBoundingClientRect();
                        const center = rfInstance.screenToFlowPosition({
                            x: left + width / 2,
                            y: top + height / 2,
                        });
                        setNodes((prev) => {
                            const newNode = {
                                id: activeNode?.id || 'ERROR',
                                data: {
                                    label: activeNode?.id || 'ERROR',
                                    content: [...activeNode?.data || ''],   // create a shallow copy of the HTML data array
                                    type: 'narration', // default narration. This type is the data portion for story rendering vs the type for ReactFlow
                                    vars: [],
                                    transition: {
                                        auto: false,
                                        delayAuto: 1,
                                        duration: 1,
                                        startDelay: 0,
                                    }
                                },
                                position: center,
                                type: 'VarSetNode'
                            }
                            return [...prev, newNode]
                        })
                    }}> Click to add as VarSetNode </button>
                    <button onClick={() => {
                        if (!rfInstance || !activeNode) return;
                        const domNode = document.querySelector('.react-flow');
                        if (!domNode) return;
                        const { left, top, width, height } = domNode.getBoundingClientRect();
                        const center = rfInstance.screenToFlowPosition({
                            x: left + width / 2,
                            y: top + height / 2,
                        });
                        setNodes((prev) => {
                            const newNode = {
                                id: activeNode?.id || 'ERROR',
                                data: {
                                    label: activeNode?.id || 'ERROR',
                                    content: [...activeNode?.data || ''],   // create a shallow copy of the HTML data array
                                    persist: false,
                                    vars: []
                                },
                                position: center,
                                type: 'JournalEditNode'
                            }
                            return [...prev, newNode]
                        })
                    }}> Click to add as Journal Node </button>
                    {fileLoaded &&
                        <div style={{ textAlign: 'left', padding: '1em' }} dangerouslySetInnerHTML={{ __html: activeNode?.data || 'ERROR no data found' }} />
                    }
                </div>
            </div>
            <div id='center-panel'
                style={{
                    position: 'relative',
                    display: 'flex', width: '100%', height: '100%'
                }}
            >
                <ReactFlow style={{ color: '#242424ff', backgroundColor: '#616161ff' }}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={(onNodeClick)}
                    onInit={setRfInstance}
                    onReconnect={onReconnect}
                    onReconnectStart={onReconnectStart}
                    onReconnectEnd={onReconnectEnd}
                    onConnect={onConnect}
                    snapToGrid
                    fitView
                    attributionPosition="top-right"
                >
                    <Background />
                </ReactFlow>
            </div>
            <div id='right-panel' style={{ padding: '1em', textAlign: 'left', maxWidth:250 }}>
                <label> Loaded File: {flowKey}</label>
                <input placeholder='Save Name' defaultValue={'default'} onChange={(e) => {

                    setFlowKey(e.target.value == '' ? 'default' : e.target.value)
                }} />
                <button onClick={onSave}>Save</button>
                <button onClick={onRestore}>Load</button>
                <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} id="import-json" />
                <button onClick={() => document.getElementById('import-json')?.click()}>Import File</button>
                <button onClick={onExport}> click to export </button>
                {localStorage.getItem(flowKey) ? <div> save with that name exists!</div> : <div> no data found for that save name</div>
                }

            </div>
        </div>


    </>
}