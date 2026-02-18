import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import Editor from './Editor';

function App() {
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('floor_map_theme') || 'light';
  });

  // Apply Theme Globaly
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('floor_map_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Create a context or pass props if needed, but for now CSS variables handle the look.
  // We might want a theme toggle in Dashboard too.

  return (
    <>
      <div className="theme-toggle-wrapper" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
        {/* We can put a global theme toggle here or inside components */}
      </div>

      {!currentProjectId ? (
        <Dashboard
          onSelectProject={setCurrentProjectId}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <Editor
          projectId={currentProjectId}
          onBack={() => setCurrentProjectId(null)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </>
  );
}

export default App;
