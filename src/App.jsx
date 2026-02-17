import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
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

  const imageRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapClick = (e) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top; // pixel from top

    // Calculate bottom-left origin coordinates
    // Y is inverted: 0 at bottom, height at top
    const xBase = x;
    const yBase = rect.height - y;

    let finalX = xBase;
    let finalY = yBase;

    if (usePercentage) {
      finalX = (xBase / rect.width) * 100;
      finalY = (yBase / rect.height) * 100;
      // Round to 2 decimal places
      finalX = Math.round(finalX * 100) / 100;
      finalY = Math.round(finalY * 100) / 100;
    } else {
        // Round to integer for pixels
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
          nodes: prev.nodes.filter(n => n.nodeId !== id)
      }));
      if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const selectedNode = floorData.nodes.find(n => n.nodeId === selectedNodeId);

  // Mouse move handler for coordinate preview
  const handleMouseMove = (e) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = rect.height - (e.clientY - rect.top);
      
      let finalX = x;
      let finalY = y;

      if (usePercentage) {
        finalX = (x / rect.width) * 100;
        finalY = (y / rect.height) * 100;
      }
      
      setMousePos({ 
          x: usePercentage ? finalX.toFixed(2) : Math.round(finalX), 
          y: usePercentage ? finalY.toFixed(2) : Math.round(finalY) 
      });
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <header>
            <h1>Floor Map Node Maker</h1>
            <div className="controls">
                <label className="toggle">
                    <input 
                        type="checkbox" 
                        checked={usePercentage} 
                        onChange={e => setUsePercentage(e.target.checked)} 
                    />
                    Use Percentage Coordinates (%)
                </label>
            </div>
        </header>
        
        <div className="canvas-area">
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
                className="image-wrapper" 
                onMouseMove={handleMouseMove}
                onClick={handleMapClick}
            >
              <img src={imageSrc} ref={imageRef} alt="Floor Map" draggable={false} />
              
              {/* Render Nodes */}
              {floorData.nodes.map(node => {
                  // Coordinate conversion back to CSS top/left
                  // x is % from left. y is % from BOTTOM.
                  // CSS left = x%. CSS bottom = y%.
                  // Note: If using pixels, need to handle that. CSS works best with % for responsive.
                  // If pixels, we need image dimensions.
                  // For simplicity in display, let's assume if pixels, we still convert to % for display relative to image.
                  let left, bottom;
                  if (usePercentage) {
                      left = node.coordinates.x + '%';
                      bottom = node.coordinates.y + '%'; 
                  } else {
                      // If pixels, we can't easily position purely with CSS unless we know image size right now.
                      // But we are rendering inside image wrapper.
                      left = node.coordinates.x + 'px';
                      bottom = node.coordinates.y + 'px';
                  }

                  return (
                    <div 
                        key={node.nodeId}
                        className={`node-marker ${selectedNodeId === node.nodeId ? 'selected' : ''}`}
                        style={{ left, bottom, position: 'absolute' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(node.nodeId);
                        }}
                        title={`${node.name} (${node.coordinates.x}, ${node.coordinates.y})`}
                    />
                  );
              })}
            </div>
          )}
        </div>
        
        {imageSrc && (
            <div className="status-bar">
                Cursor: X: {mousePos.x} | Y: {mousePos.y}
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
                    onChange={e => setFloorData({...floorData, name: e.target.value})}
                />
            </div>
            <div className="field-group">
                <label>Level Index</label>
                <input 
                    type="number" 
                    value={floorData.level} 
                    onChange={e => setFloorData({...floorData, level: parseInt(e.target.value) || 0})}
                />
            </div>
            <div className="field-group">
                <label>Floor ID</label>
                <input 
                    type="text" 
                    value={floorData.id} 
                    readOnly
                    className="readonly"
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
                        autoFocus
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
                <p className="info-text">Click on the map to add a node or select an existing one.</p>
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
