import { useState } from 'react';
import { X, Settings, Lock } from 'lucide-react';

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9', desc: 'Widescreen', class: 'aspect-video' },
  { value: '9:16', label: '9:16', desc: 'Vertical', class: 'aspect-[9/16]' },
  { value: '2.39:1', label: '2.39:1', desc: 'Cinematic', class: 'aspect-[2.39/1]' },
  { value: '1:1', label: '1:1', desc: 'Square', class: 'aspect-square' },
  { value: '4:5', label: '4:5', desc: 'Portrait', class: 'aspect-[4/5]' },
];

export default function ProjectSettings({ project, onClose, onUpdate }) {
  const [aspectRatio, setAspectRatio] = useState(project?.aspectRatio || '16:9');

  const handleSave = () => {
    onUpdate({ aspectRatio });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-panel border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4" /> Project Settings</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Aspect ratio</div>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.value}
                  onClick={() => setAspectRatio(ar.value)}
                  className={`p-2 rounded-md border transition-colors flex flex-col items-center gap-1.5 ${aspectRatio === ar.value ? 'border-accent bg-accent/10' : 'border-border hover:border-border-active'}`}
                >
                  <div className={`w-full max-w-[60px] ${ar.class} bg-card-raised rounded`} />
                  <div className="text-xs text-foreground">{ar.label}</div>
                  <div className="text-[10px] text-muted-foreground">{ar.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-card border border-border">
              <div className="text-xs text-muted-foreground">Credits</div>
              <div className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{project?.creditBalance ?? 0}</div>
            </div>
            <div className="p-3 rounded-md bg-card border border-border">
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{project?.budgetCredits || '—'}</div>
            </div>
          </div>

          <div className="p-3 rounded-md bg-card border border-border">
            <div className="text-xs text-muted-foreground">Project seed</div>
            <div className="text-sm text-foreground tabular-nums mt-0.5 flex items-center gap-1.5">
              {project?.projectSeed || 'Random'}
              {project?.seedLocked && <Lock className="w-3 h-3 text-accent" />}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-secondary-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-1.5 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}