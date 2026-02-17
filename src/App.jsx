import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ZoomIn,
  ZoomOut,
  Move,
  MapPin,
  Network,
  MousePointer2
} from 'lucide-react';
import './App.css';

function App() {
  const [floorData, setFloorData] = useState({
    id: uuidv4(),
    name: "Ground floor",
    level: 0,
    nodes: []
  });

  const [imageSrc, setImageSrc] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [usePercentage, setUsePercentage] = useState(true);

  // Transform and Mode State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [mode, setMode] = useState('select'); // 'select', 'pan', 'node', 'connect'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Connection state
  const [connectionStartNodeId, setConnectionStartNodeId] = useState(null);

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setTransform({ x: 0, y: 0, scale: 1 }); // Reset zoom
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Zoom & Pan Logic ---

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleSensitivity = 0.001; // Scale speed
    const newScale = Math.min(Math.max(transform.scale + -e.deltaY * scaleSensitivity * transform.scale, 0.1), 10);

    // Calculate mouse position relative to container
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Adjust transition to zoom towards mouse
    const scaleRatio = newScale / transform.scale;
    const newX = x - (x - transform.x) * scaleRatio;
    const newY = y - (y - transform.y) * scaleRatio;

    setTransform({
      scale: newScale,
      x: newX,
      y: newY
    });
  };

  const startPan = (e) => {
    if (mode === 'pan' || (e.button === 1) || (e.shiftKey)) { // Middle mouse or Shift+Drag or Pan mode
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const doPan = (e) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }

    // Update mouse pos for status bar (needs unprojection)
    if (imageRef.current && containerRef.current) {
      // Project back to image coordinates
      // screenX = imageX * scale + transformX
      // imageX = (screenX - transformX) / scale

      const rect = containerRef.current.getBoundingClientRect();
      const mouseXRel = e.clientX - rect.left;
      const mouseYRel = e.clientY - rect.top;

      const imgRect = imageRef.current.getBoundingClientRect();
      // We can't use imgRect directly because it's transformed. 
      // But we know the origin is at transform x,y inside container? Not exactly if centered.
      // Actually simpler:
      // The click calculation below handles unprojection. Reuse that logic or similar.

      const rawX = (mouseXRel - transform.x) / transform.scale;
      const rawY = (mouseYRel - transform.y) / transform.scale;

      const imgWidth = imageRef.current.offsetWidth;
      const imgHeight = imageRef.current.offsetHeight;

      // Inverted Y for bottom-left origin
      const finalX = rawX;
      const finalY = imgHeight - rawY;

      if (usePercentage) {
        const px = (finalX / imgWidth) * 100;
        const py = (finalY / imgHeight) * 100;
        setMousePos({ x: px.toFixed(2), y: py.toFixed(2) });
      } else {
        setMousePos({ x: Math.round(finalX), y: Math.round(finalY) });
      }
    }
  };

  const endPan = () => {
    setIsDragging(false);
  };

  // --- Map Click / Node Creation ---

  const handleContainerClick = (e) => {
    // If dragging or panning happened, don't trigger click
    if (isDragging) return;

    if (mode === 'node' && imageRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Unproject
      const rawX = (clickX - transform.x) / transform.scale;
      const rawY = (clickY - transform.y) / transform.scale;

      // Bounds check
      const imgWidth = imageRef.current.offsetWidth;
      const imgHeight = imageRef.current.offsetHeight;

      if (rawX < 0 || rawX > imgWidth || rawY < 0 || rawY > imgHeight) return;

      // Calculate bottom-left origin
      const finalXBase = rawX;
      const finalYBase = imgHeight - rawY;

      let finalX = finalXBase;
      let finalY = finalYBase;

      if (usePercentage) {
        finalX = (finalXBase / imgWidth) * 100;
        finalY = (finalYBase / imgHeight) * 100;
        finalX = Math.round(finalX * 100) / 100;
        finalY = Math.round(finalY * 100) / 100;
      } else {
        finalX = Math.round(finalX);
        finalY = Math.round(finalY);
      }

      const newNode = {
        nodeId: uuidv4(),
        name: `Node ${floorData.nodes.length + 1}`,
        type: "room",
        coordinates: {
          x: finalX,
          y: finalY,
          floor: floorData.id
        },
        connections: []
      };

      setFloorData(prev => ({
        ...prev,
        nodes: [...prev.nodes, newNode]
      }));
      setSelectedNodeId(newNode.nodeId);

      // Reset to select mode after adding? Or keep adding? 
      // Keep adding is better for batch work.
    }
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation(); // don't trigger container click

    if (mode === 'connect') {
      if (!connectionStartNodeId) {
        setConnectionStartNodeId(nodeId);
      } else {
        // Create connection
        if (connectionStartNodeId === nodeId) {
          setConnectionStartNodeId(null); // Deselect if clicking same
          return;
        }
        createConnection(connectionStartNodeId, nodeId);
        setConnectionStartNodeId(null); // Reset after connection
      }
    } else {
      // Select mode
      setSelectedNodeId(nodeId);
      setConnectionStartNodeId(null);
    }
  };

  // --- Connection Logic ---

  const createConnection = (id1, id2) => {
    const node1 = floorData.nodes.find(n => n.nodeId === id1);
    const node2 = floorData.nodes.find(n => n.nodeId === id2);
    if (!node1 || !node2) return;

    // Calculate distance
    // We need consistent units. 
    // If percentage, distance is percentage 'units'. If pixels, pixels.
    // Usually pixels are better for 'distance', but we store what we have.
    // Let's calculate Euclidean distance based on the stored coordinates.
    const dx = node2.coordinates.x - node1.coordinates.x;
    const dy = node2.coordinates.y - node1.coordinates.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const roundedDist = Math.round(dist * 100) / 100;

    // Update both nodes
    setFloorData(prev => {
      const newNodes = prev.nodes.map(n => {
        if (n.nodeId === id1) {
          // Check if already connected
          if (n.connections.some(c => c.nodeId === id2)) return n;
          return {
            ...n,
            connections: [...n.connections, { nodeId: id2, distance: roundedDist }]
          };
        }
        if (n.nodeId === id2) {
          if (n.connections.some(c => c.nodeId === id1)) return n;
          return {
            ...n,
            connections: [...n.connections, { nodeId: id1, distance: roundedDist }]
          };
        }
        return n;
      });
      return { ...prev, nodes: newNodes };
    });
  };

  const getNodePositionStyle = (node) => {
    // Return absolute style for display
    // BUT for nodes inside the Zoom Container, we position relative to the image size.
    // This helper is for CSS placement.
    // If we use pixels, simple. If percentage, simple.
    // X = left, Y = bottom.
    return {
      left: usePercentage ? `${node.coordinates.x}%` : `${node.coordinates.x}px`,
      bottom: usePercentage ? `${node.coordinates.y}%` : `${node.coordinates.y}px`,
      position: 'absolute'
    };
  };

  // Render lines between connected nodes
  const renderConnections = () => {
    // We need to map connections to SVG lines.
    // To avoid duplicates, we can store a set of pairs.
    const renderedPairs = new Set();
    const lines = [];

    floorData.nodes.forEach(node => {
      node.connections.forEach(conn => {
        const pairKey = [node.nodeId, conn.nodeId].sort().join('-');
        if (renderedPairs.has(pairKey)) return;
        renderedPairs.add(pairKey);

        const targetNode = floorData.nodes.find(n => n.nodeId === conn.nodeId);
        if (!targetNode) return;

        // Coords are bottom-left based. SVG needs top-left.
        // We need to invert Y for drawing.
        // x stays x. y = 100 - y (if %) or height - y (if px, handled by SVG viewport?)
        // Easiest is to set SVG coordinate system to 100x100 if % or widthxheight if px?
        // Let's stick to % for SVG if using %.

        const x1 = node.coordinates.x;
        const y1 = usePercentage ? (100 - node.coordinates.y) : (imageRef.current ? imageRef.current.offsetHeight - node.coordinates.y : 0);

        const x2 = targetNode.coordinates.x;
        const y2 = usePercentage ? (100 - targetNode.coordinates.y) : (imageRef.current ? imageRef.current.offsetHeight - targetNode.coordinates.y : 0);

        lines.push(
          <line
            key={pairKey}
            x1={usePercentage ? `${x1}%` : x1}
            y1={usePercentage ? `${y1}%` : y1}
            x2={usePercentage ? `${x2}%` : x2}
            y2={usePercentage ? `${y2}%` : y2}
            stroke="#bb86fc"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
        );
      });
    });
    return lines;
  };

  const updateNode = (id, field, value) => {
    setFloorData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.nodeId === id ? { ...node, [field]: value } : node
      )
    }));
  };

  const deleteNode = (id) => {
    setFloorData(prev => ({
      ...prev,
      nodes: prev.nodes
        .filter(n => n.nodeId !== id)
        .map(node => ({
          ...node,
          connections: node.connections.filter(c => c.nodeId !== id)
        }))
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const selectedNode = floorData.nodes.find(n => n.nodeId === selectedNodeId);

  return (
    <div className="app-container">
      <div className="left-panel">
        <header>
          <h1>Floor Map Node Maker</h1>
          <div className="toolbar">
            <button
              className={`tool-btn ${mode === 'select' ? 'active' : ''}`}
              onClick={() => setMode('select')}
              title="Select Mode"
            >
              <MousePointer2 size={18} />
            </button>
            <button
              className={`tool-btn ${mode === 'node' ? 'active' : ''}`}
              onClick={() => setMode('node')}
              title="Add Node Mode"
            >
              <MapPin size={18} />
            </button>
            <button
              className={`tool-btn ${mode === 'connect' ? 'active' : ''}`}
              onClick={() => setMode('connect')}
              title="Connect Mode"
            >
              <Network size={18} />
            </button>
            <div className="divider" />
            <button
              className={`tool-btn ${mode === 'pan' ? 'active' : ''}`}
              onClick={() => setMode('pan')}
              title="Pan Tool (or Hold Space)"
            >
              <Move size={18} />
            </button>
            <button className="tool-btn" onClick={() => setTransform(t => ({ ...t, scale: t.scale + 0.2 }))}><ZoomIn size={18} /></button>
            <button className="tool-btn" onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.1, t.scale - 0.2) }))}><ZoomOut size={18} /></button>
            <button className="tool-btn text-btn" onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}>Reset</button>
          </div>

          <div className="flex-spacer"></div>

          <div className="controls">
            <label className="toggle">
              <input
                type="checkbox"
                checked={usePercentage}
                onChange={e => setUsePercentage(e.target.checked)}
              />
              % Coords
            </label>
          </div>
        </header>

        <div
          className={`canvas-area ${mode === 'pan' || isDragging ? 'grabbing' : ''}`}
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={startPan}
          onMouseMove={doPan}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onClick={handleContainerClick}
        >
          {!imageSrc ? (
            <div className="upload-placeholder">
              <label htmlFor="file-upload" className="upload-btn">
                <span>Upload Floor Map Image</span>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
              <p className="hint">Supports PNG, JPG, SVG</p>
            </div>
          ) : (
            <div
              className="transform-wrapper"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: '0 0'
              }}
            >
              <div className="image-wrapper">
                <img src={imageSrc} ref={imageRef} alt="Floor Map" draggable={false} />

                {/* SVG Overlay for Connections */}
                <svg className="connections-overlay">
                  {renderConnections()}
                  {/* Draw temporary line for connection mode? */}
                  {mode === 'connect' && connectionStartNodeId && mousePos && (
                    // This is tricky because mousePos is global coords, we need local start coords
                    // Let's skip drag line for now to keep it simple, just highlight start node
                    null
                  )}
                </svg>

                {/* Render Nodes */}
                {floorData.nodes.map(node => (
                  <div
                    key={node.nodeId}
                    className={`node-marker 
                            ${selectedNodeId === node.nodeId ? 'selected' : ''}
                            ${(mode === 'connect' && connectionStartNodeId === node.nodeId) ? 'connecting' : ''}
                        `}
                    style={getNodePositionStyle(node)}
                    onClick={(e) => handleNodeClick(e, node.nodeId)}
                    title={`${node.name}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {imageSrc && (
          <div className="status-bar">
            Cursor: X: {mousePos.x} | Y: {mousePos.y} | Zoom: {Math.round(transform.scale * 100)}% | Mode: {mode.toUpperCase()}
          </div>
        )}
      </div>

      <div className="right-panel">
        <div className="panel-section">
          <h2>Floor Details</h2>
          <div className="field-group">
            <label>Floor Name</label>
            <input
              type="text"
              value={floorData.name}
              onChange={e => setFloorData({ ...floorData, name: e.target.value })}
            />
          </div>
          <div className="field-group">
            <label>Level Index</label>
            <input
              type="number"
              value={floorData.level}
              onChange={e => setFloorData({ ...floorData, level: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {selectedNode ? (
          <div className="panel-section node-editor">
            <div className="section-header">
              <h2>Edit Node</h2>
              <button className="danger-btn" onClick={() => deleteNode(selectedNode.nodeId)}>Delete</button>
            </div>
            <div className="field-group">
              <label>Name</label>
              <input
                type="text"
                value={selectedNode.name}
                onChange={e => updateNode(selectedNode.nodeId, 'name', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Type</label>
              <select
                value={selectedNode.type}
                onChange={e => updateNode(selectedNode.nodeId, 'type', e.target.value)}
              >
                <option value="room">Room</option>
                <option value="corridor">Corridor</option>
                <option value="door">Door</option>
                <option value="stairs">Stairs</option>
                <option value="elevator">Elevator</option>
              </select>
            </div>
            <div className="coords-display">
              <span>X: {selectedNode.coordinates.x}</span>
              <span>Y: {selectedNode.coordinates.y}</span>
            </div>
          </div>
        ) : (
          <div className="panel-section">
            <p className="info-text">
              Use <b>Add Node</b> tool to create points.<br />
              Use <b>Connect</b> tool to link them.<br />
              Use <b>Pan/Zoom</b> to navigate.
            </p>
          </div>
        )}

        <div className="panel-section output-section">
          <h2>JSON Output</h2>
          <pre className="json-preview">
            {JSON.stringify(floorData, null, 2)}
          </pre>
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(floorData, null, 2))}
          >
            Copy JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
