import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Download, Check, Loader2, Settings, Clapperboard, List, Palette, Mountain, Sun, Film } from 'lucide-react';
import LockNavDropdown from './LockNavDropdown';

const WORKSPACES = [
  { id: 'studio', label: 'STUDIO' },
  { id: 'characters', label: 'CHARACTERS' },
  { id: 'sequence', label: 'SEQUENCE' },
];

export default function TopBar({ project, onRename, activeWorkspace, onWorkspaceChange, saving, onOpenCredits, onExport, canExport, exporting, onOpenSettings, onOpenHelp, directorOpen, onToggleDirector, onRenderFilm, styleLocks, envLocks, lightingLocks, onAddStyleLock, onAddEnvLock, onAddLightingLock, onEditLock, onToggleLockActive }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project?.name || '');
  const inputRef = useRef(null);

  useEffect(() => { setName(project?.name || ''); }, [project?.name]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (name.trim() && name !== project.name) onRename(name.trim());
    else setName(project.name);
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-panel flex-shrink-0 gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link to="/" className="text-base font-bold tracking-tight text-foreground hover:text-accent transition-colors">
          KAIZORA
        </Link>
        <div className="w-px h-5 bg-border" />
        {editing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setName(project.name); setEditing(false); }
            }}
            className="bg-card border border-border-active rounded px-2 py-0.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm text-secondary-foreground hover:text-foreground transition-colors truncate">
            {project?.name || 'Untitled'}
          </button>
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : <><Check className="w-3 h-3" /> Saved</>}
        </span>
      </div>

      <div className="flex items-center gap-0.5 bg-card rounded-md p-0.5 border border-border">
        {WORKSPACES.map((ws) => (
          <button
            key={ws.id}
            onClick={() => onWorkspaceChange(ws.id)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeWorkspace === ws.id ? 'bg-card-raised text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'
            }`}
          >
            {ws.label}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-0.5" />
        <LockNavDropdown label="STYLE" icon={Palette} locks={styleLocks} lockType="StyleLock" onAdd={onAddStyleLock} onEdit={onEditLock} onToggleActive={onToggleLockActive} />
        <LockNavDropdown label="ENV" icon={Mountain} locks={envLocks} lockType="EnvironmentLock" onAdd={onAddEnvLock} onEdit={onEditLock} onToggleActive={onToggleLockActive} />
        <LockNavDropdown label="LIGHT" icon={Sun} locks={lightingLocks} lockType="LightingLock" onAdd={onAddLightingLock} onEdit={onEditLock} onToggleActive={onToggleLockActive} />
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end">
        <div className="flex items-center gap-0.5 bg-card rounded-md p-0.5 border border-border">
          <button onClick={() => { if (!directorOpen) onToggleDirector(); }} className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${directorOpen ? 'bg-card-raised text-accent' : 'text-muted-foreground hover:text-secondary-foreground'}`} title="AI Director">
            <Clapperboard className="w-3.5 h-3.5" /> Director
          </button>
          <button onClick={() => { if (directorOpen) onToggleDirector(); }} className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${!directorOpen ? 'bg-card-raised text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'}`} title="Shots & Versions">
            <List className="w-3.5 h-3.5" /> Shots
          </button>
        </div>
        <button onClick={onOpenCredits} className="text-xs text-secondary-foreground hover:text-accent transition-colors tabular-nums">{project?.creditBalance ?? 0} credits</button>
        <button onClick={onOpenSettings} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Project settings">
          <Settings className="w-4 h-4" />
        </button>
        <button onClick={onOpenHelp} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Keyboard shortcuts">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button onClick={onRenderFilm} className="px-3 py-1.5 text-xs font-medium text-secondary-foreground bg-card-raised border border-border rounded-md hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5" title="Render film from accepted shots">
          <Film className="w-3.5 h-3.5" /> Render Film
        </button>
        <button onClick={onExport} disabled={!canExport || exporting} className="px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
          {exporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…</> : 'Export'}
        </button>
      </div>
    </header>
  );
}