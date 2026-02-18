import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, FolderOpen, Clock, Sun, Moon } from 'lucide-react';
import { clearImageFromDB } from './db';

const PROJECTS_KEY = 'floor_map_projects';

function Dashboard({ onSelectProject, theme, toggleTheme }) {
    const [projects, setProjects] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        const savedProjects = localStorage.getItem(PROJECTS_KEY);
        if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
        }
    }, []);

    const handleCreateProject = (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        const newProject = {
            id: uuidv4(),
            name: newProjectName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodeCount: 0
        };

        const updatedProjects = [...projects, newProject];
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
        setProjects(updatedProjects);
        setIsCreating(false);
        setNewProjectName('');

        // Select the new project immediately
        onSelectProject(newProject.id);
    };

    const handleDeleteProject = (e, projectId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
            setProjects(updatedProjects);

            // Cleanup project data
            localStorage.removeItem(`floor_map_data_${projectId}`);
            localStorage.removeItem(`floor_map_transform_${projectId}`);
            clearImageFromDB(projectId);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
                    <button
                        className="tool-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                    >
                        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                    </button>
                </div>
                <h1>WayFinding Projects</h1>
                <p>Manage your indoor navigation maps</p>
            </div>

            <div className="projects-grid">
                {/* New Project Card */}
                <div className="project-card new-project-card" onClick={() => setIsCreating(true)}>
                    {!isCreating ? (
                        <div className="new-project-content">
                            <Plus size={48} />
                            <span>Create New Project</span>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateProject} onClick={e => e.stopPropagation()} className="create-project-form">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Project Name"
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <div className="form-actions">
                                <button type="submit" className="primary-btn">Create</button>
                                <button type="button" className="text-btn" onClick={() => setIsCreating(false)}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Existing Projects */}
                {projects.map(project => (
                    <div key={project.id} className="project-card" onClick={() => onSelectProject(project.id)}>
                        <div className="card-icon">
                            <FolderOpen size={32} />
                        </div>
                        <div className="card-details">
                            <h3>{project.name}</h3>
                            <div className="meta-info">
                                <span><Clock size={12} /> {new Date(project.updatedAt).toLocaleDateString()}</span>
                                {project.nodeCount > 0 && <span>• {project.nodeCount} nodes</span>}
                            </div>
                        </div>
                        <button
                            className="delete-project-btn"
                            onClick={(e) => handleDeleteProject(e, project.id)}
                            title="Delete Project"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
