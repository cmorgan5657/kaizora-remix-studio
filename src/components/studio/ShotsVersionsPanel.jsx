import { useState } from 'react';
import { Plus, Film, Clock, Star, GitBranch, Trash2, Scissors, Check, Copy } from 'lucide-react';

export default function ShotsVersionsPanel({ shots, onSelectShot, selectedShotId, versions, onToggleFavorite, onDeleteShot, onAcceptVersion, onRenameShot, onDeleteVersion, onAddShot, onDuplicateShot }) {
  const [editingShotId, setEditingShotId] = useState(null);
  const [editName, setEditName] = useState('');

  const startEdit = (shot) => {
    setEditingShotId(shot.id);
    setEditName(shot.name || `Shot ${shot.orderIndex + 1}`);
  };

  const commitEdit = () => {
    if (editingShotId && editName.trim()) {
      onRenameShot?.(editingShotId, editName.trim());
    }
    setEditingShotId(null);
  };

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="panel-title">Shots & Versions</span>
        <button onClick={onAddShot} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {shots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 pt-12 text-center">
            <Film className="w-8 h-8 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">No shots yet. Generate your first shot to see it here.</div>
          </div>
        ) : (
          shots.map((shot) => (
            <div key={shot.id}>
              <div onClick={() => onSelectShot?.(shot.id)} className={`p-2 rounded-md bg-card border transition-colors cursor-pointer ${selectedShotId === shot.id ? 'border-accent' : 'border-border hover:border-border-active'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-14 h-10 rounded bg-card-raised flex items-center justify-center flex-shrink-0">
                    <Film className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingShotId === shot.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') setEditingShotId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-card-raised border border-border-active rounded px-1.5 py-0.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      <div className="text-sm text-foreground truncate" onDoubleClick={(e) => { e.stopPropagation(); startEdit(shot); }}>{shot.name || `Shot ${shot.orderIndex + 1}`}</div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {shot.duration || 5}s · {shot.qualityTier || 'Draft'}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDuplicateShot?.(shot.id); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" title="Duplicate shot">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteShot?.(shot.id); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {selectedShotId === shot.id && versions && versions.length > 0 && (
                <div className="mt-1.5 ml-2 pl-2 border-l border-border space-y-1">
                  <div className="text-xs text-muted-foreground px-1 py-0.5 flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" /> {versions.length} version{versions.length !== 1 ? 's' : ''}</div>
                  {versions.map((v) => (
                    <div key={v.id} className={`flex items-center gap-2 p-1.5 rounded ${v.isAccepted ? 'bg-success/10 border border-success/30' : 'bg-card-raised'}`}>
                      <div className="w-6 h-6 rounded bg-card flex items-center justify-center flex-shrink-0">
                        <Film className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-foreground flex items-center gap-1">
                          V{v.versionNumber}
                          {v.isPartialRegeneration && <Scissors className="w-2 h-2 text-info" />}
                          {v.isAccepted && <span className="text-success text-[10px] font-medium">ACCEPTED</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{v.creditCost} cr · Seed {v.resolvedSeed}</div>
                      </div>
                      <button onClick={() => onAcceptVersion?.(v.id, shot.id)} className={`p-0.5 transition-colors ${v.isAccepted ? 'text-success' : 'text-muted-foreground hover:text-success'}`} title={v.isAccepted ? 'Accepted' : 'Accept version'}>
                        <Check className={`w-3 h-3 ${v.isAccepted ? 'stroke-[3]' : ''}`} />
                      </button>
                      <button onClick={() => onToggleFavorite?.(v.id, v.isFavorite)} className={`p-0.5 transition-colors ${v.isFavorite ? 'text-warning' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Star className={`w-3 h-3 ${v.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => onDeleteVersion?.(v.id)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors" title="Delete version">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}