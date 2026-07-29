const LANES = [
  { key: 'character', label: 'Character', color: 'bg-accent' },
  { key: 'wardrobe', label: 'Wardrobe', color: 'bg-info' },
  { key: 'lighting', label: 'Lighting', color: 'bg-warning' },
  { key: 'environment', label: 'Environment', color: 'bg-success' },
  { key: 'timeOfDay', label: 'Time', color: 'bg-purple-500' },
];

export default function ContinuityRibbon({ shots, flags }) {
  if (!shots || shots.length === 0) return null;

  return (
    <div className="px-6 py-3 border-t border-border bg-panel">
      <span className="panel-title mb-2 block">Continuity Ribbon</span>
      <div className="space-y-1">
        {LANES.map((lane) => (
          <div key={lane.key} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{lane.label}</span>
            <div className="flex-1 flex items-center h-5 relative">
              {shots.map((shot, index) => {
                const breaks = flags?.filter((f) => f.dimension === lane.key && (f.fromShotId === shot.id || f.toShotId === shot.id)) || [];
                return (
                  <div key={shot.id} className="flex items-center" style={{ flex: shot.duration || 5 }}>
                    <div className={`flex-1 h-3 rounded-sm ${lane.color} ${index > 0 ? 'ml-0.5' : ''} opacity-70`} />
                    {breaks.length > 0 && (
                      <div className="absolute top-0 bottom-0 flex items-center" title={breaks[0].description}>
                        <div className="w-0.5 h-5 bg-destructive" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {flags && flags.length > 0 && (
        <div className="mt-3 space-y-1">
          {flags.map((flag) => {
            const fromShot = shots.find((s) => s.id === flag.fromShotId);
            const toShot = shots.find((s) => s.id === flag.toShotId);
            return (
              <div key={flag.id} className="flex items-center gap-2 text-xs text-warning px-2 py-1 rounded bg-warning/10 border border-warning/30">
                <span className="flex-1">{flag.description}</span>
                <span className="text-muted-foreground">{fromShot?.name || '?'} → {toShot?.name || '?'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}