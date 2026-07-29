import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Film, Trash2 } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [shotCounts, setShotCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      base44.entities.Project.list('-created_date', 50),
      base44.entities.Shot.list('-created_date', 200),
    ]).then(([projs, shots]) => {
      setProjects(projs);
      const counts = {};
      shots.forEach((s) => {
        counts[s.projectId] = (counts[s.projectId] || 0) + 1;
      });
      setShotCounts(counts);
    }).catch(() => {}).finally(() => setLoading(false));
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

  const deleteProject = async (projectId, e) => {
    e.stopPropagation();
    await base44.entities.Project.delete(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
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
            {projects.map((p) => {
              const shotCount = shotCounts[p.id] || 0;
              return (
                <div key={p.id} onClick={() => navigate(`/studio/${p.id}`)} className="p-4 rounded-lg bg-card border border-border hover:border-border-active transition-colors text-left group cursor-pointer">
                  <div className="aspect-video bg-card-raised rounded-md flex items-center justify-center mb-3 relative overflow-hidden">
                    <Film className="w-8 h-8 text-muted-foreground" />
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] rounded bg-background/80 text-secondary-foreground">{p.aspectRatio || '16:9'}</span>
                    {shotCount > 0 && <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[10px] rounded bg-background/80 text-secondary-foreground">{shotCount} shot{shotCount !== 1 ? 's' : ''}</span>}
                    <button onClick={(e) => deleteProject(p.id, e)} className="absolute top-2 left-2 p-1 rounded bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{p.creditBalance ?? 0} credits</span>
                    <span className="text-xs text-muted-foreground">{formatDate(p.updated_date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}