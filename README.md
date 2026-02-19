# Indoor Navigation Map NODES Generator

A React-based tool for creating node-based navigation graphs for indoor mapping. This application allows you to upload floor plans, place nodes, create connections, and export the data as JSON for use in wayfinding applications.

## Features

### 1. Project Management
- **Dashboard**: Create and manage multiple mapping projects.
- **Auto-Save**: All work is automatically saved to your browser's local storage.
- **Theme Support**: Toggle between Light and Dark modes.

### 2. Interactive Map Editor
- **Image Upload**: Upload floor plans in PNG, JPG, or SVG formats.
- **Navigation Controls**:
  - **Pan/Zoom**: Smoothly navigate large floor plans using mouse controls or toolbar buttons.
  - **Reset View**: Quickly return to the default view.
- **Node Management**:
  - **Add Nodes**: Click anywhere on the map to place navigation nodes.
  - **Node Types**: Categorize nodes as Rooms, Hallways, Doors, Stairs, or Elevators.
  - **Edit Details**: Rename nodes and adjust their type or coordinates.
  - **Delete**: Remove unwanted nodes.

### 3. Graph Creation
- **Connect Nodes**: Link nodes together to define walkable paths.
- **Visual Feedback**: Connections are visualized as lines overlaying the map.

### 4. Data Export
- **JSON Output**: Real-time generation of the map graph data.
- **Coordinate Systems**: Support for both absolute (pixel) and relative (percentage) coordinates.
- **Copy to Clipboard**: One-click export for easy integration into your backend or app.

## Getting Started

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the development server**:
   ```bash
   npm run dev
   ```

## Usage

1. **Create a Project**: Give your project a name in the dashboard.
2. **Upload Map**: Upload your floor plan image.
3. **Select Mode**:
   - `Select` (Mouse icon): Click nodes to edit properties.
   - `Add Node` (Pin icon): Click on the map to add points.
   - `Connect` (Network icon): Click two nodes consecutively to link them.
   - `Pan` (Move icon): Drag to move around the map.
4. **Export**: Copy the JSON from the right sidebar.

## Data Storage
- **Metadata & Graph Data**: Stored in `localStorage`.
- **Images**: Stored in `IndexedDB` to ensure fast loading and persistence across sessions without re-uploading.
