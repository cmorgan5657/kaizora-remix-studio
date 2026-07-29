import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Film } from 'lucide-react';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Project.list('-created_date', 50)
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createProject = async () => {
    const project = await base44.entities.Project.create({
      name: 'Untitled Project',
      aspectRatio: '16:9',
      projectSeed: Math.floor(Math.random() * 1000000),
      seedLocked: false,
      creditBalance: 100,
      activeWorkspace: 'studio',
      budgetCredits: 0,
    });
    navigate(`/studio/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 flex items-center px-6 border-b border-border bg-panel">
        <span className="text-lg font-bold tracking-tight text-foreground">KAIZORA</span>
        <span className="text-xs text-muted-foreground ml-2">Remix Studio</span>
      </header>
      <div className="flex-1 p-8 max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-foreground">Projects</h1>
          <button onClick={createProject} className="px-4 py-2 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-card-raised border-t-accent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Film className="w-12 h-12 text-muted-foreground" />
            <div className="text-sm text-secondary-foreground">No projects yet</div>
            <div className="text-xs text-muted-foreground">Create your first project to get started.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <button key={p.id} onClick={() => navigate(`/studio/${p.id}`)} className="p-4 rounded-lg bg-card border border-border hover:border-border-active transition-colors text-left group">
                <div className="aspect-video bg-card-raised rounded-md flex items-center justify-center mb-3">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.creditBalance ?? 0} credits · {p.aspectRatio || '16:9'}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}