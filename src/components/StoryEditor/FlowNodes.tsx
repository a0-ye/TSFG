import { type NodeProps, useReactFlow, NodeToolbar, Position, Handle, type EdgeProps, getSmoothStepPath, BaseEdge, EdgeToolbar, EdgeLabelRenderer } from "@xyflow/react";
import { useState } from "react";



type varSet = { key: string, operation: string, value: string, persist: boolean }

/**
 * Node that can have vars set. Stored in the node's data prop as vars: data.vars
 */
export function VarSetNode({ id, data, selected }: NodeProps) {
    const { setNodes, deleteElements, updateNodeData } = useReactFlow();
    const currentVars = (data?.vars as Array<varSet>) || [];

    const narrationColor = '#fff'
    const actionColor = '#b2ffe8ff'
    const [nodeColor, setNodeColor] = useState(narrationColor)
    /**
     * updates the global node.data.vars
     */
    const updateNodeDataVars = (newVars: Array<varSet>) => {
        // setNodes((nds) => nds.map((node) => {
        //     if (node.id === id) {
        //         return { ...node, data: { ...node.data, vars: newVars } };
        //     }
        //     return node;
        // }));
        updateNodeData(id, { vars: newVars })
    };
    const addVar = () => updateNodeDataVars([...currentVars, { key: '', operation: '=', value: '', persist: false }]);
    const removeVar = (index: number) => {
        updateNodeDataVars(currentVars.filter((_, i) => i !== index));
    };
    const updateVar = (index: number, field: string, value: string) => {
        const next = [...currentVars];
        next[index] = { ...next[index], [field]: value };
        updateNodeDataVars(next);
    };

    const deleteNode = () => {
        deleteElements({ nodes: [{ id }] });
    }

    const updateType = (newType: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, type: newType } };
            }
            return node;
        }));
    }
    /**
     * transition: {
            auto:false,
            duration:1,
            startDelay:0,
            }
     * 
     */
    const updateTransition = (field: string, newValue: string | boolean) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                // console.log(`updating node ${id} transition with ${field}:${newValue} `);

                const newTransition = {
                    ...(node.data.transition as {
                        auto: boolean,
                        duration: number,
                        startDelay: number,
                    }), [field]: newValue
                }
                return { ...node, data: { ...node.data, transition: newTransition } };
            }
            return node;
        }));
    }
    return (
        <div id='VarSetNodeContainer'
            style={{ backgroundColor: nodeColor, borderRadius: '5px', padding: '5px', fontSize: 'small' }}>
            <NodeToolbar
                isVisible={selected}
                position={Position.Right}
                align={'center'}
                style={{ alignContent: 'left' }}
            >
                <div id='Config Panel'
                    style={{
                        backgroundColor: '#59597cff', color: '#fff', borderRadius: '5px',
                        width: '200px',
                        minHeight: '100px'

                    }}
                >
                    Config panel. Change Type, configure auto transition + delay & duration. Other options you might want
                    <br />
                    <input type="radio" name='type' id='narration' value={'narration'} defaultChecked
                        onChange={(e) => {
                            updateType(e.target.value)
                            setNodeColor(narrationColor)
                        }}
                    />
                    <label htmlFor="narration">Narration</label>
                    <input type="radio" name='type' id='action' value={'action'}
                        onChange={(e) => {
                            updateType(e.target.value)
                            setNodeColor(actionColor)
                        }}
                    />
                    <label htmlFor="action">Action</label>
                    <br />
                    <input id='doAuto' type='checkbox' onChange={(e) => updateTransition('auto', e.target.checked)} />
                    <label htmlFor='doAuto'  >Auto Transition?</label>
                    <br />
                    <span>duration</span>
                    <input type='text' onChange={(e) => updateTransition('duration', e.target.value)} />
                    <span>startDelay</span>
                    <input type='text' onChange={(e) => updateTransition('startDelay', e.target.value)} />

                </div>
                <button onClick={addVar} style={{ fontSize: 'xx-small' }}>+ Add Var</button>
                <input type='color' defaultValue={nodeColor} value={nodeColor} onChange={(e) => {
                    setNodeColor(e.target.value)
                }} /> Node Color
            </NodeToolbar>
            <NodeToolbar
                isVisible={selected}
                position={Position.Left}
                align={'center'}
                style={{}}
            >
                <button onClick={deleteNode} style={{ fontSize: 'x-small', backgroundColor: '#ffa3a3ff' }}>Delete Node</button>
            </NodeToolbar>
            <label style={{ color: 'black', }}>{id}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'black' }}>
                {/* <label>Variables Set</label> */}
                {currentVars.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1px' }}>
                        <div >
                            <label style={{ fontSize: 'xx-small' }}> persist? </label>
                            <br />
                            <input
                                type='checkbox'
                                name='persist'
                                defaultChecked={v.persist}
                                onChange={(e) => updateVar(i, 'persist', e.target.value)} />
                        </div>
                        <input
                            className="nodrag"
                            placeholder="Var"
                            value={v.key}
                            onChange={(e) => updateVar(i, 'key', e.target.value)}
                            style={{ width: '60px', fontSize: 'xx-small' }}
                        />
                        <select
                            id="opSelect"
                            name="op"
                            onChange={(e) => updateVar(i, 'operation', e.target.value)}
                            defaultValue={v.operation}
                        >
                            <option value="=">=</option>
                            <option value="+=">++</option>
                            <option value="-=">--</option>
                        </select>
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

            </div>

            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

/**
 * 
 * Dependencies
 * GroupID
 * Priority
 * 
 * 
 */
export function JournalEditNode({ id, data, selected }: NodeProps) {
    const { deleteElements, updateNodeData } = useReactFlow();
    const currentVars = (data?.vars as Array<varSet>) || [];
    const journalColor = '#c4b094ff'
    const [nodeColor, setNodeColor] = useState(journalColor)
    /**
     * updates the global node.data.vars
     */
    const updateNodeDataVars = (newVars: Array<varSet>) => {
        // setNodes((nds) => nds.map((node) => {
        //     if (node.id === id) {
        //         return { ...node, data: { ...node.data, vars: newVars } };
        //     }
        //     return node;
        // }));

        updateNodeData(id, { vars: newVars })
    };
    const addVar = () => updateNodeDataVars([...currentVars, { key: '', operation: '=', value: '', persist: false }]);
    const removeVar = (index: number) => {
        updateNodeDataVars(currentVars.filter((_, i) => i !== index));
    };
    const updateVar = (index: number, field: string, value: string) => {
        const next = [...currentVars];
        next[index] = { ...next[index], [field]: value };
        updateNodeDataVars(next);
    };

    const deleteNode = () => {
        deleteElements({ nodes: [{ id }] });
    }

    return (
        <div id='JournalEditContianer'
            style={{ backgroundColor: nodeColor, borderRadius: '5px', padding: '5px', fontSize: 'small' }}>
            <NodeToolbar
                isVisible={selected}
                position={Position.Right}
                align={'center'}
                style={{ alignContent: 'left' }}
            >
                <div id='Config Panel'
                    style={{
                        backgroundColor: '#59597cff', color: '#fff', borderRadius: '5px',
                        width: '200px',
                        minHeight: '100px'

                    }}
                >
                    Config panel. not sure what is needed here

                </div>
                <button onClick={addVar} style={{ fontSize: 'xx-small' }}>+ Add Var</button>
                <input type='color' defaultValue={nodeColor} value={nodeColor} onChange={(e) => {
                    setNodeColor(e.target.value)
                }} /> Node Color
            </NodeToolbar>
            <NodeToolbar
                isVisible={selected}
                position={Position.Left}
                align={'center'}
                style={{}}
            >
                <button onClick={deleteNode} style={{ fontSize: 'x-small', backgroundColor: '#ffa3a3ff' }}>Delete Node</button>
            </NodeToolbar>
            <label style={{ color: 'black', }}>{id}</label>

            <div style={{ borderBottom: 'black solid 2px' }}>
                <label>Group ID </label>
                <input placeholder="GroupID " onChange={(e) => { e.target.value }} /> <br />
                <label>Priority </label>
                <input placeholder="Prioirty " onChange={(e) => { e.target.value }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'black' }}>
                {/* <label>Variables Set</label> */}
                {currentVars.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: '2px' }}>
                        <input
                            className="nodrag" // Prevents dragging node while typing
                            placeholder="Var"
                            value={v.key}
                            onChange={(e) => updateVar(i, 'key', e.target.value)}
                            style={{ width: '60px', fontSize: 'inherit' }}
                        />
                        <select
                            id="opSelect"
                            name="op"
                            onChange={(e) => updateVar(i, 'operation', e.target.value)}
                            defaultValue={v.operation}
                        >
                            <option value="==">==</option>
                            <option value="<"> &#60; </option>
                            <option value="<=">&#60;= </option>
                            <option value=">">&#62;</option>
                            <option value=">=">&#62;=</option>
                        </select>
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
                <Handle type="target" position={Position.Top} />
                <Handle type="source" position={Position.Bottom} />

            </div>

        </div>
    );
}


type varDep = { key: string, operation: string, value: string }

export function DependencyEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, selected, data }: EdgeProps) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });
    const { updateEdgeData } = useReactFlow();

    const currentVars = (data?.vars as Array<varDep>) || [];
    const updateGlobal = (newVars: Array<varDep>) => {
        // setEdges((edges) => edges.map((edge) => {
        //     if (edge.id === id) {
        //         return { ...edge, data: { ...edge.data, vars: newVars } };
        //     }
        //     return edge;
        // }));
        updateEdgeData(id, { vars: newVars })
    };

    const addVar = () => updateGlobal([...currentVars, { key: '', operation: '==', value: '' }]);
    const removeVar = (index: number) => {
        updateGlobal(currentVars.filter((_, i) => i !== index));
    };

    const updateVar = (index: number, field: string, value: string) => {
        const next = [...currentVars];
        next[index] = { ...next[index], [field]: value };
        updateGlobal(next);
    };

    const hasDependencies = currentVars.length > 0
    return (
        <>
            <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />

            <EdgeLabelRenderer>
                <EdgeToolbar
                    isVisible={selected}
                    edgeId={id}
                    x={labelX + 150}
                    y={labelY}
                    // position={Position.Top}
                    // align={'center'}
                    style={{}}
                >
                    <button onClick={addVar} style={{ fontSize: 'xx-small' }}>+ add Dependency</button>

                </EdgeToolbar>
                <div id='EdgeDependenciesContainer' style={{
                    position: 'absolute',
                    textAlign: 'left',
                    transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                    pointerEvents: 'all',
                    width: 'min-content',
                    fontSize: 'x-small',
                }}>
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '4px',
                        backgroundColor: hasDependencies ? "#ffffffff" : 'transparent',
                        borderRadius: 5, padding: '0.5em'
                    }}>
                        {hasDependencies && <label>Dependencies</label>}
                        {currentVars.map((v, i) => (
                            <div key={i} style={{ display: 'flex', gap: '2px' }}>
                                <input
                                    className="nodrag" // Prevents dragging node while typing
                                    placeholder="Var"
                                    value={v.key}
                                    onChange={(e) => updateVar(i, 'key', e.target.value)}
                                    style={{ width: '60px', fontSize: 'inherit' }}
                                />
                                <select
                                    id="opSelect"
                                    name="op"
                                    onChange={(e) => updateVar(i, 'operation', e.target.value)}
                                    defaultValue={v.operation}
                                >
                                    <option value="==">==</option>
                                    <option value="!=">!=</option>
                                    <option value="<"> &#60; </option>
                                    <option value="<=">&#60;= </option>
                                    <option value=">">&#62;</option>
                                    <option value=">=">&#62;=</option>
                                </select>
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
                    </div>

                </div>
            </EdgeLabelRenderer>
        </>
    );
}