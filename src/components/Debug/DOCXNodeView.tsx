
export default function DOCXNodeViewer({ nodes }: { nodes: any[] }) {

  // {
  //   id: data[0],
  //     html: htmlTable.outerHTML,
  //       data: data, // Your "clean" data for logic
  //         rowCount: htmlTable.rows.length
  // };

  return (
    <div style={{ padding: '20px', color: '#ffd900ff' }}>
      <h2>Story Debugger</h2>
      <p>Total Nodes Found: {nodes.length}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {nodes.map((node, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              position: 'relative'
            }}
          >
            <span style={{fontSize: '10px',color: '#68c7caff',position: 'absolute',top: '2px',right: '5px'}}>
              ID: {node.id} | Rows: {node.rowCount}
            </span>

            {/* The Actual Content */}
            <div dangerouslySetInnerHTML={{ __html: node.data[0] }} />
            <div dangerouslySetInnerHTML={{ __html: node.data[1] }} />
          </div>
        ))}
      </div>
    </div>
  );
};