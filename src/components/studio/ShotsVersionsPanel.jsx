import { Plus, Film, Clock, Star, GitBranch } from 'lucide-react';

export default function ShotsVersionsPanel({ shots, onSelectShot, selectedShotId, versions, onToggleFavorite }) {
  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="panel-title">Shots & Versions</span>
        <button className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
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
                    <div className="text-sm text-foreground truncate">{shot.name || `Shot ${shot.orderIndex + 1}`}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {shot.duration || 5}s · {shot.qualityTier || 'Draft'}
                    </div>
                  </div>
                </div>
              </div>
              {selectedShotId === shot.id && versions && versions.length > 0 && (
                <div className="mt-1.5 ml-2 pl-2 border-l border-border space-y-1">
                  <div className="text-xs text-muted-foreground px-1 py-0.5 flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" /> {versions.length} version{versions.length !== 1 ? 's' : ''}</div>
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 p-1.5 rounded bg-card-raised">
                      <div className="w-6 h-6 rounded bg-card flex items-center justify-center flex-shrink-0">
                        <Film className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-foreground">V{v.versionNumber}</div>
                        <div className="text-xs text-muted-foreground">{v.creditCost} cr · Seed {v.resolvedSeed}</div>
                      </div>
                      <button onClick={() => onToggleFavorite?.(v.id, v.isFavorite)} className={`p-0.5 transition-colors ${v.isFavorite ? 'text-warning' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Star className={`w-3 h-3 ${v.isFavorite ? 'fill-current' : ''}`} />
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